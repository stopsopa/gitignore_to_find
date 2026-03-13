#!/bin/bash

# Exit on error
set -e

function prepend() {
  local file="${1}"
  cat <<EEE > "${file}.tmp"
/*!
 * @homepage https://github.com/stopsopa/gitignore_to_find
 */
EEE
  cat "${file}" >> "${file}.tmp"
  mv "${file}.tmp" "${file}"
}

echo "Bundling gitignoreToFind.js for browser..."
# Bundle gitignoreToFind.ts to the root directory
# Format: ESM (suitable for <script type="module">)
# Platform: neutral (works in both browser and node)
node node_modules/.bin/esbuild src/gitignore_to_find/gitignoreToFind.ts \
  --bundle \
  --format=esm \
  --platform=neutral \
  --outfile=gitignoreToFind.js
prepend gitignoreToFind.js

echo "Bundling cmd.js for node"
# Bundle cmd.ts next to cmd.ts
# Format: ESM
# Platform: neutral (aiming for dual compatibility where possible)
# Note: node:child_process is marked as external for compatibility
node node_modules/.bin/esbuild src/gitignore_to_find/cmd.ts \
  --bundle \
  --format=esm \
  --platform=neutral \
  --external:node:child_process \
  --outfile=cmd.js
prepend cmd.js

echo "Bundling gitignore.js for node"
node node_modules/.bin/esbuild gitignore.ts \
  --bundle \
  --format=esm \
  --platform=node \
  --outfile=gitignore.js
prepend gitignore.js


echo "Done. Bundles created:"
ls -la cmd.js gitignoreToFind.js gitignore.js
