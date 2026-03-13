#!/bin/bash

# Exit on error
set -e

echo "Cleaning up before releasing to GitHub Pages..."

# List of files and directories that are NOT needed for the static site
# We keep index.html, gitignoreToFind.js, and maybe public/ if it's used.
# The user specifically mentioned node_modules.

TO_REMOVE=(
  "node_modules"
  "src"
  ".git"
  ".github"
  "tsconfig.json"
  "package.json"
  "yarn.lock"
  ".env"
  ".env.sh"
  ".esignore"
  ".nvmrc"
  "var"
  "__gitignoretest"
  "bash"
  "bundle.sh"
  "es.mjs"
  "ts.sh"
  "node.config.generated.json"
  "node.config.js"
  "node.config.json"
  "ts-resolver.js"
  "node-suppress-warning.js"
  "xx.cjs"
  "gitignore.ts"
  "cmd.ts"
  "gitignoreToFind.ts"
  ".gitignore"
)

for ITEM in "${TO_REMOVE[@]}"; do
  if [ -e "$ITEM" ]; then
    echo "Removing $ITEM..."
    rm -rf "$ITEM"
  else
    echo "Item $ITEM does not exist, skipping."
  fi
done

echo "Cleanup complete. Remaining files:"
ls -la