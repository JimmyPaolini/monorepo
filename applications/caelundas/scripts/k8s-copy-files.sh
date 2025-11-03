#!/bin/bash

source applications/caelundas/scripts/utilities.sh

readonly OUTPUT_DIR="applications/caelundas/${OUTPUT_DIR#./}"

echo "📥 Copying files from Kubernetes pod..."

release_name="${1:-}"
validate_release_name "$release_name"

pod_name=$(find_pod_by_job "$release_name")

pod_phase=$(get_pod_phase "$pod_name")

validate_pod_completed "$pod_phase" "$pod_name"

pvc_name=$(get_pvc_name "$pod_name")

echo "🔧 Creating temporary script pod..."
echo "💾 PVC: $pvc_name"
echo "📂 Path: /app/data/calendars"

# Create a temporary pod with the PVC mounted and sleep to keep it running
kubectl run "caelundas-script" \
  --image="busybox:latest" \
  --restart=Never \
  --overrides="{
    \"spec\": {
      \"containers\": [{
        \"name\": \"caelundas-script\",
        \"image\": \"busybox:latest\",
        \"command\": [\"sleep\", \"300\"],
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
  }" >/dev/null 2>&1

echo "⏳ Waiting for script pod to be ready..."
if ! kubectl wait --for=condition=Ready pod/"caelundas-script" --timeout=60s >/dev/null 2>&1; then
  echo "❌ Script pod did not become ready in time"
  kubectl delete pod "caelundas-script" --ignore-not-found=true >/dev/null 2>&1
  exit 1
fi

# Copy files from the script pod
echo "📥 Copying files..."
source="caelundas-script:/app/data/calendars"

if kubectl cp "$source" "$OUTPUT_DIR" 2>/dev/null; then
  # Clean up the script pod
  kubectl delete pod "caelundas-script" >/dev/null 2>&1
  echo "🧹 Cleaned up script pod"
  echo "✅ Files copied successfully"
else
  # Clean up the script pod
  kubectl delete pod "caelundas-script" >/dev/null 2>&1
  echo "🧹 Cleaned up script pod"
  echo "❌ Failed to copy files"
  exit 1
fi
