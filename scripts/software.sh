
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
  echo "👍 pnpm is already installed via Homebrew, version: $(pnpm --version)"
  echo "⬆️ Checking for pnpm updates..."
  if brew outdated | grep -q '^pnpm$'; then
    echo "🔄 pnpm is outdated. To update, run: brew upgrade pnpm"
  fi
fi

echo "🔍 Checking for Deno installation..."
if ! command -v deno &> /dev/null; then
  echo "📦 Deno not found. Installing via Homebrew..."
  brew install deno
  echo "✅ Deno installed via Homebrew, version: $(deno --version | head -n 1)"
else
  echo "👍 Deno is already installed via Homebrew, version: $(deno --version | head -n 1)"
  echo "⬆️ Checking for deno updates..."
  if brew outdated | grep -q '^deno$'; then
    echo "🔄 Deno is outdated. To update, run: brew upgrade deno"
  fi
fi

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
