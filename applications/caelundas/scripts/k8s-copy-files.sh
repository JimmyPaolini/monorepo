#!/bin/bash

set -e

source "applications/caelundas/scripts/utilities.sh"

validate_monorepo_root

source "applications/caelundas/.env"

readonly OUTPUT_DIR="applications/caelundas/${OUTPUT_DIR#./}"


# Display copied files
# Returns: 0 on success, 1 if directory is empty
show_contents() {
  local file_count
  file_count=$(find "$OUTPUT_DIR" -type f 2>/dev/null | wc -l | tr -d ' ')

  if [ "$file_count" -gt 0 ]; then
    echo "📁 Copied $file_count files:"
    ls -lh "$OUTPUT_DIR" | tail -n +2
    return 0
  else
    echo "⚠️  No files copied"
    return 1
  fi
}

# ==============================================================================
# Action Functions
# ==============================================================================

# Copy files from a completed pod using a temporary debug pod
# Args: $1 - pod name
# Returns: 0 on success, 1 on failure
copy_from_debug_pod() {
  local pod=$1
  local pvc

  pvc=$(get_pvc_name "$pod")

  if [ -z "$pvc" ]; then
    echo "❌ Could not find PVC for pod $pod"
    return 1
  fi

  echo "🔧 Creating temporary debug pod..."
  echo "💾 PVC: $pvc"
  echo "📂 Path: $CALENDARS_PATH"

  # Create a temporary pod with the PVC mounted and sleep to keep it running
  kubectl run "$DEBUG_POD_NAME" \
    --image="$DEBUG_IMAGE" \
    --restart=Never \
    --overrides="{
      \"spec\": {
        \"containers\": [{
          \"name\": \"$DEBUG_POD_NAME\",
          \"image\": \"$DEBUG_IMAGE\",
          \"command\": [\"sleep\", \"300\"],
          \"volumeMounts\": [{
            \"name\": \"data\",
            \"mountPath\": \"/app/data\"
          }]
        }],
        \"volumes\": [{
          \"name\": \"data\",
          \"persistentVolumeClaim\": {
            \"claimName\": \"$pvc\"
          }
        }]
      }
    }" >/dev/null 2>&1

  # Wait for the debug pod to be ready
  echo "⏳ Waiting for debug pod to be ready..."
  if ! kubectl wait --for=condition=Ready pod/"$DEBUG_POD_NAME" --timeout=60s >/dev/null 2>&1; then
    echo "❌ Debug pod did not become ready in time"
    kubectl delete pod "$DEBUG_POD_NAME" --ignore-not-found=true >/dev/null 2>&1
    return 1
  fi

  # Copy files from the debug pod
  echo "📥 Copying files..."
  local source="$DEBUG_POD_NAME:$CALENDARS_PATH"
  local success=0

  if kubectl cp "$source" "$OUTPUT_DIR" 2>/dev/null; then
    success=0
  else
    success=1
  fi

  # Clean up the debug pod
  kubectl delete pod "$DEBUG_POD_NAME" >/dev/null 2>&1
  echo "🧹 Cleaned up debug pod"

  return $success
}

# ==============================================================================
# Main Script
# ==============================================================================

echo "📥 Copying files from Kubernetes pod..."

pod=$(find_pod)

if [ -z "$pod" ]; then
  echo "❌ No Caelundas pod found"
  exit 1
fi

phase=$(get_pod_phase "$pod")

echo "🫛 Pod: $pod"
echo "🚦 Status: $phase"

validate_pod_completed "$phase" "$pod"

# Pod is completed - use debug pod
if copy_from_debug_pod "$pod"; then
  echo "✅ Files copied successfully"
  show_contents
else
  echo "❌ Failed to copy files"
  exit 1
fi
