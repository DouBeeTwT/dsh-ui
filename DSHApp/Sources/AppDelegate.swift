import AppKit
import WebKit

/// Main application delegate: owns the window, the embedded WebView, the menu
/// bar, and the background-server lifecycle.
@MainActor
final class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate {

    private var window: NSWindow!
    private var webView: WKWebView!
    private var statusTimer: Timer?
    private var isStarting = false
    private var lastServerUp = false

    // MARK: - NSApplicationDelegate

    func applicationDidFinishLaunching(_ notification: Notification) {
        buildMenu()
        buildWindow()
        NSApp.activate(ignoringOtherApps: true)
        startServerAndLoad()
        startStatusTimer()
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        // Closing the desktop App also ends its App-owned backend process.
        return true
    }

    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
        if !flag { window?.makeKeyAndOrderFront(nil) }
        return true
    }

    func applicationWillTerminate(_ notification: Notification) {
        statusTimer?.invalidate()
        statusTimer = nil
        ServerManager.shared.shutdown()
    }

    // MARK: - Setup

    private func buildWindow() {
        let rect = NSRect(x: 0, y: 0, width: 1280, height: 860)
        window = NSWindow(
            contentRect: rect,
            styleMask: [.titled, .closable, .miniaturizable, .resizable],
            backing: .buffered,
            defer: false
        )
        window.title = "DeepSeek Harness"
        window.titleVisibility = .visible
        window.center()
        window.setFrameAutosaveName("DSHMainWindow")
        window.contentMinSize = NSSize(width: 640, height: 420)
        window.collectionBehavior.insert(.fullScreenPrimary)
        window.standardWindowButton(.zoomButton)?.isEnabled = true
        window.isReleasedWhenClosed = false

        // WebView — fills the whole window (no status bar)
        let config = WKWebViewConfiguration()
        config.preferences.javaScriptCanOpenWindowsAutomatically = false
        config.websiteDataStore = .default()
        webView = WKWebView(frame: .zero, configuration: config)
        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.navigationDelegate = self
        webView.allowsBackForwardNavigationGestures = true
        webView.setValue(false, forKey: "drawsBackground")

        let content = window.contentView!
        content.addSubview(webView)

        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: content.topAnchor),
            webView.leadingAnchor.constraint(equalTo: content.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: content.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: content.bottomAnchor),
        ])

        window.makeKeyAndOrderFront(nil)
    }

    // MARK: - Backend lifecycle

    private func startServerAndLoad() {
        guard !isStarting else { return }
        isStarting = true

        Task.detached(priority: .userInitiated) {
            // Always enter through startServer so old always-on LaunchAgents are
            // migrated before checking whether the port is ready.
            _ = ServerManager.shared.startServer()
            // Poll for readiness (dsh web can take a few seconds to boot).
            for _ in 0..<30 {
                if ServerManager.shared.isServerUp() { break }
                try? await Task.sleep(nanoseconds: 1_000_000_000)
            }
            let ready = ServerManager.shared.isServerUp()
            await MainActor.run {
                self.isStarting = false
                self.lastServerUp = ready
                if ready {
                    self.loadURL()
                } else {
                    self.loadWaitingPage()
                }
            }
        }
    }

    private func loadURL() {
        var request = URLRequest(url: ServerManager.shared.serverURL)
        request.timeoutInterval = 5
        webView.load(request)
    }

    private func loadWaitingPage() {
        let html = """
        <!doctype html><html><head><meta charset="utf-8"><style>
        body{font-family:-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;color:#666;background:#fff}
        .box{text-align:center}
        h1{font-size:20px;color:#333;margin-bottom:8px}
        p{font-size:14px}
        </style></head><body><div class="box">
        <h1>DSH 后端未运行</h1>
        <p>请通过顶部菜单「服务 → 启动后端服务」或重新打开 App 启动。</p>
        </div></body></html>
        """
        webView.loadHTMLString(html, baseURL: nil)
    }

    private func startStatusTimer() {
        statusTimer?.invalidate()
        statusTimer = Timer.scheduledTimer(withTimeInterval: 5, repeats: true) { [weak self] _ in
            guard let self else { return }
            Task.detached(priority: .utility) {
                let up = ServerManager.shared.isServerUp()
                await MainActor.run { self.tickServerStatus(up: up) }
            }
        }
    }

    private func tickServerStatus(up: Bool) {
        let changed = up != lastServerUp
        lastServerUp = up
        // Reload automatically if the backend came back up after a failure.
        if up && changed && ServerManager.shared.wantsServerRunning {
            loadURL()
        } else if !up && ServerManager.shared.wantsServerRunning && !isStarting {
            // Keep the service available while the App is open, including after
            // an unexpected backend exit.
            startServerAndLoad()
        }
    }

    // MARK: - Menu actions

    @objc private func openInBrowser() {
        NSWorkspace.shared.open(ServerManager.shared.serverURL)
    }

    @objc private func reloadPage() {
        if ServerManager.shared.isServerUp() {
            loadURL()
        } else {
            startServerAndLoad()
        }
    }

    @objc private func goBack() { webView.goBack() }
    @objc private func goForward() { webView.goForward() }

    @objc private func startServer() {
        startServerAndLoad()
    }

    @objc private func restartServer() {
        Task.detached(priority: .userInitiated) {
            ServerManager.shared.restartServer()
            for _ in 0..<40 {
                if ServerManager.shared.isServerUp() { break }
                try? await Task.sleep(nanoseconds: 1_000_000_000)
            }
            let ready = ServerManager.shared.isServerUp()
            await MainActor.run {
                if ready {
                    self.loadURL()
                }
            }
        }
    }

    @objc private func stopServer() {
        ServerManager.shared.stopServer()
        lastServerUp = false
        loadWaitingPage()
    }

    @objc private func showLog() {
        let logPath = ServerManager.shared.logPath
        FileManager.default.createFile(atPath: logPath, contents: nil)
        NSWorkspace.shared.open(URL(fileURLWithPath: logPath))
    }

    @objc private func showAbout() {
        let alert = NSAlert()
        alert.messageText = "DeepSeek Harness Desktop"
        alert.informativeText = "DSH Web 界面封装 · 后端随 App 启动和退出\n\(ServerManager.shared.checkReport())"
        alert.alertStyle = .informational
        alert.addButton(withTitle: "好")
        alert.runModal()
    }

    // MARK: - Menu construction

    private func buildMenu() {
        let mainMenu = NSMenu()

        // App menu
        let appMenuItem = NSMenuItem()
        mainMenu.addItem(appMenuItem)
        let appMenu = NSMenu()
        appMenu.addItem(withTitle: "关于 DeepSeek Harness", action: #selector(showAbout), keyEquivalent: "")
        appMenu.addItem(.separator())
        appMenu.addItem(withTitle: "隐藏 DSH", action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
        appMenu.addItem(.separator())
        appMenu.addItem(withTitle: "退出 DSH", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        appMenuItem.submenu = appMenu

        // Server menu
        let serverMenuItem = NSMenuItem()
        mainMenu.addItem(serverMenuItem)
        let serverMenu = NSMenu(title: "服务")
        serverMenu.addItem(withTitle: "启动后端服务", action: #selector(startServer), keyEquivalent: "")
        serverMenu.addItem(withTitle: "重启后端服务", action: #selector(restartServer), keyEquivalent: "")
        serverMenu.addItem(withTitle: "停止后端服务", action: #selector(stopServer), keyEquivalent: "")
        serverMenu.addItem(.separator())
        serverMenu.addItem(withTitle: "在默认浏览器中打开", action: #selector(openInBrowser), keyEquivalent: "")
        serverMenu.addItem(withTitle: "查看后端日志", action: #selector(showLog), keyEquivalent: "")
        serverMenuItem.submenu = serverMenu

        // View menu
        let viewMenuItem = NSMenuItem()
        mainMenu.addItem(viewMenuItem)
        let viewMenu = NSMenu(title: "视图")
        viewMenu.addItem(withTitle: "刷新页面", action: #selector(reloadPage), keyEquivalent: "r")
        viewMenu.addItem(withTitle: "后退", action: #selector(goBack), keyEquivalent: "[")
        viewMenu.addItem(withTitle: "前进", action: #selector(goForward), keyEquivalent: "]")
        viewMenuItem.submenu = viewMenu

        // Window menu
        let windowMenuItem = NSMenuItem()
        mainMenu.addItem(windowMenuItem)
        let windowMenu = NSMenu(title: "窗口")
        windowMenu.addItem(withTitle: "最小化", action: #selector(NSWindow.miniaturize(_:)), keyEquivalent: "m")
        windowMenu.addItem(withTitle: "关闭窗口", action: #selector(NSWindow.performClose(_:)), keyEquivalent: "w")
        windowMenuItem.submenu = windowMenu

        NSApp.mainMenu = mainMenu
        NSApp.windowsMenu = windowMenu
    }

    // MARK: - WKNavigationDelegate
    // Open external links in the system browser; keep the DSH origin inside.

    nonisolated func webView(
        _ webView: WKWebView,
        decidePolicyFor navigationAction: WKNavigationAction,
        decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
    ) {
        MainActor.assumeIsolated {
            guard let url = navigationAction.request.url else {
                decisionHandler(.allow)
                return
            }
            let host = url.host?.lowercased() ?? ""
            let isLocal = host == "127.0.0.1" || host == "localhost" || host == "::1"
            if navigationAction.navigationType == .linkActivated && !isLocal {
                NSWorkspace.shared.open(url)
                decisionHandler(.cancel)
            } else {
                decisionHandler(.allow)
            }
        }
    }
}
