#!/bin/bash
# database.sh — Install database related tools
#
# squawk — Linter for PostgreSQL, focused on migrations

echo "🔍 Checking for squawk installation..."
if ! command -v squawk &> /dev/null; then
  echo "📦 squawk not found. Installing via pnpm..."
  # Squawk is distributed as squawk-cli on npm and we install it globally 
  # so it is available as a native binary for lint-staged
  pnpm add -g squawk-cli
  echo "✅ squawk installed via pnpm."
else
  echo "👍 squawk is already installed."
fi

echo "   Squawk:      $(squawk --version 2>&1 || echo 'not installed')"
