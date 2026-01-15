#!/bin/bash

# Check if pnpm-lock.yaml is in sync with package.json files
if ! pnpm install --frozen-lockfile --prefer-offline > /dev/null 2>&1; then
  echo "❌ pnpm-lock.yaml is out of sync with package.json files"
  echo "💡 Run 'pnpm install' to update the lockfile and try committing again"
  exit 1
fi

echo "🔒 pnpm-lock.yaml is in sync"
