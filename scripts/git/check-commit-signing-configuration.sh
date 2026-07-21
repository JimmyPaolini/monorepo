#!/usr/bin/env bash

set -e

commit_gpg_sign="$(git config --bool --get commit.gpgsign || true)"
if [[ "$commit_gpg_sign" != "true" ]]; then
  echo "❌ Git commit signing is required. Set commit.gpgsign=true before committing." >&2
  exit 1
fi

signing_key="$(git config --get user.signingkey || true)"
if [[ -z "$signing_key" ]]; then
  echo "❌ Git signing key is required. Set user.signingkey before committing." >&2
  exit 1
fi

if ! command -v gpg > /dev/null 2>&1; then
  echo "❌ gpg is required for commit signing but was not found in PATH." >&2
  exit 1
fi

if ! gpg --list-secret-keys --keyid-format=long "$signing_key" | grep -q '^sec'; then
  echo "❌ No GPG secret key found for user.signingkey=$signing_key." >&2
  exit 1
fi
