#!/usr/bin/env bash

set -euo pipefail

echo "� Installing system dependencies..."
sudo apt-get update -qq && sudo apt-get install -y -qq pipx jq sqlite3
echo "✅ System dependencies installed"

echo "📝 Installing yamllint via pipx..."
pipx install yamllint
pipx ensurepath
echo "✅ Installed yamllint: $(yamllint --version)"

echo "🔍 Checking for .env file..."
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

echo "⚡ Installing supabase CLI..."
LINUX_ARCHITECTURE=$(uname -m)
if [ "$LINUX_ARCHITECTURE" = "aarch64" ] || [ "$LINUX_ARCHITECTURE" = "arm64" ]; then
    SUPABASE_ARCHITECTURE="arm64"
else
    SUPABASE_ARCHITECTURE="amd64"
fi
SUPABASE_VERSION=$(curl -s https://api.github.com/repos/supabase/cli/releases/latest | jq -r '.tag_name')
curl -fsSL "https://github.com/supabase/cli/releases/download/${SUPABASE_VERSION}/supabase_linux_${SUPABASE_ARCHITECTURE}.tar.gz" | sudo tar -xz -C /usr/local/bin
echo "✅ Installed supabase CLI: $(supabase --version)"
