#!/bin/bash
# python.sh — Install uv and Python 3.11+.
#
# uv is the package/environment manager for the affirmations Python project.
# It installs Python itself and manages virtual environments via `uv sync`.
# Python 3.11+ is required for match/case syntax and tomllib used across the project.
#
# Depends on: brew.sh (brew_install_or_check must be defined)

echo "🔍 Checking for uv installation..."
if ! command -v uv &> /dev/null; then
  echo "📦 uv not found. Installing via Homebrew..."
  brew install uv
  echo "✅ uv installed via Homebrew, version: $(uv --version)"
else
  echo "👍 uv is already installed, version: $(uv --version)"
  if brew outdated | grep -q '^uv$'; then
    echo "🔄 uv is outdated. To update, run: brew upgrade uv"
  fi
fi

echo "🔍 Checking for Python 3.11+ installation..."
if ! command -v python3 &> /dev/null || ! python3 -c "import sys; assert sys.version_info >= (3, 11)" 2>/dev/null; then
  echo "📦 Python 3.11+ not found. Installing via uv..."
  uv python install 3.11
  echo "✅ Python installed via uv"
else
  echo "👍 Python is already installed: $(python3 --version)"
fi
