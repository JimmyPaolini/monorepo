#!/bin/bash

source scripts/utilities.sh

echo "🎛️ Exporting environment variables from applications/caelundas/.env file..."
set -a
source applications/caelundas/.env
set +a

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

# Validate that a pod is in a completed state (Succeeded or Failed)
# Args:
#   $1 - pod phase
#   $2 - pod name (for error messages)
# Exits with error if pod is not in a valid completed state
validate_pod_completed() {
  local phase="$1"
  local pod="$2"

  if [ "$phase" = "Running" ]; then
    echo "❌ Error: Pod is currently running. This script only works with completed pods. Wait for the job to complete or use kubectl exec directly"
    exit 1
  fi

  if [ "$phase" != "Succeeded" ] && [ "$phase" != "Failed" ]; then
    echo "❌ Error: Unexpected pod phase: $phase. Expected: Succeeded or Failed"
    exit 1
  fi
}

# Find pod by job name (release name)
# Args: $1 - job name (release name)
# Returns: pod name or empty string if not found
find_pod_by_job() {
  local job_name="$1"
  local pod

  echo "🔍 Finding pod for job: $job_name" >&2
  pod=$(kubectl get pods -l job-name="$job_name" \
    -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)

  if [ -n "$pod" ]; then
    echo "🫛 Found pod: $pod"
  else
    echo "🥀 No pod found for job: $job_name" >&2
    exit 1
  fi

  echo "$pod"
}

# Get the phase of a pod (Pending, Running, Succeeded, Failed, Unknown)
# Args: $1 - pod name
# Returns: pod phase string
get_pod_phase() {
  local pod="$1"
  local phase

  echo "🚦 Getting pod phase for: $pod" >&2
  phase=$(kubectl get pod "$pod" -o jsonpath='{.status.phase}' 2>/dev/null)
  echo "   Phase: $phase" >&2

  echo "$phase"
}

# Get the PVC name attached to a pod
# Args: $1 - pod name
# Returns: PVC name or empty string if not found
get_pvc_name() {
  local pod="$1"
  local pvc

  echo "💾 Getting PVC for pod: $pod" >&2
  pvc=$(kubectl get pod "$pod" \
    -o jsonpath='{.spec.volumes[?(@.persistentVolumeClaim)].persistentVolumeClaim.claimName}' \
    2>/dev/null)

  if [ -n "$pvc" ]; then
    echo "   PVC: $pvc" >&2
  else
    echo "   No PVC found" >&2
    exit 1
  fi

  echo "$pvc"
}
