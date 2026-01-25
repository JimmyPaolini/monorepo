#!/bin/bash

echo "🔍 Checking for .env file..."
if [ ! -f ".env" ]; then
  echo "📝 .env file not found. Creating from template..."
  if [ -f ".env.default" ]; then
    cp .env.default .env
    echo "✅ .env file created from .env.default"
  else
    echo "⚠️  .env.default not found. Skipping .env creation."
  fi
fi
