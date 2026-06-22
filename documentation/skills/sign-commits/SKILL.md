---
name: sign-commits
description: "GPG-sign unsigned commits on the current branch or pull request with a cautious history-rewrite workflow. Use when asked to sign existing commits, fix unsigned commit checks, satisfy required signed commits branch rules, or prepare a PR so all commits show as signed/verified."
---

# Sign Commits

This skill safely rewrites branch history so commits that are currently unsigned become GPG-signed.

It prioritizes safety:

- Never rewrite history without creating backup branches first.
- Never force-push without `--force-with-lease`.
- Stop immediately on unknown errors and report the exact error output to the user.
- Use `backup-code` before rewrite steps and `restore-code` if rollback is needed.

## When to Use This Skill

- User asks to sign existing commits on a branch or PR.
- Push/CI rejects unsigned commits.
- A protected branch or ruleset requires signed commits.
- The user wants all commits in a PR branch to be signed before merge.

## Prerequisites

1. A clean working tree (no unstaged/staged changes).
2. Git signing is configured and a usable secret key exists.
3. The branch has a known base range (PR base branch, upstream branch, or default branch).

Use these checks:

```bash
git status --porcelain
bash scripts/git/check-commit-signing-configuration.sh
```

If prerequisites fail, report the failure and pause.

## Workflow

Follow these steps in order.

### 1. Identify Branch and Comparison Range

Determine the current branch and commit range to inspect.

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

If base resolution fails, report the error and pause.

### 2. Detect Signature Statuses

Inspect commits in range and classify signature status.

```bash
git log --format='%H %G? %s' "${merge_base}..HEAD"
```

Treat statuses as follows:

- `N`: unsigned commit (target for signing).
- `G`: good signature.
- `U`: good signature with unknown validity (already signed, do not rewrite just for this).
- Any of `B`, `E`, `R`, `X`, `Y`: signed but problematic. Report and pause before rewriting.

Decision point:

- If no `N` commits exist, report: all commits are already signed, and stop.
- If one or more `N` commits exist, continue.

### 3. Create Safety Backups Before Rewriting

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

### 4. Rewrite Commits and Sign Unsigned Ones

Use an interactive rebase with `--exec` to sign commits where status is `N`.

```bash
git rebase -i --rebase-merges --exec 'signature_status="$(git log -1 --format=%G?)"; if [ "${signature_status}" = "N" ]; then git commit --amend --no-edit -S; fi' "${merge_base}"
```

Important behavior:

- Rebase rewrites commit SHAs in the selected range.
- Conflicts may occur; if they do, stop and ask the user how to proceed.
- If any unknown/non-conflict error occurs, report full error output and pause.

### 5. Verify Results Locally

Re-check signatures after rebase:

```bash
git log --format='%H %G? %s' "${merge_base}..HEAD"
unsigned_after_rewrite_count="$(git log --format='%G?' "${merge_base}..HEAD" | grep -c '^N$' || true)"
echo "unsigned commit count after rewrite: ${unsigned_after_rewrite_count}"
```

If any commit is still unsigned (`N`) or another problematic status appears, report and pause.

### 6. Push Safely

Because history was rewritten, push with lease protection:

```bash
git push --force-with-lease
```

If push is rejected or protected-branch policies block the update, report the exact rejection and pause.

## Completion Criteria

Task is complete only when all of the following are true:

1. Every commit in the target range is signed (`G` or `U`).
2. Backup branch name(s) are provided to the user.
3. Any rewritten branch is pushed with `--force-with-lease` (if push was requested).
4. Unknown errors are surfaced verbatim and execution is paused.

## Failure Handling Rules

- Do not use destructive commands like `git reset --hard`.
- Do not continue after unknown errors.
- Do not hide command output; include the relevant failing lines in your report.
- If rebase is interrupted by conflict, present options (`--continue`, `--abort`, `--skip`) and wait for user direction.
- If rewrite or push results are incorrect, use [restore-code](../restore-code/SKILL.md) to recover from the backup branch or stash.

## References

- Git commit signing (`-S`, `commit.gpgsign`, `user.signingkey`): https://git-scm.com/docs/git-commit
- Git rebase signing options (`--gpg-sign`, `--exec`, conflict handling): https://git-scm.com/docs/git-rebase
- Git book, signing commits with GPG: https://git-scm.com/book/en/v2/Git-Tools-Signing-Your-Work
- GitHub: signing commits: https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits
- GitHub: commit signature verification and statuses: https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification
- GitHub protected branch signed-commit requirements: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches#require-signed-commits
- [backup-code](../backup-code/SKILL.md) — Pre-rewrite safety checkpoint workflow
- [restore-code](../restore-code/SKILL.md) — Post-failure recovery workflow
