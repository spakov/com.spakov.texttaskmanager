#!/usr/bin/env bash

# Build the text-glyph task manager against the host's exact Plasma version.
# Run this INSIDE the distrobox; it reaches the host via distrobox-host-exec.
set -euo pipefail

# --- Adjust these two to match your setup ---------------------------------
ID="com.spakov.org.kde.plasma.taskmanager"  # your applet ID / CMake target
GLYPHS_DEST="applets/taskmanager/Glyphs.js" # where your patch expects Glyphs.js
# ---------------------------------------------------------------------------

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
WORK="${HOME}/Projects/plasma-desktop"
DEST="${HOME}/.local/lib64/qt6/plugins/plasma/applets"

# Ask the HOST (not the container) which Plasma it runs.
VER="$(distrobox-host-exec rpm -q --qf '%{VERSION}' plasma-desktop)"
echo "==> Host Plasma version: ${VER}"

# Sanity check: warn if the container's Plasma differs from the host's.
CVER="$(rpm -q --qf '%{VERSION}' plasma-desktop 2>/dev/null || echo none)"
if [[ "${CVER}" != "${VER}" ]]; then
  echo "!!  Container has plasma-desktop ${CVER}, host has ${VER}."
  echo "!!  Headers may not match the host; consider aligning them."
fi

# Fresh, shallow source at the matching tag.
rm -rf "${WORK}"
git clone --quiet --depth 1 --branch "v${VER}" \
  https://invent.kde.org/plasma/plasma-desktop "${WORK}"
cd "${WORK}"

# Apply the patch queue, then drop in the glyph map.
echo "==> Applying patches"
git -c user.name=build -c user.email=build@localhost \
  am --quiet "${REPO_DIR}"/patches/*.patch
cp "${REPO_DIR}/Glyphs.js" "${GLYPHS_DEST}"

# Build only our target.
echo "==> Building ${ID}"
cmake -B build -DCMAKE_BUILD_TYPE=Release >/dev/null
cmake --build build --target "${ID}" -j"$(nproc)"

# Install to ~/.local (host /usr is read-only) and reload the panel.
mkdir -p "${DEST}"
find build -name "${ID}.so" -exec cp -v {} "${DEST}/" \;
distrobox-host-exec systemctl --user restart plasma-plasmashell
echo "==> Done"
