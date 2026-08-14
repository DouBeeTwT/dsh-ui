#!/bin/bash
# Build the DSH desktop app into build/DSH.app
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

APP_NAME="DSH"
BUILD_DIR="$ROOT/build"
APP_DIR="$BUILD_DIR/$APP_NAME.app"
CONTENTS="$APP_DIR/Contents"
MACOS_DIR="$CONTENTS/MacOS"
RES_DIR="$CONTENTS/Resources"
MODCACHE="$ROOT/.swiftmodcache"

echo "==> Preparing bundle layout"
rm -rf "$APP_DIR"
mkdir -p "$MACOS_DIR" "$RES_DIR" "$MODCACHE"

echo "==> Compiling Swift sources (module cache: $MODCACHE)"
# NOTE: custom -module-cache-path keeps the toolchain working under a file sandbox.
xcrun swiftc \
  -O \
  -swift-version 5 \
  -module-cache-path "$MODCACHE" \
  -o "$MACOS_DIR/$APP_NAME" \
  DSHApp/Sources/main.swift \
  DSHApp/Sources/ServerManager.swift \
  DSHApp/Sources/AppDelegate.swift \
  -framework AppKit -framework WebKit

echo "==> Installing Info.plist + icon"
cp DSHApp/Info.plist "$CONTENTS/Info.plist"
printf 'APPL????' > "$CONTENTS/PkgInfo"

# Generate the app icon (1024px PNG -> iconset -> icns)
ICON_TOOL="$ROOT/DSHApp/tools/make_icon.swift"
ICON_SOURCE="$ROOT/DSHApp/Assets/AppIconSource.png"
ICONSET_DIR="$BUILD_DIR/AppIcon.iconset"
rm -rf "$ICONSET_DIR"
mkdir -p "$ICONSET_DIR"
xcrun swiftc -O -swift-version 5 -module-cache-path "$MODCACHE" \
  "$ICON_TOOL" -o "$BUILD_DIR/make_icon" 2>/dev/null || {
  echo "  (icon generator skipped — using generic icon)"
}
if [ -x "$BUILD_DIR/make_icon" ]; then
  "$BUILD_DIR/make_icon" "$ICONSET_DIR" "$RES_DIR/AppIcon.icns" "$ICON_SOURCE"
  echo "  icon generated -> $RES_DIR/AppIcon.icns"
fi

echo "==> Ad-hoc code signing"
codesign --force --deep --sign - "$APP_DIR" 2>/dev/null || true

echo "==> Done: $APP_DIR"
