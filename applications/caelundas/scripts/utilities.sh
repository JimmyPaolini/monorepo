#!/bin/bash

# ==============================================================================
# utilities.sh
# ==============================================================================
# Shared utilities for Caelundas Kubernetes scripts
#
# This file contains common functions and constants used by k8s-list-files.sh
# and k8s-copy-files.sh scripts.
#
# Usage:
#   source "$(dirname "${BASH_SOURCE[0]}")/utilities.sh"
# ==============================================================================

# Constants
readonly CALENDARS_PATH="/app/data/calendars"
readonly DEBUG_POD_NAME="caelundas-debug"
readonly DEBUG_IMAGE="busybox:latest"

# ==============================================================================
# Validation Functions
# ==============================================================================

# Verify script is run from monorepo root
# Exits with error if not in the correct directory
validate_monorepo_root() {
  if [ ! -f "package.json" ] || ! grep -q '"name": "monorepo"' package.json 2>/dev/null; then
    echo "❌ Error: This script must be run from the monorepo root directory"
    echo "📁 Current directory: $(pwd)"
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

# ==============================================================================
# Kubernetes Query Functions
# ==============================================================================

# Find the Caelundas pod using label selectors
# Returns: pod name or empty string if not found
find_pod() {
  local pod

  # Try Helm-managed label first
  pod=$(kubectl get pods -l app.kubernetes.io/name=kubernetes-job \
    -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)

  # Fall back to job name label
  if [ -z "$pod" ]; then
    pod=$(kubectl get pods -l job-name=caelundas \
      -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
  fi

  echo "$pod"
}

# Get the phase of a pod (Pending, Running, Succeeded, Failed, Unknown)
# Args: $1 - pod name
# Returns: pod phase string
get_pod_phase() {
  local pod="$1"
  kubectl get pod "$pod" -o jsonpath='{.status.phase}' 2>/dev/null
}

# Get the PVC name attached to a pod
# Args: $1 - pod name
# Returns: PVC name or empty string if not found
get_pvc_name() {
  local pod="$1"
  kubectl get pod "$pod" \
    -o jsonpath='{.spec.volumes[?(@.persistentVolumeClaim)].persistentVolumeClaim.claimName}' \
    2>/dev/null
}
