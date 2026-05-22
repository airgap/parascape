#!/bin/bash
set -euo pipefail

echo "=== Parascape desktop build (macOS) ==="

# Non-interactive SSH on the mac agent doesn't inherit a login PATH, so parabun
# is only reachable via $HOME/.parabun/bin. Install/refresh it first (the
# installer is idempotent and pulls the current release), then make cargo
# reachable too.
export PATH="$HOME/.parabun/bin:$HOME/.cargo/bin:$PATH"
curl -fsSL https://raw.githubusercontent.com/airgap/parabun/main/install.sh | bash
[ -f "$HOME/.cargo/env" ] && . "$HOME/.cargo/env"

parabun --version
command -v cargo >/dev/null || { echo "cargo/rust not installed on the mac agent" >&2; exit 1; }
cargo --version

echo "=== Installing dependencies ==="
parabun install

echo "=== Building dist + staging the parabun sidecar ==="
# PARASCAPE_RUNNER=parabun: tauri-prep.mjs shells out to `<runner> run build`.
# PARABUN_BIN: stage the just-installed parabun as the Tauri sidecar.
PARASCAPE_RUNNER=parabun PARABUN_BIN="$(command -v parabun)" parabun scripts/tauri-prep.mjs

echo "=== Building the .app bundle ==="
# Tauri's built-in DMG bundler fails in headless SSH sessions (needs
# AppleScript/GUI). Build with --bundles app first, then make the DMG by hand.
parabun x tauri build --bundles app

APP_BUNDLE=$(ls -d src-tauri/target/release/bundle/macos/*.app 2>/dev/null | head -1)
[ -n "$APP_BUNDLE" ] || { echo "ERROR: .app bundle not found under src-tauri/target/release/bundle/macos/" >&2; exit 1; }

ARCH=$(uname -m); [ "$ARCH" = "arm64" ] && ARCH="aarch64"
DMG_DIR="src-tauri/target/release/bundle/dmg"
DMG_NAME="Parascape_0.1.0_${ARCH}.dmg"
mkdir -p "$DMG_DIR"

echo "=== Creating DMG manually ==="
# --skip-jenkins keeps create-dmg from running the AppleScript layout step,
# which can't talk to Finder in a headless session. Fall back to plain hdiutil
# if create-dmg isn't installed.
if command -v create-dmg >/dev/null 2>&1; then
    create-dmg --volname "Parascape" --skip-jenkins "$DMG_DIR/$DMG_NAME" "$APP_BUNDLE" \
        || hdiutil create -volname "Parascape" -srcfolder "$APP_BUNDLE" -ov -format UDZO "$DMG_DIR/$DMG_NAME"
else
    hdiutil create -volname "Parascape" -srcfolder "$APP_BUNDLE" -ov -format UDZO "$DMG_DIR/$DMG_NAME"
fi

echo "=== DMG ==="
ls -lh "$DMG_DIR/$DMG_NAME"
