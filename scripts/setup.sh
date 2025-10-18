#!/usr/bin/env bash

# Ensure the script is run from the monorepo root directory
if [ ! -d ".git" ] && [ "$(basename "$(pwd)")" != "monorepo" ]; then
  echo "🛑 Error: This script must be run from the monorepo root directory." >&2
  exit 1
fi

set -e

# Make all monorepo scripts executable
echo "▶️ Making all monorepo scripts executable..."
find . -type f -name '*.sh' -print0 | xargs -0 chmod +x || true

./scripts/software.sh