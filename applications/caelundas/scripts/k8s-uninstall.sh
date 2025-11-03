#!/bin/bash

source applications/caelundas/scripts/utilities.sh

release_name="${1:-}"
validate_release_name "$release_name"

echo "🗑️  Uninstalling Helm release: $release_name"

# Check if release exists
if ! helm list -o json | jq -e ".[] | select(.name == \"$release_name\")" >/dev/null 2>&1; then
  echo "❌ Warning: Release '$release_name' not found"
  list_jobs
  exit 1
fi

helm uninstall "$release_name"

echo "⏳ Waiting for pod to be deleted..."
kubectl wait --for=delete pod -l job-name="$release_name" --timeout=60s 2>/dev/null || true

pv_name=$(kubectl get pvc "$release_name" -o jsonpath='{.spec.volumeName}' 2>/dev/null || true)

# Clean up associated PVC (Helm doesn't delete PVCs by default)
echo "🗑️ Deleting persistent volume claim (PVC)..."
kubectl delete pvc "$release_name" --ignore-not-found=true

# Clean up associated PV if it has Retain policy
if [ -n "$pv_name" ]; then
  echo "🗑️ Deleting persistent volume (PV): $pv_name..."
  kubectl delete pv "$pv_name" --ignore-not-found=true
fi

echo "✅ Successfully uninstalled $release_name"
