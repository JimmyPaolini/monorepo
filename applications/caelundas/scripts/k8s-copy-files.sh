#!/bin/bash

source applications/caelundas/scripts/utilities.sh

echo "📥 Copying files from Kubernetes PVC..."

release_name="${1:-}"
validate_release_name "$release_name"

pvc_name="$release_name"
verify_pvc_exists "$pvc_name"

create_script_pod "$pvc_name"

echo "📥 Copying files..."
if kubectl cp "$SCRIPT_POD_NAME:$MOUNT_PATH" "applications/caelundas/output" 2>/dev/null; then
  cleanup_script_pod
  echo "✅ Files copied successfully"
else
  cleanup_script_pod
  echo "❌ Failed to copy files" >&2
  exit 1
fi
