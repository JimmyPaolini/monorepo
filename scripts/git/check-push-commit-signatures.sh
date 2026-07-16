#!/usr/bin/env bash

set -e

# When running inside a GitHub Copilot coding agent, commit signing is handled
# by the agent runtime (gh-gpgsign). Skip signature verification in that case.
if [[ "${COPILOT_AGENT_SIGN_COMMITS}" == "false" ]]; then
  exit 0
fi

gpg_program="$(git config --get gpg.program || true)"
if [[ "$gpg_program" == *"gh-gpgsign"* ]]; then
  exit 0
fi

zero_sha='0000000000000000000000000000000000000000'
unsigned_commits=()

while read -r local_ref local_sha _remote_ref remote_sha; do
  if [[ -z "$local_ref" || "$local_sha" == "$zero_sha" ]]; then
    continue
  fi

  commit_range=''
  if [[ "$remote_sha" == "$zero_sha" ]]; then
    commit_range="$(git rev-list "$local_sha" --not --remotes)"
  else
    commit_range="$(git rev-list "$remote_sha..$local_sha")"
  fi

  if [[ -z "$commit_range" ]]; then
    continue
  fi

  while read -r commit_sha; do
    if [[ -z "$commit_sha" ]]; then
      continue
    fi

    signature_status="$(git log -1 --format='%G?' "$commit_sha")"
    if [[ "$signature_status" != 'G' && "$signature_status" != 'U' ]]; then
      commit_subject="$(git log -1 --format='%s' "$commit_sha")"
      unsigned_commits+=("$commit_sha [$signature_status] $commit_subject")
    fi
  done <<< "$commit_range"
done

if [[ "${#unsigned_commits[@]}" -gt 0 ]]; then
  echo "❌ Push rejected because unsigned or unverifiable commits were found:" >&2
  printf '  - %s\n' "${unsigned_commits[@]}" >&2
  echo "    Recreate or amend commits with signing enabled (git commit -S ...)." >&2
  exit 1
fi
