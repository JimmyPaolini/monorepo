#!/bin/bash
set -e

# ==============================================================================
# k8s-copy-files.sh
# ==============================================================================
# Copies calendar files from the Caelundas Kubernetes job's persistent volume
# to the local machine.
#
# The files are copied from the pod's /app/data/calendars directory to
# ./applications/caelundas/calendars-output/ in the monorepo.
#
# Usage:
#   ./k8s-copy-files.sh
#
# Requirements:
#   - kubectl configured and connected to the cluster
#   - Caelundas job must be running or completed
#   - Write permissions in the output directory
# ==============================================================================

CALENDARS_PATH="/app/data/calendars"
OUTPUT_DIR="applications/caelundas/calendars-output"

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

# Copy files from pod to local directory
copy_files() {
  local pod=$1
  local source="$pod:$CALENDARS_PATH"

  if kubectl cp "$source" "$OUTPUT_DIR" 2>/dev/null; then
    return 0
  else
    return 1
  fi
}

# Display copied files
show_contents() {
  echo ""
  echo "📁 Copied files:"
  ls -lh "$OUTPUT_DIR" | tail -n +2 || echo "   (none)"
}

main() {
  echo "📥 Copying files from Kubernetes pod..."
  echo ""

  # Ensure output directory exists
  mkdir -p "$OUTPUT_DIR"

  local pod
  pod=$(find_pod)

  if [ -z "$pod" ]; then
    echo "❌ Error: No Caelundas pod found"
    echo "   Make sure the job is running: kubectl get jobs"
    exit 1
  fi

  echo "Pod: $pod"
  echo "Source: $CALENDARS_PATH"
  echo "Destination: ./$OUTPUT_DIR"
  echo ""

  if copy_files "$pod"; then
    echo "✅ Files copied successfully"
    show_contents
  else
    echo "❌ Error: Failed to copy files"
    echo "   The directory may not exist or be empty"
    exit 1
  fi
}

main "$@"
