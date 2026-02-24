#!/usr/bin/env bash

set -euo pipefail

echo "🔎 Checking for .env file..."
if [ ! -f ".env" ]; then
  if [ -f ".env.default" ]; then
    cp .env.default .env
    echo "✅ .env file created from .env.default"
  else
    echo "⚠️  .env.default not found. Skipping .env creation."
  fi
else
  echo "👍 .env file already exists"
fi

echo "📦 Installing dependencies..."
CI=true pnpm install --frozen-lockfile

echo "⚙️  Syncing VS Code settings..."
pnpm exec tsx .devcontainer/scripts/sync-vscode-settings.ts write || true

echo "🔷 Initialising Nx..."
pnpm exec nx reset && pnpm exec nx graph --file=.nx/graph.json 2>/dev/null || true
