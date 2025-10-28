#!/bin/bash
set -e

# ==============================================================================
# k8s-list-files.sh
# ==============================================================================
# Lists files in the Caelundas Kubernetes job's persistent volume.
#
# This script only works with completed (Succeeded/Failed) pods. It creates
# a temporary debug pod with the same PVC mounted to access the files.
#
# Usage:
#   ./k8s-list-files.sh
#
# Requirements:
#   - kubectl configured and connected to the cluster
#   - Caelundas job must be completed (not running)
#   - Must be run from monorepo root
# ==============================================================================

# Source shared utilities
# shellcheck disable=SC1091
source "applications/caelundas/scripts/utilities.sh"

# Validate environment
validate_monorepo_root

# ==============================================================================
# Actions
# ==============================================================================

# List files by creating a temporary debug pod with the PVC mounted
# Args: $1 - pvc name
list_pod_files() {
  local pvc_name="$1"

  echo "💾 PVC: $pvc_name"
  echo "📂 Path: $CALENDARS_PATH"

  # Create temporary pod that mounts the PVC and runs ls
  if ! kubectl run "$DEBUG_POD_NAME" --rm -i --restart=Never \
    --image="$DEBUG_IMAGE" \
    --overrides="{
      \"spec\": {
        \"containers\": [{
          \"name\": \"$DEBUG_POD_NAME\",
          \"image\": \"$DEBUG_IMAGE\",
          \"command\": [\"ls\", \"-lah\", \"$CALENDARS_PATH\"],
          \"volumeMounts\": [{
            \"name\": \"data\",
            \"mountPath\": \"/app/data\"
          }]
        }],
        \"volumes\": [{
          \"name\": \"data\",
          \"persistentVolumeClaim\": {
            \"claimName\": \"$pvc_name\"
          }
        }]
      }
    }"; then
    echo "❌ Failed to access directory"
    return 1
  fi
}

# ==============================================================================
# Main Script
# ==============================================================================

echo "📂 Listing files from Kubernetes pod..."

# Find the pod
pod=$(find_pod)

if [ -z "$pod" ]; then
  echo "❌ No Caelundas pod found"
  exit 1
fi

echo "🫛 Pod: $pod"

# Get pod status
pod_phase=$(get_pod_phase "$pod")
echo "🚦 Status: $pod_phase"

# Validate pod is completed
validate_pod_completed "$pod_phase" "$pod"

echo "🔧 Creating temporary debug pod..."

pvc_name=$(get_pvc_name "$pod")

if [ -z "$pvc_name" ]; then
  echo "❌ Could not find PVC attached to pod"
  exit 1
fi

list_pod_files "$pvc_name"

echo "✅ Listed files successfully"
