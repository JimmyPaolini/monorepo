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

echo "🔍 Checking for PostgreSQL 18 tools (pg_dump, pg_restore)..."
if ! command -v pg_dump &> /dev/null || ! pg_dump --version | grep -q "18\."; then
  echo "📦 PostgreSQL 18 tools not found or incorrect version. Installing via Homebrew..."
  brew install postgresql@18
  brew link --force --overwrite postgresql@18
  echo "✅ PostgreSQL 18 tools installed and linked."
else
  echo "👍 PostgreSQL 18 tools are already installed."
fi

echo "   PostgreSQL:  $(pg_dump --version 2>&1 || echo 'not installed')"
