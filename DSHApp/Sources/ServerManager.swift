import Foundation
import Darwin

/// Owns the `dsh web` child process for exactly as long as the desktop App runs.
/// The process has no Terminal window and writes stdout/stderr to a log file.
final class ServerManager {
    static let shared = ServerManager()

    static let port = 3080
    static let legacyLabel = "com.deepseek.dsh.web"

    let serverURL = URL(string: "http://127.0.0.1:\(ServerManager.port)/")!

    var logPath: String { NSHomeDirectory() + "/Library/Logs/dsh-web.log" }

    private var legacyPlistPath: String {
        NSHomeDirectory() + "/Library/LaunchAgents/\(ServerManager.legacyLabel).plist"
    }
    private var legacyWrapperPath: String {
        NSHomeDirectory() + "/Library/Application Support/DSH/dsh-web-agent.sh"
    }
    private var uid: String { "\(getuid())" }
    private var legacyAgentTarget: String { "gui/\(uid)/\(ServerManager.legacyLabel)" }

    private let lifecycleLock = NSLock()
    private let stateLock = NSLock()
    private var serverProcess: Process?
    private var serverLogHandle: FileHandle?
    private var desiredRunning = false
    private var didCleanLegacyAgent = false
    private var isShuttingDown = false

    // MARK: - Health and state

    /// True when 127.0.0.1:3080 is serving the DeepSeek Harness UI.
    func isServerUp() -> Bool {
        let semaphore = DispatchSemaphore(value: 0)
        var up = false
        var request = URLRequest(url: serverURL)
        request.timeoutInterval = 2
        URLSession.shared.dataTask(with: request) { data, response, _ in
            defer { semaphore.signal() }
            guard let data,
                  let body = String(data: data, encoding: .utf8),
                  body.contains("DeepSeek Harness"),
                  let http = response as? HTTPURLResponse,
                  http.statusCode == 200 else { return }
            up = true
        }.resume()
        _ = semaphore.wait(timeout: .now() + 3)
        return up
    }

    var wantsServerRunning: Bool {
        stateLock.lock()
        defer { stateLock.unlock() }
        return desiredRunning
    }

    var isOwnedProcessRunning: Bool {
        stateLock.lock()
        defer { stateLock.unlock() }
        return serverProcess?.isRunning == true
    }

    /// Kept only to detect and migrate installations made by version 0.1.x.
    func isLegacyAgentLoaded() -> Bool {
        let (code, _) = run("/bin/launchctl", ["print", legacyAgentTarget])
        return code == 0
    }

    // MARK: - Start / stop / restart

