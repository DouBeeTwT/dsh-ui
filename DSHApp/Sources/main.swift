import AppKit
import Foundation

// ── CLI modes (used for diagnostics and old-version migration) ─────────────
let args = CommandLine.arguments

func cliPrint(_ text: String) {
    print(text)
    fflush(stdout)
}

if args.contains("--check") {
    cliPrint("DSH self-check:")
    cliPrint("  " + ServerManager.shared.checkReport())
    exit(ServerManager.shared.isServerUp() ? 0 : 1)
}

if args.contains("--install-agent") {
    ServerManager.shared.cleanupLegacyAgent()
    cliPrint("Always-on LaunchAgent mode has been removed. Open DSH.app to run the backend.")
    exit(0)
}

if args.contains("--stop-agent") {
    ServerManager.shared.cleanupLegacyAgent()
    ServerManager.shared.stopServer()
    cliPrint("Legacy LaunchAgent stopped and removed.")
    exit(0)
}

// ── Normal GUI launch ───────────────────────────────────────────────────────
// Never allow two desktop shells to compete for the one App-owned backend.
// This also covers forced `open -n` launches and copies opened from two paths.
if let bundleIdentifier = Bundle.main.bundleIdentifier {
    let currentPID = ProcessInfo.processInfo.processIdentifier
    if let existing = NSRunningApplication.runningApplications(withBundleIdentifier: bundleIdentifier)
        .first(where: { $0.processIdentifier != currentPID }) {
        existing.activate(options: [.activateAllWindows])
        exit(0)
    }
}

MainActor.assumeIsolated {
    let app = NSApplication.shared
    let delegate = AppDelegate()
    app.delegate = delegate
    app.setActivationPolicy(.regular)
    app.run()
}
