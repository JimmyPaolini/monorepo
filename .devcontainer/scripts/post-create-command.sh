#!/usr/bin/env bash

set -euo pipefail

echo "🔑 Installing Gitleaks v${GITLEAKS_VERSION}..."
curl -sSfL \
  "https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz" \
  | tar -xzC /usr/local/bin gitleaks
echo "✅ Gitleaks installed: $(gitleaks version)"

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


echo "�📦 Installing dependencies with pnpm..."
pnpm install --frozen-lockfile
echo "✅ Dependencies installed"

echo "🦭 Resetting Nx cache..."
pnpm exec nx reset
echo "✅ Nx cache reset"

echo "🕸️ Generating Nx project graph..."
pnpm exec nx graph --file=.nx/graph.json 2>/dev/null
echo "✅ Nx project graph generated"

echo "⚙️ Syncing VSCode settings..."
pnpm exec tsx .devcontainer/scripts/sync-vscode-settings.ts write
echo "✅ VSCode settings synced"
