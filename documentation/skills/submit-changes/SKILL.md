---
name: submit-changes
description: Automatically submit local changes through the full branch → commit → push → pull request pipeline. Use this skill when asked to submit, ship, or push changes; when you want to move from local changes to an open PR in one step; or when orchestrating the complete git workflow automatically without manual steps.
license: MIT
---

# Submit Changes

This skill automates the full pipeline from local changes to an open pull request: **branch → commit → push → PR**. Each phase is idempotent — already-completed steps are skipped automatically.

## When to Use This Skill

- Submitting local changes as a complete workflow in one step
- Automating the branch + commit + PR process without manual intervention
- Shipping finished work without manually running each git command

## Safety Rules

These rules are non-negotiable:

- **NEVER** run destructive commands (`git reset`, `git clean`, `git checkout -- .`, `git push --force`, `git rebase`)
- **NEVER** bypass hooks with `--no-verify`
- **NEVER** auto-fix pre-commit failures — report the failure and stop
- On any failure: **report the error and stop immediately**

## Automatic Change Analysis

Before executing any phases, analyze the working tree and staged changes:

```bash
git status --porcelain
git diff HEAD
```

From the diff, automatically determine:

1. **Type** — From the allowed types (see [commit-code skill](../commit-code/SKILL.md))
2. **Scope** — From the allowed scopes (see [commit-code skill](../commit-code/SKILL.md))
3. **Gitmoji** — Best-fit emoji for the type and intent (see [commit-code skill](../commit-code/SKILL.md))
4. **Subject** — Concise imperative phrase, lowercase, no period, under 70 chars

These values drive the branch name, commit message, and PR title throughout all phases.

## Phase 1 — Branch

**Skip if:** Already on a non-`main` branch.

1. Check current branch: `git rev-parse --abbrev-ref HEAD`
2. If on `main`, create and switch to a new branch following [checkout-branch conventions](../checkout-branch/SKILL.md):

   ```bash
   git checkout -b <type>/<scope>-<description>
   ```

3. Push to remote and set upstream:

   ```bash
   git push --set-upstream origin <branch>
   ```

Branch name format: `<type>/<scope>-<description>` (kebab-case, 2–4 keyword description)

## Phase 2 — Stage, Commit & Push

**Skip if:** Working tree is clean (`git status --porcelain` returns nothing).

1. Stage all changes:

   ```bash
   git add -A
   ```

2. Compose commit message: `<type>(<scope>): <gitmoji> <subject>` — single line, max 128 chars, no body/footer

3. Commit:

   ```bash
   git commit -m "<type>(<scope>): <gitmoji> <subject>"
   ```

### If pre-commit hooks fail

**Stop immediately.** Report the hook output so the user can see what failed. Do **NOT** apply fixes or proceed to push.

### If commit succeeds

Push to remote:

```bash
git push --set-upstream origin <branch>
```

## Phase 3 — Pull Request

**Skip if:** A PR already exists for the current branch:

```bash
gh pr list --head <branch> --state open
```

1. Title: Same format as the commit message — `<type>(<scope>): <gitmoji> <subject>`
2. Body: Auto-generate from the diff using the PR template structure:
   - **🌰 Summary**: Overall purpose in 1-2 sentences
   - **📝 Details**: Bulleted list of meaningful changes
   - **🧪 Testing**: Relevant `nx run <project>:<target>` commands and manual steps
   - **🔗 Related**: Issue links discovered from branch name, commits, or `gh issue list --search`
3. Create the PR:

   ```bash
   gh pr create \
     --title "<type>(<scope>): <gitmoji> <subject>" \
     --body "<generated body>" \
     --base main \
     --assignee @me
   ```

For complete PR conventions and description guidelines, see [create-pull-request skill](../create-pull-request/SKILL.md).

## Output

After completing all phases, print a summary table:

| Phase  | Result                                                   |
| ------ | -------------------------------------------------------- |
| Branch | Created `<branch>` / Already on `<branch>`               |
| Commit | `<type>(<scope>): <gitmoji> <subject>` / Skipped (clean) |
| PR     | Created `<url>` / Already exists `<url>`                 |

## Resources

- [checkout-branch skill](../checkout-branch/SKILL.md) — Branch naming conventions
- [commit-code skill](../commit-code/SKILL.md) — Commit message format, types, scopes, gitmoji
- [create-pull-request skill](../create-pull-request/SKILL.md) — PR conventions and description template
