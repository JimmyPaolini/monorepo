#!/usr/bin/env bash

# Ensure the script is run from the monorepo root directory
if [ ! -d ".git" ] && [ "$(basename "$(pwd)")" != "monorepo" ]; then
  echo "🛑 Error: This script must be run from the monorepo root directory." >&2
  exit 1
fi

# Export all variables from .env file
if [ -f ".env" ]; then
  echo "🎛️ Exporting environment variables from .env file..."
  set -a
  source .env
  set +a
fi

# Change to the Terraform infrastructure directory
echo "📂 Changing to infrastructure/terraform directory..."
cd infrastructure/terraform || {
  echo "🛑 Error: Could not change directory to infrastructure/terraform." >&2
  exit 1
}

echo "📝 Running terraform plan..."
terraform plan