    /// Starts an App-owned, invisible child process. If an unrelated DSH server
    /// already occupies the port, the App may use it but will never terminate it.
    @discardableResult
    func startServer() -> Bool {
        lifecycleLock.lock()
        defer { lifecycleLock.unlock() }

        // Once App termination begins, a delayed startup task must not be able
        // to leave a new backend process orphaned behind it.
        guard !isShuttingDown else { return false }

        stateLock.lock()
        desiredRunning = true
        if serverProcess?.isRunning == true {
            stateLock.unlock()
            return true
        }
        stateLock.unlock()

        cleanupLegacyAgentIfNeeded()

        // Respect a manually launched DSH instance, but do not claim ownership.
        if isServerUp() { return true }

        guard let dshPath = resolveDshPath() else {
            appendLog("error: dsh executable not found; run: npm install -g @deepseek-ai/dsh")
            return false
        }

        let process = Process()
        if isNodeScript(dshPath) {
            guard let nodePath = resolveNodePath(relativeTo: dshPath) else {
                appendLog("error: node executable not found for \(dshPath)")
                return false
            }
            process.executableURL = URL(fileURLWithPath: nodePath)
            process.arguments = [dshPath, "web", "--port", "\(ServerManager.port)", "--no-open"]
        } else {
            process.executableURL = URL(fileURLWithPath: dshPath)
            process.arguments = ["web", "--port", "\(ServerManager.port)", "--no-open"]
        }

        process.currentDirectoryURL = URL(fileURLWithPath: NSHomeDirectory(), isDirectory: true)
        var environment = ProcessInfo.processInfo.environment
        let executableDirs = [
            URL(fileURLWithPath: dshPath).deletingLastPathComponent().path,
            process.executableURL?.deletingLastPathComponent().path,
        ].compactMap { $0 }
        let oldPath = environment["PATH"] ?? "/usr/bin:/bin:/usr/sbin:/sbin"
        environment["PATH"] = (executableDirs + [oldPath]).joined(separator: ":")
        environment["DSH_WEB_PORT"] = "\(ServerManager.port)"
        process.environment = environment

        do {
            let logsDir = URL(fileURLWithPath: logPath).deletingLastPathComponent().path
            try FileManager.default.createDirectory(atPath: logsDir, withIntermediateDirectories: true)
            if !FileManager.default.fileExists(atPath: logPath) {
                FileManager.default.createFile(atPath: logPath, contents: nil)
            }
            let handle = try FileHandle(forWritingTo: URL(fileURLWithPath: logPath))
            try handle.seekToEnd()
            writeLogLine("launching App-owned backend: \(dshPath) web --port \(ServerManager.port) --no-open", to: handle)
            process.standardOutput = handle
            process.standardError = handle

            process.terminationHandler = { [weak self] finishedProcess in
                guard let self else { return }
                self.stateLock.lock()
                let ownsFinishedProcess = self.serverProcess === finishedProcess
                let handleToClose = ownsFinishedProcess ? self.serverLogHandle : nil
                if ownsFinishedProcess {
                    self.serverProcess = nil
                    self.serverLogHandle = nil
                }
                self.stateLock.unlock()
                try? handleToClose?.close()
                NSLog("DSH: backend exited with status \(finishedProcess.terminationStatus)")
            }

            stateLock.lock()
            serverProcess = process
            serverLogHandle = handle
            stateLock.unlock()

            do {
                try process.run()
            } catch {
                stateLock.lock()
                if serverProcess === process {
                    serverProcess = nil
                    serverLogHandle = nil
                }
                stateLock.unlock()
                process.terminationHandler = nil
                try? handle.close()
                throw error
            }
            return true
        } catch {
            appendLog("error: failed to launch dsh web: \(error)")
            return false
        }
    }

    /// Stops only the process created by this App. An external server is untouched.
    func stopServer() {
        lifecycleLock.lock()
        defer { lifecycleLock.unlock() }
        stopServerLocked()
    }

    /// Permanently blocks new starts and synchronously stops the owned process.
    /// Called from applicationWillTerminate to close the immediate-quit race.
    func shutdown() {
        lifecycleLock.lock()
        defer { lifecycleLock.unlock() }
        isShuttingDown = true
        stopServerLocked()
    }

    private func stopServerLocked() {

        stateLock.lock()
        desiredRunning = false
        let process = serverProcess
        let handle = serverLogHandle
        serverProcess = nil
        serverLogHandle = nil
        process?.terminationHandler = nil
        stateLock.unlock()

        guard let process else {
            try? handle?.close()
            return
        }

        if process.isRunning {
            process.terminate()
            let deadline = Date().addingTimeInterval(3)
            while process.isRunning && Date() < deadline {
                Thread.sleep(forTimeInterval: 0.05)
            }
            if process.isRunning {
                kill(process.processIdentifier, SIGKILL)
            }
            process.waitUntilExit()
        }
        writeLogLine("stopped App-owned backend", to: handle)
        try? handle?.close()
    }

    func restartServer() {
        stopServer()
        _ = startServer()
    }

    /// Removes the old always-on LaunchAgent so upgrades do not keep port 3080 alive.
    func cleanupLegacyAgent() {
        lifecycleLock.lock()
        defer { lifecycleLock.unlock() }
        cleanupLegacyAgentIfNeeded()
    }

    // MARK: - Executable discovery and diagnostics

    func resolveDshPath() -> String? {
        let result = runCapture("/bin/zsh", ["-lic", "command -v dsh"])
        if let path = result.stdout.split(whereSeparator: \.isNewline).last.map(String.init),
           FileManager.default.isExecutableFile(atPath: path) {
            return path
        }

        let home = NSHomeDirectory()
        var candidates: [String] = []
        if let versions = try? FileManager.default.contentsOfDirectory(atPath: home + "/.nvm/versions/node") {
            for version in versions.sorted().reversed() {
                candidates.append(home + "/.nvm/versions/node/\(version)/bin/dsh")
            }
        }
        if let npxRoots = try? FileManager.default.contentsOfDirectory(atPath: home + "/.npm/_npx") {
            for hash in npxRoots {
                candidates.append(home + "/.npm/_npx/\(hash)/node_modules/.bin/dsh")
            }
        }
        candidates += [
            home + "/.npm-global/bin/dsh",
            home + "/.npm/bin/dsh",
            "/opt/homebrew/bin/dsh",
            "/usr/local/bin/dsh",
        ]
        return candidates.first { FileManager.default.isExecutableFile(atPath: $0) }
    }

