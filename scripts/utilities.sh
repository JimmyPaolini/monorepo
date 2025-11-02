#!/bin/bash

echo "🫜 Validating monorepo root directory..."
if [ "$(basename "$(pwd)")" != "monorepo" ] || [ ! -f "package.json" ] || ! grep -q '"name": "monorepo"' package.json 2>/dev/null; then
  echo "❌ Error: This script must be run from the monorepo root directory"
  echo "📁 Current directory: $(pwd)"
  exit 1
fi

echo "🚪 Setting script to exit immediately on error..."
set -e

echo "🔢 Exporting environment variables..."
set -a
source .env

echo "👟 Making all monorepo scripts executable..."
find . -type f -name '*.sh' -print0 | xargs -0 chmod +x || true
