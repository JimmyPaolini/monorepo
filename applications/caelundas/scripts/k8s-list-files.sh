#!/bin/bash

source applications/caelundas/scripts/utilities.sh

echo "📂 Listing files from Kubernetes pod..."

release_name="${1:-}"
validate_release_name "$release_name"

pod_name=$(find_pod_by_job "$release_name")

pod_phase=$(get_pod_phase "$pod_name")

validate_pod_completed "$pod_phase" "$pod_name"

pvc_name=$(get_pvc_name "$pod_name")

echo "🔧 Creating temporary script pod..."
echo "📂 Path: /app/data/calendars"

kubectl run "caelundas-script" --rm -i --restart=Never \
  --image="busybox:latest" \
  --overrides="{
    \"spec\": {
      \"containers\": [{
        \"name\": \"caelundas-script\",
        \"image\": \"busybox:latest\",
        \"command\": [\"ls\", \"-lah\", \"/app/data/calendars\"],
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
  }"

echo "✅ Listed files successfully"
