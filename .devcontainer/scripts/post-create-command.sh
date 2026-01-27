#!/usr/bin/env bash

set -euo pipefail

sudo corepack enable
corepack prepare pnpm@10.20.0 --activate
pnpm install --frozen-lockfile

# Install yamllint via pipx for latest version with anchors rule support (requires 1.35.0+)
sudo apt-get update -qq && sudo apt-get install -y -qq pipx
pipx install yamllint
# Create symlink so yamllint is available system-wide for nx tasks
sudo ln -sf "$HOME/.local/bin/yamllint" /usr/local/bin/yamllint

SUPABASE_VERSION=$(curl -s https://api.github.com/repos/supabase/cli/releases/latest | grep '"tag_name":' | cut -d '"' -f 4)
curl -fsSL "https://github.com/supabase/cli/releases/download/${SUPABASE_VERSION}/supabase_linux_amd64.tar.gz" | sudo tar -xz -C /usr/local/bin
