#!/usr/bin/env bash

set -euo pipefail

if ! grep -q 'GPG_TTY' /root/.bashrc 2>/dev/null; then
  echo 'export GPG_TTY=$(tty)' >> /root/.bashrc
  echo "✅ GPG_TTY configured in .bashrc"
fi
export GPG_TTY=$(tty) 2>/dev/null || true

echo "🟢 Node: $(node --version)"
echo "📦 pnpm: $(pnpm --version)"
echo "⚡ Supabase: $(supabase --version)"
echo "🐙 GitHub: $(gh --version)"
echo "☸️ Helm: $(helm version)"
