#!/bin/bash

# Helper: install or report a Homebrew formula
brew_install_or_check() {
  local name="$1"
  local tap="$2" # optional tap path, e.g. "supabase/tap/supabase"
  local formula="${tap:-$name}"

  echo "🔍 Checking for $name installation..."
  if ! command -v "$name" &> /dev/null; then
    echo "📦 $name not found. Installing via Homebrew..."
    brew install "$formula"
    echo "✅ $name installed via Homebrew"
  else
    echo "👍 $name is already installed"
    if brew outdated | grep -q "$name"; then
      echo "🔄 $name is outdated. To update, run: brew upgrade $formula"
    fi
  fi
}

echo "🔍 Checking for Homebrew installation..."
if ! command -v brew &> /dev/null; then
  echo "🛑 Homebrew not found. Please install Homebrew first: https://brew.sh/" >&2
  exit 1
fi

# ── Node.js (via nvm) ──────────────────────────────────────────────
echo "🔍 Checking for nvm installation..."
if ! brew list nvm &> /dev/null; then
  echo "📦 nvm not found. Installing via Homebrew..."
  brew install nvm
  echo "✅ nvm installed via Homebrew."
else
  echo "👍 nvm is already installed via Homebrew."
  if brew outdated | grep -q '^nvm$'; then
    echo "🔄 nvm is outdated. To update, run: brew upgrade nvm"
  fi
fi

export NVM_DIR="$HOME/.nvm"
mkdir -p "$NVM_DIR"
. "$(brew --prefix nvm)/nvm.sh"

echo "🔍 Installing Node.js from .nvmrc..."
nvm install
nvm use
echo "👍 Node.js $(nvm current)"

# ── Husky (git hooks) ──────────────────────────────────────────────
# Husky runs hooks in a restricted shell that doesn't load shell profiles,
# so node (nvm) and python tools (pyenv/uv) won't be in PATH without this init file.
echo "🔍 Setting up husky init..."
mkdir -p "$HOME/.config/husky"
HUSKY_INIT_FILE="$HOME/.config/husky/init.sh"
if [ ! -f "$HUSKY_INIT_FILE" ] || ! grep -q 'local/bin' "$HUSKY_INIT_FILE"; then
  cat > "$HUSKY_INIT_FILE" << 'HUSKY_INIT'
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# uv is installed to ~/.local/bin by its installer
export PATH="$HOME/.local/bin:$PATH"
HUSKY_INIT
  echo "✅ Updated ~/.config/husky/init.sh to source nvm and uv in git hooks"
else
  echo "👍 ~/.config/husky/init.sh already configured"
fi

# ── JavaScript / Monorepo tools ────────────────────────────────────
brew_install_or_check "pnpm"

# ── Python (via uv) ────────────────────────────────────────────────
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

# ── Ollama (local LLM) ─────────────────────────────────────────────
brew_install_or_check "ollama"

echo "🦙 Ensuring Ollama is running..."
if ! curl -sf http://localhost:11434/api/version &>/dev/null; then
  echo "🚀 Starting Ollama..."
  if brew services list | grep -q ollama; then
    brew services start ollama
  else
    ollama serve &>/dev/null &
    disown
  fi
  echo "⏳ Waiting for Ollama to be ready..."
  for i in {1..15}; do
    if curl -sf http://localhost:11434/api/version &>/dev/null; then
      break
    fi
    sleep 1
  done
fi
echo "✅ Ollama is running"

echo "🦙 Pulling default model (qwen3.5:0.8b)..."
ollama pull qwen3.5:0.8b

# ── Docker ──────────────────────────────────────────────────────────
echo "🔍 Checking for Docker installation..."
if ! command -v docker &> /dev/null; then
  echo "⚠️  Docker not found. Install Docker Desktop: https://www.docker.com/products/docker-desktop/"
  echo "   Docker is needed for SearxNG, Open WebUI, and caelundas."
else
  echo "👍 Docker is installed: $(docker --version)"
  if ! docker info &>/dev/null 2>&1; then
    echo "⚠️  Docker daemon is not running. Please start Docker Desktop."
  fi
fi

# ── Infrastructure / DevOps tools ──────────────────────────────────
brew_install_or_check "terraform"
brew_install_or_check "yamllint"
brew_install_or_check "supabase" "supabase/tap/supabase"
brew_install_or_check "jq"
brew_install_or_check "gh"
brew_install_or_check "helm"
brew_install_or_check "kubectl" "kubernetes-cli"

echo ""
echo "📋 Installed tool versions:"
echo "   Node.js:     $(node --version)"
echo "   pnpm:        $(pnpm --version)"
echo "   Python:      $(python3 --version 2>&1)"
echo "   uv:          $(uv --version)"
echo "   Ollama:      $(ollama --version 2>&1)"
echo "   Terraform:   $(terraform version -json 2>/dev/null | jq -r '.terraform_version' 2>/dev/null || terraform version | head -n 1)"
echo "   Supabase:    $(supabase --version 2>&1)"
echo "   Helm:        $(helm version --short 2>&1)"
echo "   kubectl:     $(kubectl version --client --short 2>/dev/null || kubectl version --client 2>&1 | head -n 1)"
echo "   Docker:      $(docker --version 2>&1 || echo 'not installed')"
