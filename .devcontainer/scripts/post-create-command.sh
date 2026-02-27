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

pnpm install --frozen-lockfile

pnpm exec nx reset
pnpm exec nx graph --file=.nx/graph.json 2>/dev/null

pnpm exec tsx .devcontainer/scripts/sync-vscode-settings.ts write
