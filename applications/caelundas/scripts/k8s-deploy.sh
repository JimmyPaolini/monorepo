#!/bin/bash

source applications/caelundas/scripts/utilities.sh

commit=$(get_git_commit_hash)

timestamp=$(get_utc_timestamp)

release_name=$(generate_release_name "$commit" "$timestamp")

echo "📦 Deploying Helm release..."

helm upgrade --install "$release_name" infrastructure/helm/kubernetes-job \
  --values infrastructure/helm/kubernetes-job/values-caelundas.yaml \
  --set metadata.gitCommit="$commit" \
  --set metadata.timestamp="$timestamp"

echo "✅ Successfully deployed $release_name"