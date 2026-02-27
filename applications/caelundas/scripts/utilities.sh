#!/bin/bash

source scripts/utilities.sh

echo "🎛️ Exporting environment variables from applications/caelundas/.env file..."
set -a
source applications/caelundas/.env
set +a

# Constants
readonly SCRIPT_POD_NAME="caelundas-script"
readonly SCRIPT_POD_IMAGE="busybox:latest"
readonly MOUNT_PATH="/app/output"

# List all Caelundas jobs with their metadata
list_jobs() {
  echo "📋 Caelundas Jobs:"

  kubectl get jobs \
    -l app.kubernetes.io/name=caelundas \
    -o custom-columns=\
NAME:.metadata.name,\
STATUS:.status.conditions[0].type,\
COMMIT:.metadata.labels.caelundas\.job/git-commit,\
TIMESTAMP:.metadata.labels.caelundas\.job/timestamp,\
AGE:.metadata.creationTimestamp \
    2>/dev/null || echo "No jobs found"
}

generate_release_name() {
  local commit="$1"
  local timestamp="$2"
  local release_name

  echo "📦 Generating release name..." >&2
  release_name="caelundas-${commit}-${timestamp}"
  echo "📦 Release: $release_name" >&2
  echo "$release_name"
}

# Validate release name format
# Args: $1 - release name to validate
# Returns: 0 if valid, exits with error if invalid
validate_release_name() {
  local release_name="$1"

  if [ -z "$release_name" ]; then
    echo "❌ Error: Release name required" >&2
    list_jobs >&2
    exit 1
  fi

  # Validate format: caelundas-{7-char-commit}-{YYYYMMDD-HHMMSS}
  if [[ ! "$release_name" =~ ^caelundas-[a-f0-9]{7}-[0-9]{8}-[0-9]{6}$ ]]; then
    echo "❌ Error: Invalid release name" >&2
    echo "  Expected: caelundas-{commit}-{timestamp}" >&2
    echo "  Example: caelundas-abc1234-20251103-143022" >&2
    echo "  Provided: $release_name" >&2
    list_jobs >&2
    exit 1
  fi
}

# Verify that a PVC exists
# Args: $1 - PVC name to verify
# Exits with error if PVC does not exist
verify_pvc_exists() {
  local pvc_name="$1"

  echo "💾 Verifying PVC: $pvc_name" >&2

  if ! kubectl get pvc "$pvc_name" &>/dev/null; then
    echo "❌ Error: PVC '$pvc_name' not found" >&2
    echo "Available PVCs:" >&2
    kubectl get pvc -l app.kubernetes.io/name=caelundas 2>/dev/null || echo "No PVCs found" >&2
    exit 1
  fi

  echo "   PVC exists: $pvc_name" >&2
}

# Create a script pod with PVC mounted
# Args: $1 - PVC name to mount
# Returns: 0 on success, exits on failure
create_script_pod() {
  local pvc_name="$1"

  echo "🫛 Creating script pod..." >&2

  kubectl run "$SCRIPT_POD_NAME" \
    --image="$SCRIPT_POD_IMAGE" \
    --restart=Never \
    --overrides="{
      \"spec\": {
        \"containers\": [{
          \"name\": \"$SCRIPT_POD_NAME\",
          \"image\": \"$SCRIPT_POD_IMAGE\",
          \"command\": [\"sleep\", \"300\"],
          \"volumeMounts\": [{
            \"name\": \"data\",
            \"mountPath\": \"$MOUNT_PATH\"
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

  echo "⏳ Waiting for script pod to be ready..." >&2
  if ! kubectl wait --for=condition=Ready pod/"$SCRIPT_POD_NAME" --timeout=60s 2>&1; then
    echo "❌ Script pod did not become ready in time" >&2
    kubectl get pod "$SCRIPT_POD_NAME" 2>&1 || true
    kubectl describe pod "$SCRIPT_POD_NAME" 2>&1 | tail -20 || true
    kubectl delete pod "$SCRIPT_POD_NAME" --ignore-not-found=true >/dev/null 2>&1
    exit 1
  fi
}

# Clean up the script pod
# Returns: 0 on success
cleanup_script_pod() {
  kubectl delete pod "$SCRIPT_POD_NAME" --ignore-not-found=true >/dev/null 2>&1
  echo "🧹 Cleaned up script pod" >&2
}
