#!/usr/bin/env bash

set -e

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
    gpg_program="$(git config --get gpg.program || echo "gpg")"

    # When using an API-based signing program (e.g. gh-gpgsign), the public
    # key is managed remotely and is not present in the local GPG keyring.
    # Status 'E' (missing public key) is acceptable in that case because the
    # commit is genuinely signed — verification happens on the remote side.
    if [[ "$gpg_program" == *"gh-gpgsign"* && "$signature_status" == 'E' ]]; then
      continue
    fi

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
