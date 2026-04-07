#!/bin/bash

# Check if pnpm-lock.yaml is in sync with package.json files

# Resolve pnpm: prefer nvm-managed binary so git hooks (which run without a
# login shell) find the same pnpm as the terminal.
if ! command -v pnpm &>/dev/null; then
  NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  NODE_VERSION="$(cat "$(git rev-parse --show-toplevel)/.nvmrc" 2>/dev/null | tr -d '[:space:]')"
  PNPM_BIN="$NVM_DIR/versions/node/$NODE_VERSION/bin/pnpm"
  if [ -x "$PNPM_BIN" ]; then
    export PATH="$(dirname "$PNPM_BIN"):$PATH"
  else
    echo "⚠️  pnpm not found in PATH; skipping lockfile check"
    exit 0
  fi
fi

PNPM_OUTPUT=$(pnpm install --frozen-lockfile 2>&1)
PNPM_EXIT=$?

if [ $PNPM_EXIT -ne 0 ]; then
  echo "❌ pnpm-lock.yaml is out of sync with package.json files"
  echo "💡 Run 'pnpm install' to update the lockfile and try committing again"
  echo ""
  echo "pnpm output:"
  echo "$PNPM_OUTPUT"
  exit 1
fi

echo "🔒 pnpm-lock.yaml is in sync"
