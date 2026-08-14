#!/bin/bash
# Ensure every prerequisite for building DSH.app is present, auto-installing
# anything that is missing. This is what makes the project "clone, run, done":
# users who downloaded the source from git get their missing tools installed.
#
# Detects / installs, in order:
#   1. macOS                    (hard requirement)
#   2. Xcode Command Line Tools (needed to compile Swift)
#   3. Homebrew                 (used to install Node.js; skipped if absent)
#   4. Node.js + npm            (needed to run/install dsh)
#   5. dsh  (@deepseek-ai/dsh)  (the CLI the app wraps)
#
# Usage:
#   bash scripts/bootstrap.sh             interactive (asks before installing)
#   bash scripts/bootstrap.sh --yes       auto-install every missing dependency
#   bash scripts/bootstrap.sh --check     only report what is missing, no changes
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# ---------------------------------------------------------------- helpers
RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; BLUE=$'\033[34m'; RESET=$'\033[0m'
info() { printf '%s==> %s%s\n' "$BLUE" "$*" "$RESET"; }
ok()   { printf '    %s✔ %s%s\n' "$GREEN" "$*" "$RESET"; }
warn() { printf '    %s! %s%s\n' "$YELLOW" "$*" "$RESET" >&2; }
die()  { printf '%sError: %s%s\n' "$RED" "$*" "$RESET" >&2; exit 1; }

AUTO=0
CHECK=0
for arg in "$@"; do
  case "$arg" in
    --yes|-y)      AUTO=1 ;;
    --check)       CHECK=1 ;;
    --help|-h)
      sed -n '2,16p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *) die "unknown option: $arg (see --help)" ;;
  esac
done

confirm() { # confirm "question" -> true/false (yes by default)
  [ "$AUTO" -eq 1 ] && return 0
  local ans
  while true; do
    printf '    %s [Y/n] ' "$1"
    read -r ans
    case "${ans:-y}" in
      y|Y|yes|YES) return 0 ;;
      n|N|no|NO)   return 1 ;;
      *) echo "    Please answer y or n." ;;
    esac
  done
}

# Resolve a command through the normal PATH and the user's login-shell PATHs,
# which covers nvm / brew / npx style setups where bash may not see them.
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

# Make freshly-installed brew/node/npm visible in this shell.
refresh_path() {
  for d in /opt/homebrew/bin /usr/local/bin; do
    case ":$PATH:" in
      *":$d:"*) ;;
      *) [ -d "$d" ] && PATH="$d:$PATH" ;;
    esac
  done
  export PATH
}

# ------------------------------------------------- 1. macOS
[ "$(uname -s)" = "Darwin" ] || die "DSH Desktop can only be built on macOS."

# ------------------------------------------------- 2. Xcode Command Line Tools
ensure_xcode_clt() {
  if [ -x /Library/Developer/CommandLineTools/usr/bin/swiftc ] \
     || xcrun --find swiftc >/dev/null 2>&1; then
    ok "Xcode Command Line Tools"
    return 0
  fi
  warn "Xcode Command Line Tools are missing (needed to compile DSH.app)."
  [ "$CHECK" -eq 1 ] && return 1

  if ! confirm "Install Xcode Command Line Tools now? (a system dialog will appear; can take several minutes)"; then
    return 1
  fi
  info "Triggering Xcode Command Line Tools install..."
  xcode-select --install >/dev/null 2>&1 || true
  echo "    If a system dialog opened, click 'Install' / 'Agree' to continue."
  local n=0
  while [ ! -x /Library/Developer/CommandLineTools/usr/bin/swiftc ] \
        && ! xcrun --find swiftc >/dev/null 2>&1; do
    n=$((n + 1))
    if [ "$n" -gt 600 ]; then   # ~20 minutes
      echo ""
      die "Timed out waiting for Xcode Command Line Tools. Run 'xcode-select --install' manually, then re-run this script."
    fi
    sleep 2
  done
  sudo xcode-select --switch /Library/Developer/CommandLineTools 2>/dev/null || true
  ok "Xcode Command Line Tools installed."
}

# ------------------------------------------------- 3. Homebrew
ensure_homebrew() {
  if command -v brew >/dev/null 2>&1; then
    ok "Homebrew"
    return 0
  fi
  warn "Homebrew is missing (used to install Node.js easily)."
  [ "$CHECK" -eq 1 ] && return 1

  if ! confirm "Install Homebrew now? (official installer; needs admin password, can take a few minutes)"; then
    return 1
  fi
  info "Installing Homebrew..."
  if ! NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" </dev/null; then
    die "Homebrew install failed. See the output above, or install it manually from https://brew.sh"
  fi
  refresh_path
  if command -v brew >/dev/null 2>&1; then
    ok "Homebrew installed."
    return 0
  fi
  warn "Homebrew installed but not on this shell's PATH yet."
  return 1
}

