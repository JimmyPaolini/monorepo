#!/usr/bin/env bash

set -euo pipefail

echo "� Installing system dependencies..."
sudo apt-get update -qq && sudo apt-get install -y -qq pipx jq
echo "✅ System dependencies installed"

echo "📝 Installing yamllint via pipx..."
pipx install yamllint
pipx ensurepath
echo "✅ Installed yamllint: $(yamllint --version)"

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
