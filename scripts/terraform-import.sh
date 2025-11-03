#!/bin/bash

# Change to the Terraform infrastructure directory
echo "📂 Changing to infrastructure/terraform directory..."
cd infrastructure/terraform || {
  echo "🛑 Error: Could not change directory to infrastructure/terraform." >&2
  exit 1
}

# Update below as needed to import resources
echo "📥 Running terraform import..."
terraform import -input=false linode_lke_cluster.my_cluster "$TF_VAR_linode_kubernetes_engine_cluster_id" || {
  echo "🛑 Error: Terraform import failed." >&2
  exit 1
}