# ------------------------------------------------- 4. Node.js + npm
node_latest_lts() { # print the newest LTS version string (e.g. v22.19.0)
  if [ -x /usr/bin/python3 ]; then
    /usr/bin/python3 - <<'PY' 2>/dev/null || true
import json, urllib.request
try:
    data = json.load(urllib.request.urlopen("https://nodejs.org/dist/index.json", timeout=20))
except Exception:
    raise SystemExit(1)
for entry in data:
    if entry.get("lts"):
        print(entry["version"])
        break
PY
  fi
}

ensure_node() {
  if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    ok "Node.js + npm ($(node -v))"
    return 0
  fi
  warn "Node.js / npm are missing (required to install and run dsh)."
  [ "$CHECK" -eq 1 ] && return 1

  if command -v brew >/dev/null 2>&1 && confirm "Install Node.js via Homebrew? (brew install node)"; then
    info "Installing Node.js via Homebrew..."
    brew install node || die "brew install node failed. See the output above."
    refresh_path
  elif confirm "Download and install the official Node.js LTS package? (needs admin password)"; then
    info "Downloading Node.js LTS installer..."
    local ver pkg
    ver="$(node_latest_lts)"
    [ -n "$ver" ] || ver="v22.19.0"   # pinned fallback if the lookup fails
    pkg="/tmp/node-${ver}.pkg"
    curl -fL --retry 3 -o "$pkg" "https://nodejs.org/dist/${ver}/node-${ver}.pkg" \
      || die "Failed to download Node.js $ver. Get it manually from https://nodejs.org and re-run."
    sudo installer -pkg "$pkg" -target / || die "Node.js installer failed."
    rm -f "$pkg"
    refresh_path
  else
    return 1
  fi

  if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    ok "Node.js + npm ($(node -v))"
    return 0
  fi
  warn "Node.js still not on PATH. Open a new Terminal and re-run this script."
  return 1
}

# ------------------------------------------------- 5. dsh
ensure_dsh() {
  local dsh_path npm_path
  dsh_path="$(resolve_command dsh || true)"
  if [ -n "$dsh_path" ] && [ -x "$dsh_path" ]; then
    ok "dsh ($dsh_path)"
    return 0
  fi
  warn "@deepseek-ai/dsh (the 'dsh' CLI) is missing."
  [ "$CHECK" -eq 1 ] && return 1

  if ! confirm "Install it globally now? (npm install -g @deepseek-ai/dsh)"; then
    return 1
  fi
  npm_path="$(resolve_command npm || true)"
  [ -n "$npm_path" ] || die "npm is still unavailable. Install Node.js first (see the messages above)."
  info "Installing @deepseek-ai/dsh..."
  if ! "$npm_path" install -g @deepseek-ai/dsh; then
    warn "Global npm install failed — retrying with sudo."
    sudo "$npm_path" install -g @deepseek-ai/dsh \
      || die "Automatic dsh install failed. Run 'npm install -g @deepseek-ai/dsh' manually, then re-run."
  fi
  dsh_path="$(resolve_command dsh || true)"
  if [ -z "$dsh_path" ] && [ -n "$npm_path" ]; then
    dsh_path="$(dirname "$npm_path")/dsh"
  fi
  if [ -n "$dsh_path" ] && [ -x "$dsh_path" ]; then
    ok "dsh installed ($dsh_path)"
    return 0
  fi
  warn "dsh installed but not on PATH. Open a new Terminal and re-run."
  return 1
}

# ---------------------------------------------------------------- main
refresh_path

info "Checking prerequisites..."
MISSING=0
ensure_xcode_clt || MISSING=1
ensure_homebrew || MISSING=1
ensure_node     || MISSING=1
ensure_dsh      || MISSING=1

if [ "$CHECK" -eq 1 ]; then
  echo ""
  if [ "$MISSING" -eq 0 ]; then
    echo "✅ All prerequisites are present."
    exit 0
  fi
  echo "⚠  Some prerequisites are missing (listed above). Run 'bash scripts/bootstrap.sh' to install them."
  exit 1
fi

if [ "$MISSING" -ne 0 ]; then
  echo ""
  die "Prerequisites were not fully installed. Re-run with '--yes' to auto-install everything, or install the missing tools manually."
fi

echo ""
echo "✅ All prerequisites ready."
