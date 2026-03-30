#!/bin/bash

echo "📦 Installing Node dependencies..."
pnpm install
echo "✅ Node dependencies installed"

echo "🐍 Setting up Python virtual environment for affirmations..."
pushd applications/affirmations > /dev/null
uv sync
echo "✅ Python dependencies installed (applications/affirmations/.venv)"
popd > /dev/null
