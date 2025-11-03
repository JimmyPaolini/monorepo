#!/bin/bash

# Change to the Terraform infrastructure directory
echo "📂 Changing to infrastructure/terraform directory..."
cd infrastructure/terraform || {
  echo "🛑 Error: Could not change directory to infrastructure/terraform." >&2
  exit 1
}

echo "📝 Running terraform plan..."
terraform plan