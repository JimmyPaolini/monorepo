
echo "🔍 Checking for homebrew installation..."
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
  echo "👍 pnpm is already installed via Homebrew, version: $(pnpm --version)"
  echo "⬆️ Checking for pnpm updates..."
  if brew outdated | grep -q '^pnpm$'; then
    echo "🔄 pnpm is outdated. To update, run: brew upgrade pnpm"
  fi
fi

echo "🔍 Checking for nvm installation..."
if ! brew list nvm &> /dev/null; then
  echo "📦 nvm not found. Installing via Homebrew..."
  brew install nvm
  echo "✅ nvm installed via Homebrew."
else
  echo "👍 nvm is already installed via Homebrew."
  echo "⬆️ Checking for nvm updates..."
  if brew outdated | grep -q '^nvm$'; then
    echo "🔄 nvm is outdated. To update, run: brew upgrade nvm"
  fi
fi

# Set up and source nvm
export NVM_DIR="$HOME/.nvm"
mkdir -p "$NVM_DIR"
. "$(brew --prefix nvm)/nvm.sh"

echo "🔍 Checking for node installation..."
nvm install
nvm use
echo "👍 node is installed via nvm, version: $(nvm current)"

echo "🔍 Checking for Terraform installation..."
if ! command -v terraform &> /dev/null; then
  echo "📦 Terraform not found. Installing via Homebrew..."
  brew install terraform
  echo "✅ Terraform installed via Homebrew, version: $(terraform version | head -n 1)"
else
  echo "👍 Terraform is already installed via Homebrew, version: $(terraform version | head -n 1)"
  echo "⬆️ Checking for terraform updates..."
  if brew outdated | grep -q '^terraform$'; then
    echo "🔄 Terraform is outdated. To update, run: brew upgrade terraform"
  fi
fi

echo "🔍 Checking for yamllint installation..."
if ! command -v yamllint &> /dev/null; then
  echo "📦 yamllint not found. Installing via Homebrew..."
  brew install yamllint
  echo "✅ yamllint installed via Homebrew, version: $(yamllint --version)"
else
  echo "👍 yamllint is already installed via Homebrew, version: $(yamllint --version)"
  echo "⬆️ Checking for yamllint updates..."
  if brew outdated | grep -q '^yamllint$'; then
    echo "🔄 yamllint is outdated. To update, run: brew upgrade yamllint"
  fi
fi