    func checkReport() -> String {
        let up = isServerUp()
        let owned = isOwnedProcessRunning
        let legacy = isLegacyAgentLoaded()
        let dsh = resolveDshPath() ?? "(not found)"
        let node = resolveNodePath(relativeTo: dsh) ?? "(not found)"
        return "server_up=\(up) owned_process=\(owned) legacy_agent=\(legacy) dsh=\(dsh) node=\(node) url=\(serverURL.absoluteString)"
    }

    // MARK: - Helpers

    private func cleanupLegacyAgentIfNeeded() {
        guard !didCleanLegacyAgent else { return }
        didCleanLegacyAgent = true

        if isLegacyAgentLoaded() {
            _ = run("/bin/launchctl", ["bootout", legacyAgentTarget])
        }
        for path in [legacyPlistPath, legacyWrapperPath] where FileManager.default.fileExists(atPath: path) {
            do {
                try FileManager.default.removeItem(atPath: path)
                appendLog("removed legacy always-on service file: \(path)")
            } catch {
                appendLog("warning: could not remove legacy service file \(path): \(error)")
            }
        }
    }

    private func resolveNodePath(relativeTo dshPath: String) -> String? {
        let sibling = URL(fileURLWithPath: dshPath).deletingLastPathComponent().appendingPathComponent("node").path
        if FileManager.default.isExecutableFile(atPath: sibling) { return sibling }

        let result = runCapture("/bin/zsh", ["-lic", "command -v node"])
        if let path = result.stdout.split(whereSeparator: \.isNewline).last.map(String.init),
           FileManager.default.isExecutableFile(atPath: path) {
            return path
        }
        return ["/opt/homebrew/bin/node", "/usr/local/bin/node"]
            .first { FileManager.default.isExecutableFile(atPath: $0) }
    }

    private func isNodeScript(_ path: String) -> Bool {
        guard let handle = FileHandle(forReadingAtPath: path) else { return false }
        defer { try? handle.close() }
        let prefix = handle.readData(ofLength: 256)
        guard let text = String(data: prefix, encoding: .utf8), text.hasPrefix("#!") else { return false }
        return text.split(whereSeparator: \.isNewline).first?.contains("node") == true
    }

    private func appendLog(_ message: String) {
        let logsDir = URL(fileURLWithPath: logPath).deletingLastPathComponent().path
        try? FileManager.default.createDirectory(atPath: logsDir, withIntermediateDirectories: true)
        if !FileManager.default.fileExists(atPath: logPath) {
            FileManager.default.createFile(atPath: logPath, contents: nil)
        }
        guard let handle = FileHandle(forWritingAtPath: logPath) else { return }
        defer { try? handle.close() }
        _ = try? handle.seekToEnd()
        writeLogLine(message, to: handle)
    }

    private func writeLogLine(_ message: String, to handle: FileHandle?) {
        guard let handle,
              let data = "[\(Self.logTimestamp.string(from: Date()))] \(message)\n".data(using: .utf8) else { return }
        handle.write(data)
    }

    @discardableResult
    private func run(_ path: String, _ args: [String]) -> (Int32, String) {
        let result = runCapture(path, args)
        let text = [result.stdout, result.stderr].filter { !$0.isEmpty }.joined(separator: "\n")
        return (result.code, text)
    }

    private func runCapture(_ path: String, _ args: [String]) -> (code: Int32, stdout: String, stderr: String) {
        let process = Process()
        process.executableURL = URL(fileURLWithPath: path)
        process.arguments = args
        let out = Pipe()
        let err = Pipe()
        process.standardOutput = out
        process.standardError = err
        do {
            try process.run()
        } catch {
            return (-1, "", "\(error)")
        }
        process.waitUntilExit()
        let stdout = String(data: out.fileHandleForReading.readDataToEndOfFile(), encoding: .utf8) ?? ""
        let stderr = String(data: err.fileHandleForReading.readDataToEndOfFile(), encoding: .utf8) ?? ""
        return (process.terminationStatus, stdout, stderr)
    }

    private static let logTimestamp: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
        return formatter
    }()
}
