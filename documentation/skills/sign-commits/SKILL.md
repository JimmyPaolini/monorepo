---
name: sign-commits
description: Re-sign all commits on the current branch or pull request without changing code content. Use when asked to sign commits, add GPG signatures to an existing branch, satisfy signed-commit requirements, or make a PR show verified commits. Creates a backup branch first, checks for a clean and up-to-date branch, skips commit hooks during amend, and stops immediately if any check, conflict, or rebase step fails.
license: MIT
---

# Sign Existing Commits

Re-sign every commit on the current branch while preserving commit messages and file content.

## When to Use This Skill

- When a branch or pull request has several unsigned commits
- When a repository or branch protection rule requires signed commits
- When you need to re-sign history without changing the code snapshots
- When you want a backup branch before rewriting commit history

Keywords: sign commits, GPG sign branch, re-sign PR commits, verified commits, signed history.

## Prerequisites

- Run from the repository root
- `git` is available and authenticated to the remote
- The wrapper script is available at `scripts/sign-commits.sh`
- The signing configuration check script is available at `scripts/git/check-commit-signing-configuration.sh`
- The branch contains only commits that are safe to rewrite

## Safety Model

- Create a backup branch before rewriting history
- Fail fast on any errors or obstacles
- Stop immediately on any rebase conflict or GPG failure
- Skip commit hooks during `--amend` so hooks cannot block a metadata-only rewrite
- Preserve commit messages and intended code content

## Scripted Workflow

Use the wrapper script for the normal path:

```bash
bash scripts/sign-commits.sh
```

The script performs the same workflow documented below:

- validates that it is being run from the monorepo root via `scripts/utilities.sh`
- checks for a clean working tree and a checked-out branch
- fetches `origin/main`
- validates Git and GPG signing configuration
- verifies the branch already contains the latest `origin/main`
- creates a backup branch
- re-signs each branch commit with `--no-verify`
- verifies signatures and checks for zero content drift
- pushes with `--force-with-lease`

## Step-by-Step Workflow

### 1. Inspect Current Branch

Run:

```bash
git branch --show-current
git status --short
```

Stop and report to the user if:

- no branch is checked out
- the working tree is not clean

### 2. Refresh Main and Run Checks

Run:

```bash
git fetch origin main
bash scripts/git/check-commit-signing-configuration.sh
git merge-base --is-ancestor origin/main HEAD
```

Interpretation:

- `git fetch origin main` must succeed
- `bash scripts/git/check-commit-signing-configuration.sh` must succeed
- `git merge-base --is-ancestor origin/main HEAD` must exit with code `0`

Stop and report to the user if:

- fetch fails
- the signing configuration check fails
- the current branch is not up to date with `origin/main`

If the branch is behind `origin/main`, stop. Rebase or merge `origin/main` first, resolve that separately, and only then return to this workflow.

### 3. Create Backup Branch First

Run:

```bash
iso_timestamp="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
current_branch="$(git branch --show-current)"
backup_branch="backup/${current_branch}/${iso_timestamp}"

git branch "$backup_branch"
git branch --list "$backup_branch"
```

Stop and report to the user if:

- the backup branch cannot be created
- the backup branch cannot be verified

Recovery path:

```bash
git switch "$backup_branch"
```

### 4. Re-sign Every Branch Commit

Run:

```bash
git rebase --exec 'git commit --amend --no-edit -S --no-verify' origin/main
```

This does the following:

- replays each branch commit on top of `origin/main`
- amends each replayed commit with a GPG signature
- keeps the existing commit message with `--no-edit`
- skips commit hooks with `--no-verify`

Stop and report to the user immediately if:

- the rebase stops for a conflict
- GPG signing fails
- the `--exec` amend step fails for any commit

Do not continue automatically after a failure. Surface the exact failure and wait for the user.

### 5. Verify the Result

Run:

```bash
git log --show-signature --oneline origin/main..HEAD
git diff --stat "$backup_branch"..HEAD
```

Expected result:

- every rewritten branch commit shows a valid signature
- `git diff --stat "$backup_branch"..HEAD` shows no file-content changes

Stop and report to the user if:

- any commit is still unsigned
- the diff shows unexpected content changes

### 6. Update the Remote Branch

Run:

```bash
git push --force-with-lease
```

Stop and report to the user if the push fails.

## Troubleshooting

| Problem | Cause | Fix |
| --- | --- | --- |
| Working tree is dirty | Local changes would be mixed into the rewrite | Stop and clean or stash changes first |
| Signing configuration check fails | Git or GPG is not configured for commit signing | Run `bash scripts/git/check-commit-signing-configuration.sh`, fix the reported issue, and stop until it passes |
| Branch is behind `origin/main` | The rewrite would also need to integrate upstream changes | Stop and rebase or merge `origin/main` first |
| Rebase conflict occurs | A commit does not replay cleanly | Stop and let the user decide whether to resolve or abort |
| GPG prompts repeatedly | GPG agent is not caching the passphrase | Prime `gpg-agent` before running the workflow |
| Push is rejected | Remote branch changed since last fetch | Review remote changes, then retry with care |

## Completion Criteria

- Checks passed
- Backup branch exists
- Rebase completed without manual conflict resolution
- Rewritten commits are signed
- No file-content changes were introduced
- Remote branch was updated with `--force-with-lease`

## References

- Create backups first with [backup-code](../backup-code/SKILL.md)
- Run the wrapper script with `bash scripts/sign-commits.sh`
