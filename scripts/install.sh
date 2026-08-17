#!/bin/bash
# Install DSH.app: first ensure every prerequisite via scripts/bootstrap.sh
# (auto-installing anything missing), then build from source and install to
# /Applications. Options are forwarded to bootstrap.sh:
#
#   bash install.sh            interactive
#   bash install.sh --yes      auto-install any missing prerequisites
#   bash install.sh --check    only verify prerequisites, then exit
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; BLUE=$'\033[34m'; RESET=$'\033[0m'
info() { printf '%s==> %s%s\n' "$BLUE" "$*" "$RESET"; }
ok()   { printf '    %s✔ %s%s\n' "$GREEN" "$*" "$RESET"; }
warn() { printf '    %s! %s%s\n' "$YELLOW" "$*" "$RESET" >&2; }
die()  { printf '%sError: %s%s\n' "$RED" "$*" "$RESET" >&2; exit 1; }

CHECK=0
for arg in "$@"; do
  [ "$arg" = "--check" ] && CHECK=1
done

resolve_command() {
  local name="$1" resolved=""
  resolved="$(command -v "$name" 2>/dev/null || true)"
  if [ -z "$resolved" ]; then
    resolved="$(/bin/zsh -lic "command -v $name" 2>/dev/null | tail -n 1 || true)"
  fi
  if [ -n "$resolved" ] && [ -x "$resolved" ]; then
    printf '%s\n' "$resolved"
    return 0
  fi
  return 1
}

info "Checking and installing prerequisites"
if ! bash "$ROOT/scripts/bootstrap.sh" "$@"; then
  echo ""
  if [ "$CHECK" -eq 1 ]; then
    exit 1
  fi
  die "Prerequisites are not fully installed (see above). Re-run with '--yes' to auto-install everything: bash install.command --yes"
fi
if [ "$CHECK" -eq 1 ]; then
  ok "All prerequisites present — nothing else to do."
  echo ""
  echo "  Plugin status:"
  PLUGIN_DIR="$ROOT/plugin/token_usage"
  PLUGIN_LINK="$HOME/.dsh/profiles/node_modules/@deepseek-ai/dsh-client-ui-token-usage"
  MANIFEST="$HOME/.dsh/profiles/web/package.json"
  TYPERT_LINK="$PLUGIN_DIR/node_modules/@deepseek-ai/dsh-typert-protocol"
  if [ -L "$PLUGIN_LINK" ] && [ "$(readlink "$PLUGIN_LINK")" = "$PLUGIN_DIR" ]; then
    ok "token-usage plugin: installed (symlink OK)"
  else
    warn "token-usage plugin: not installed (run install.command to set it up)"
  fi
  if [ -f "$MANIFEST" ] && python3 -c "
import json, sys
m = json.load(open('$MANIFEST'))
sys.exit(0 if '@deepseek-ai/dsh-client-ui-token-usage' in m.get('dsh', {}).get('profile', {}).get('bundles', []) else 1)
" 2>/dev/null; then
    ok "token-usage composition: bundle declared in profile manifest"
  else
    warn "token-usage composition: missing from $MANIFEST"
  fi
  if [ -L "$TYPERT_LINK" ]; then
    ok "token-usage typert-protocol link: OK"
  else
    warn "token-usage typert-protocol link: missing (run install.command to set it up)"
  fi
  exit 0
fi

DSH_PATH="$(resolve_command dsh || true)"
if [ -z "$DSH_PATH" ] || [ ! -x "$DSH_PATH" ]; then
  die "dsh could not be located after setup. Open a new Terminal and re-run."
fi
ok "Using dsh: $DSH_PATH"

info "Building DSH.app"
bash DSHApp/build.sh

APP_DIR="$ROOT/build/DSH.app"
APP_NAME="DSH.app"

info "Quitting any running DSH (for a clean overwrite)"
if pgrep -x DSH >/dev/null 2>&1; then
  osascript -e 'tell application "DSH" to quit' 2>/dev/null || true
  sleep 1
  pgrep -x DSH >/dev/null 2>&1 && pkill -x DSH 2>/dev/null || true
  sleep 1
  echo "  DSH stopped."
else
  echo "  DSH is not running."
fi

info "Installing to /Applications"
if [ ! -w /Applications ]; then
  echo "  /Applications not writable — attempting sudo (you may be prompted)."
  sudo rm -rf "/Applications/$APP_NAME"
  sudo cp -R "$APP_DIR" "/Applications/$APP_NAME"
else
  rm -rf "/Applications/$APP_NAME"
  cp -R "$APP_DIR" "/Applications/$APP_NAME"
fi

info "Removing any legacy always-on LaunchAgent"
"/Applications/$APP_NAME/Contents/MacOS/DSH" --stop-agent || true

info "Installing token-usage plugin (symlinks + bundle composition + history backfill)"
bash "$ROOT/plugin/token_usage/sync.sh" --install

echo ""
echo "✅ Installed. Open the app from /Applications or run:"
echo "   open /Applications/$APP_NAME"
echo ""
echo "The dsh web backend starts silently with DSH.app and stops when the App exits."
echo "   logs: ~/Library/Logs/dsh-web.log"
echo ""
echo "The token-usage plugin is symlinked into ~/.dsh/profiles (bundle composition);"
echo "pre-install usage was backfilled into ~/.dsh/usage-stats.backfill.json and is"
echo "merged into the ledger on first start."
echo "Verify it with:  bash plugin/token_usage/sync.sh --verify"
