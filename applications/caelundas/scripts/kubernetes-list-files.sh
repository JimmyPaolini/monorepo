#!/bin/bash

source applications/caelundas/scripts/utilities.sh

echo "📂 Listing files from Kubernetes PVC..."

release_name="${1:-}"
validate_release_name "$release_name"

pvc_name="$release_name"
verify_pvc_exists "$pvc_name"

create_script_pod "$pvc_name"

echo "📂 Listing files..."
if kubectl exec "$SCRIPT_POD_NAME" -- ls -lah "$MOUNT_PATH"; then
  cleanup_script_pod
  echo "✅ Listed files successfully"
else
  cleanup_script_pod
  echo "❌ Failed to list files" >&2
  exit 1
fi
