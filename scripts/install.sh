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

RED=$'\033[31m'; GREEN=$'\033[32m'; BLUE=$'\033[34m'; RESET=$'\033[0m'
info() { printf '%s==> %s%s\n' "$BLUE" "$*" "$RESET"; }
ok()   { printf '    %s✔ %s%s\n' "$GREEN" "$*" "$RESET"; }
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

echo ""
echo "✅ Installed. Open the app from /Applications or run:"
echo "   open /Applications/$APP_NAME"
echo ""
echo "The dsh web backend starts silently with DSH.app and stops when the App exits."
echo "   logs: ~/Library/Logs/dsh-web.log"
