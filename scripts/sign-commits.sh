#!/usr/bin/env bash

set -e

script_directory="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repository_root="$(cd "$script_directory/.." && pwd)"

cd "$repository_root"

current_branch="$(git symbolic-ref --quiet --short HEAD 2>/dev/null || true)"
if [[ -z "$current_branch" ]]; then
  echo '❌ A branch must be checked out before re-signing commits.' >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo '❌ Working tree is not clean. Commit, stash, or discard changes first.' >&2
  exit 1
fi

echo '🌳 Fetching latest state for origin/main.'
git fetch origin main

echo '🔏 Checking local Git and GPG signing configuration.'
bash "$repository_root/scripts/git/check-commit-signing-configuration.sh"

echo "🎋 Checking that ${current_branch} already contains origin/main."
if ! git merge-base --is-ancestor origin/main HEAD; then
  echo '❌ Current branch is not up to date with origin/main. Rebase or merge origin/main first.' >&2
  exit 1
fi

branch_commit_count="$(git rev-list --count 'origin/main..HEAD')"
if [[ "$branch_commit_count" == '0' ]]; then
  echo '✅ No branch commits found to re-sign relative to origin/main.'
  exit 0
fi

backup_timestamp="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
backup_branch="backup/${current_branch}/${backup_timestamp}"

echo "🪾 Creating backup branch ${backup_branch}."
git branch "$backup_branch"

if ! git show-ref --verify --quiet "refs/heads/$backup_branch"; then
  echo "❌ Backup branch ${backup_branch} could not be verified." >&2
  exit 1
fi

echo "✍️ Re-signing ${branch_commit_count} commit(s) on ${current_branch}."
if ! git rebase --exec 'git commit --amend --no-edit -S --no-verify' origin/main; then
  echo "❌ Re-signing failed during rebase. Resolve the issue manually or recover with: git switch \"${backup_branch}\"" >&2
  exit 1
fi

echo '🔍 Verifying signatures on rewritten commits.'
unsigned_commit_count='0'
while read -r commit_sha signature_status; do
  [[ -n "$commit_sha" ]] || continue

  if [[ "$signature_status" != 'G' && "$signature_status" != 'U' ]]; then
    echo "❌ Commit ${commit_sha} is not signed with a valid or trusted signature status (${signature_status})." >&2
    unsigned_commit_count='1'
  fi
done < <(git log --format='%H %G?' 'origin/main..HEAD')

if [[ "$unsigned_commit_count" != '0' ]]; then
  echo "❌ One or more rewritten commits are still unsigned. Recover with: git switch \"${backup_branch}\"" >&2
  exit 1
fi

echo '🧾 Checking for unexpected content changes relative to the backup branch.'
if ! git diff --quiet "$backup_branch"..HEAD; then
  git diff --stat "$backup_branch"..HEAD >&2
  echo "❌ Re-signing changed file contents unexpectedly. Recover with: git switch \"${backup_branch}\"" >&2
  exit 1
fi

echo '🫸 Pushing the rewritten branch with force-with-lease.'
git push --force-with-lease

echo "✅ Re-signed ${branch_commit_count} commit(s) on ${current_branch}."
echo "🔒 Backup branch preserved at ${backup_branch}."
