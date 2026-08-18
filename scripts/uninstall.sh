#!/bin/bash
# Remove the DSH desktop app, all bundled plugins, and any legacy
# always-on LaunchAgent.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Stopping + removing any legacy LaunchAgent"
BIN="/Applications/DSH.app/Contents/MacOS/DSH"
if [ -x "$BIN" ]; then
  "$BIN" --stop-agent || true
fi

echo "==> Quitting any running DSH"
pgrep -x DSH >/dev/null 2>&1 && { osascript -e 'tell application "DSH" to quit' 2>/dev/null || true; sleep 1; pkill -x DSH 2>/dev/null || true; sleep 1; } || true

PLIST="$HOME/Library/LaunchAgents/com.deepseek.dsh.web.plist"
if [ -f "$PLIST" ]; then
  rm -f "$PLIST" && echo "  removed $PLIST"
fi

echo "==> Removing bundled plugins"
for spec in token_usage:dsh-client-ui-token-usage user_info:dsh-client-ui-user-info proxy:dsh-client-ui-proxy; do
  dir="${spec%%:*}"; pkg="${spec##*:}"
  if [ -f "$ROOT/plugin/$dir/sync.sh" ]; then
    bash "$ROOT/plugin/$dir/sync.sh" --uninstall || true
  else
    rm -rf "$HOME/.dsh/profiles/node_modules/@deepseek-ai/$pkg"
  fi
done

echo "==> Removing app"
if [ ! -w /Applications ]; then
  sudo rm -rf "/Applications/DSH.app"
else
  rm -rf "/Applications/DSH.app"
fi

echo "✅ Uninstalled. Logs and session data (if any) are kept under:"
echo "   ~/Library/Logs/dsh-web.log"
echo "   ~/.dsh"
