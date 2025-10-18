#!/usr/bin/env bash

# Ensure the script is run from the monorepo root directory
if [ ! -d ".git" ] && [ "$(basename "$(pwd)")" != "monorepo" ]; then
  echo "🛑 Error: This script must be run from the monorepo root directory." >&2
  exit 1
fi

set -e

# Check for Homebrew
if ! command -v brew &> /dev/null; then
  echo "🛑 Homebrew not found. Please install Homebrew first: https://brew.sh/" >&2
  exit 1
fi

# Check for pnpm
echo "🔍 Checking for pnpm installation..."
if ! command -v pnpm &> /dev/null; then
  echo "📦 pnpm not found. Installing via Homebrew..."
  brew install pnpm
  echo "✅ pnpm installed via Homebrew, version: $(pnpm --version)"
else
  echo "👍 pnpm is already installed, version: $(pnpm --version)"
fi

echo "🔍 Checking for Terraform installation..."
if ! command -v terraform &> /dev/null; then
  echo "📦 Terraform not found. Installing via Homebrew..."
  brew install terraform
  echo "✅ Terraform installed via Homebrew, version: $(terraform version | head -n 1)"
else
  echo "👍 Terraform is already installed, version: $(terraform version | head -n 1)"
fi
