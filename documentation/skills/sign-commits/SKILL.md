---
name: sign-commits
description: "Re-sign commits on the current branch or pull request with any valid local signing key using a non-interactive, safety-first rewrite that preserves exact code content. Use when asked to sign commits, satisfy required signed-commit rules, or make a PR show verified signatures without code changes."
---

# Sign Commits

This skill rewrites branch history only to re-sign commits with a valid local signing key.

Primary goal:

- All commits on the branch/PR are signed with a valid key.
- Code content at the end is exactly the same as before rewriting.

Guardrails:

- Never rewrite history without creating backups first.
- Never force-push without `--force-with-lease`.
- Never resolve content conflicts for a signing-only task.
- If a rewrite requires content resolution, abort and report.

## When to Use This Skill

- User asks to sign commits on an existing branch or PR.
- CI or branch rules require signed commits.
- Goal is signing only, not changing code.

## Prerequisites

1. A clean working tree (no unstaged/staged changes).
2. At least one usable secret signing key exists locally.
3. The branch has a known base range (PR base branch, upstream branch, or default branch).

Use these checks:

```bash
git status --porcelain
bash scripts/git/check-commit-signing-configuration.sh
```

If prerequisites fail, report the failure and pause.

## Fast Workflow (Preferred)

Use this simplified path first. It avoids interactive prompts and minimizes human intervention.

### 1. Resolve branch context and key

Determine current branch and base branch:

```bash
current_branch="$(git branch --show-current)"
```

Resolve the base branch in this order:

1. PR base branch (if available):

```bash
base_branch="$(gh pr view --json baseRefName --jq .baseRefName 2>/dev/null || true)"
```

1. Upstream branch for current branch:

```bash
if [[ -z "${base_branch}" ]]; then
  upstream_ref="$(git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null || true)"
  if [[ -n "${upstream_ref}" ]]; then
    base_branch="${upstream_ref#origin/}"
  fi
fi
```

1. Remote default branch:

```bash
if [[ -z "${base_branch}" ]]; then
  base_branch="$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null | sed 's#^origin/##' || true)"
fi
```

Then compute a stable merge base:

```bash
git fetch origin --prune
merge_base="$(git merge-base "origin/${base_branch}" HEAD)"
```

Pick a valid local key to use for this rewrite (any valid key is acceptable):

```bash
gpg --list-secret-keys --keyid-format=long
```

If key/base resolution fails, report and pause.

### 2. Record pre-rewrite code snapshot and signatures

Capture code-content fingerprint before rewriting:

```bash
tree_before="$(git rev-parse HEAD^{tree})"
```

Capture current signature statuses in range:

```bash
git log --format='%H %G? %s' "${merge_base}..HEAD"
```

### 3. Create safety backup

Create local backup branches before any history rewrite.

**Default first approach:** run the [backup-code](../backup-code/SKILL.md) skill before this step so backup creation and recovery commands are standardized.

Inline/manual fallback: create the backup branch directly with the same naming convention:

```bash
iso_timestamp="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
backup_branch="backup/${current_branch}/${iso_timestamp}"
git branch "${backup_branch}"
```

If branch has an upstream, also create a remote backup:

```bash
if git rev-parse --verify '@{upstream}' >/dev/null 2>&1; then
  git push origin "HEAD:refs/heads/${backup_branch}"
fi
```

If backup creation fails, report the error and pause.

### 4. Rewrite non-interactively and sign all commits in range

Use a non-interactive rebase that signs rewritten commits with the selected key:

```bash
GIT_EDITOR=true git rebase --rebase-merges --force-rebase --gpg-sign=<KEYID> "${merge_base}"
```

Why this is preferred:

- `--gpg-sign=<KEYID>` signs rewritten commits directly.
- `--force-rebase` guarantees commits in range are rewritten/signed.
- `GIT_EDITOR=true` prevents interactive commit-message editor pauses during rebase/continue.

If rebase stops with content conflicts:

- Do not resolve conflicts for a signing-only operation.
- Run `git rebase --abort`.
- Report that automatic signing-only rewrite could not complete without content intervention.

### 5. Verify signatures and code identity

Re-check signatures after rebase:

```bash
git log --format='%H %G? %s' "${merge_base}..HEAD"
unsigned_after_rewrite_count="$(git log --format='%G?' "${merge_base}..HEAD" | grep -c '^N$' || true)"
echo "unsigned commit count after rewrite: ${unsigned_after_rewrite_count}"
```

Verify code content is unchanged:

```bash
tree_after="$(git rev-parse HEAD^{tree})"
test "${tree_before}" = "${tree_after}"
```

If tree hashes differ, stop and report. Do not push.

### 6. Push safely

Because history was rewritten, push with lease protection:

```bash
git push --force-with-lease
```

If push is rejected or protected-branch policies block the update, report the exact rejection and pause.

## Completion Criteria

Task is complete only when all of the following are true:

1. Every commit in the target range is signed (`G` or `U`) and no `N` remains.
2. Backup branch name(s) are provided to the user.
3. `HEAD^{tree}` before and after rewrite is identical.
4. Any rewritten branch is pushed with `--force-with-lease` (if push was requested).
5. Unknown errors are surfaced verbatim and execution is paused.

## Failure Handling Rules

- Do not use destructive commands like `git reset --hard`.
- Do not continue after unknown errors.
- Do not hide command output; include the relevant failing lines in your report.
- If rebase is interrupted by content conflict during signing-only rewrite, default to `git rebase --abort` and report.
- If rewrite or push results are incorrect, use [restore-code](../restore-code/SKILL.md) to recover from the backup branch or stash.

## Quick Command Template

When the branch should be re-signed with minimum intervention, this is the canonical sequence:

```bash
git fetch origin --prune
base_branch=<resolved-base>
merge_base="$(git merge-base "origin/${base_branch}" HEAD)"
tree_before="$(git rev-parse HEAD^{tree})"
backup_branch="backup/$(git branch --show-current)/$(date -u +%Y-%m-%dT%H-%M-%SZ)"
git branch "${backup_branch}"
GIT_EDITOR=true git rebase --rebase-merges --force-rebase --gpg-sign=<KEYID> "${merge_base}"
tree_after="$(git rev-parse HEAD^{tree})"
test "${tree_before}" = "${tree_after}"
git push --force-with-lease
```

## References

- Git commit signing (`-S`, `commit.gpgsign`, `user.signingkey`): https://git-scm.com/docs/git-commit
- Git rebase signing options (`--gpg-sign`, `--exec`, conflict handling): https://git-scm.com/docs/git-rebase
- Git book, signing commits with GPG: https://git-scm.com/book/en/v2/Git-Tools-Signing-Your-Work
- GitHub: signing commits: https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits
- GitHub: commit signature verification and statuses: https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification
- GitHub protected branch signed-commit requirements: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches#require-signed-commits
- [backup-code](../backup-code/SKILL.md) — Pre-rewrite safety checkpoint workflow
- [restore-code](../restore-code/SKILL.md) — Post-failure recovery workflow
