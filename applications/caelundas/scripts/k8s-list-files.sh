#!/bin/bash
set -e

# ==============================================================================
# k8s-list-files.sh
# ==============================================================================
# Lists files in the Caelundas Kubernetes job's persistent volume.
# This script finds the running Caelundas pod and displays the contents
# of the /app/data/calendars directory where calendar files are stored.
#
# Usage:
#   ./k8s-list-files.sh
#
# Requirements:
#   - kubectl configured and connected to the cluster
#   - Caelundas job must be running or completed
# ==============================================================================

CALENDARS_PATH="/app/data/calendars"

# Find the Caelundas pod using label selectors
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

main() {
  echo "📂 Listing files in persistent volume..."
  echo ""

  local pod
  pod=$(find_pod)

  if [ -z "$pod" ]; then
    echo "❌ Error: No Caelundas pod found"
    echo "   Make sure the job is running: kubectl get jobs"
    exit 1
  fi

  echo "Pod: $pod"
  echo "Path: $CALENDARS_PATH"
  echo ""

  if kubectl exec "$pod" -- ls -lah "$CALENDARS_PATH" 2>/dev/null; then
    echo ""
    echo "✅ Listed successfully"
  else
    echo "❌ Error: Directory not found or inaccessible"
    exit 1
  fi
}

main "$@"
