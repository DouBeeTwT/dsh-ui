#!/bin/bash
# Remove the DSH desktop app and any legacy always-on LaunchAgent.
set -euo pipefail

echo "==> Stopping + removing any legacy LaunchAgent"
BIN="/Applications/DSH.app/Contents/MacOS/DSH"
if [ -x "$BIN" ]; then
  "$BIN" --stop-agent || true
fi

PLIST="$HOME/Library/LaunchAgents/com.deepseek.dsh.web.plist"
if [ -f "$PLIST" ]; then
  rm -f "$PLIST" && echo "  removed $PLIST"
fi

echo "==> Removing app"
if [ ! -w /Applications ]; then
  sudo rm -rf "/Applications/DSH.app"
else
  rm -rf "/Applications/DSH.app"
fi

echo "✅ Uninstalled. Logs and session data (if any) are kept under:"
echo "   ~/Library/Logs/dsh-web.log"
echo "   ~/.dsh"
