#!/bin/bash

# Helper: copy .env.default → .env if missing
setup_env_file() {
  local dir="$1"
  local label="$2"

  if [ ! -f "$dir/.env" ]; then
    if [ -f "$dir/.env.default" ]; then
      cp "$dir/.env.default" "$dir/.env"
      echo "✅ $label .env created from .env.default"
    else
      echo "⚠️  $label .env.default not found. Skipping."
    fi
  else
    echo "👍 $label .env already exists"
  fi
}

echo "🔍 Setting up environment files..."
setup_env_file "." "Root"
setup_env_file "applications/lexico" "Lexico"
setup_env_file "applications/caelundas" "Caelundas"

# Ensure LOCAL_WORKSPACE_FOLDER is set for docker-compose volume mounts
# (devcontainer sets this via remoteEnv; locally we derive it from pwd)
if [ -f ".env" ] && ! grep -q '^LOCAL_WORKSPACE_FOLDER=' .env; then
  echo "" >> .env
  echo "# Local workspace path (used by docker-compose for volume mounts)" >> .env
  echo "LOCAL_WORKSPACE_FOLDER=$(pwd)" >> .env
  echo "✅ Added LOCAL_WORKSPACE_FOLDER to root .env"
fi
