#!/usr/bin/env bash

set -euo pipefail

echo "🟢 Node: $(node --version)"
echo "📦 pnpm: $(pnpm --version)"
echo "⚡ Supabase: $(supabase --version)"
echo "🐙 GitHub: $(gh --version)"
echo "☸️ Helm: $(helm version)"
