````skill
---
name: create-pull-request
description: Create and manage pull requests following this monorepo's conventions. Use this skill when creating PRs, opening PRs for review, writing PR descriptions, or asked about PR workflows and best practices.
license: MIT
---

# Pull Request Conventions

This skill teaches how to create and manage pull requests for this monorepo. Follow these conventions for consistent, reviewable PRs that pass CI validation.

## When to Use This Skill

- Creating a new pull request
- Writing PR titles and descriptions
- Preparing changes for review
- Understanding PR workflows and requirements
- Linking PRs to issues

## PR Title Format

PR titles **must** follow the same format as commit messages:

```text
<type>(<scope>): <gitmoji> <subject>
````

### Structure Rules

1. **Type**: Required, lowercase, from [allowed types](../../../conventional.config.cjs)
2. **Scope**: Required, lowercase, from [allowed scopes](../../../conventional.config.cjs)
3. **Gitmoji**: Required, emoji at start of subject
4. **Subject**: Required, lowercase, imperative mood, no period

### Examples

✅ **Good PR titles:**

```text
feat(lexico): ✨ add user profile page
fix(caelundas): 🐛 correct aspect angle calculation
docs(monorepo): 📝 update contributing guide
chore(dependencies): ⬆️ upgrade react to v19
refactor(lexico-components): ♻️ simplify button variants
```

❌ **Bad PR titles:**

```text
feat(lexico): add user profile page           # Missing gitmoji
feat(lexico): ✨ Added profile page.           # Wrong tense, period
Add new feature                                # Missing type, scope, gitmoji
fix: 🐛 fix bug                               # Missing scope
```

See [commit-code skill](../commit-code/SKILL.md) for complete formatting rules.

## PR Description

Write clear, comprehensive descriptions that help reviewers understand changes. The [PR template](../../../.github/PULL_REQUEST_TEMPLATE.md) provides the standard structure.

### Recommended Structure

```markdown
## Summary

Brief description of what this PR does (1-2 sentences).

## Changes

- List of specific changes made
- Each change on its own line
- Use present tense ("Add", "Update", "Remove")

## Testing

How to test these changes:

- `nx run <project>:test`
- Manual testing steps if applicable

## Related Issues

Closes #123
Fixes #456
```

### Description Guidelines

| Section          | Purpose                           | Required      |
| ---------------- | --------------------------------- | ------------- |
| Summary          | Brief overview of the PR          | Yes           |
| Changes          | Bulleted list of changes          | Yes           |
| Testing          | How to verify the changes         | Yes           |
| Related Issues   | Links to issues this PR addresses | If applicable |
| Screenshots      | Visual changes                    | If UI changes |
| Breaking Changes | API or behavior changes           | If applicable |

## Step-by-Step Workflow

### 1. Create Feature Branch

Branch name must follow conventions. See [checkout-branch skill](../checkout-branch/SKILL.md).

```bash
# Create branch from main
git checkout main
git pull origin main
git checkout -b feat/lexico-user-profile
```

### 2. Make Changes and Commit

Commits must follow conventions. See [commit-code skill](../commit-code/SKILL.md).

```bash
# Stage and commit changes
git add .
git commit -m "feat(lexico): ✨ add user profile component"
```

### 3. Push Branch

```bash
git push -u origin feat/lexico-user-profile
```

### 4. Create Pull Request

#### Using GitHub CLI

```bash
gh pr create \
  --title "feat(lexico): ✨ add user profile page" \
  --body "## Summary

Adds a user profile page where users can view and edit their information.

## Changes

- Add UserProfile component
- Add profile API endpoint
- Add profile route to router

## Testing

\`\`\`bash
nx run lexico:test
nx run lexico:develop  # Navigate to /profile
\`\`\`

Closes #123"
```

#### Using GitHub MCP Tools

```typescript
mcp_github_create_pull_request({
  owner: "JimmyPaolini",
  repo: "monorepo",
  title: "feat(lexico): ✨ add user profile page",
  head: "feat/lexico-user-profile",
  base: "main",
  body: "## Summary\n\nAdds user profile page...",
  draft: false,
});
```

See [mcp-github skill](../mcp-github/SKILL.md) for complete MCP tool documentation.

### 5. Address Review Feedback

```bash
# Make additional commits for feedback
git commit -m "fix(lexico): 🐛 address review feedback"
git push
```

### 6. Merge PR

After approval, merge using the GitHub UI or CLI:

```bash
gh pr merge --squash --delete-branch
```

## CI Requirements

All PRs must pass these checks before merging:

| Check       | Command                          | Description                                  |
| ----------- | -------------------------------- | -------------------------------------------- |
| Branch Name | `validate-branch-name`           | Branch follows naming conventions            |
| PR Title    | `commitlint`                     | Title follows commit message format          |
| PR Body     | Section validation               | Required sections: Summary, Details, Testing |
| Lint        | `nx affected --target=lint`      | ESLint validation                            |
| Typecheck   | `nx affected --target=typecheck` | TypeScript compilation                       |
| Test        | `nx affected --target=test`      | Unit and integration tests                   |
| Format      | `nx format:check`                | Prettier formatting                          |

Run locally before pushing:

```bash
# Run all checks on affected projects
nx affected --target=lint
nx affected --target=typecheck
nx affected --target=test
pnpm format
```

## Draft PRs

Use draft PRs for work in progress:

```bash
# Create draft PR
gh pr create --draft --title "feat(lexico): ✨ [WIP] add user profile"

# Mark ready for review when complete
gh pr ready
```

## Linking Issues

Reference issues in PR description:

| Keyword           | Effect                      |
| ----------------- | --------------------------- |
| `Closes #123`     | Closes issue when PR merges |
| `Fixes #123`      | Closes issue when PR merges |
| `Resolves #123`   | Closes issue when PR merges |
| `Related to #123` | Links without closing       |

## Review Requests

Request reviews from appropriate team members:

```bash
gh pr create --reviewer JimmyPaolini
```

## Updating PR Branch

Keep your branch up to date with main:

```bash
# Update from main
git fetch origin main
git rebase origin/main
git push --force-with-lease
```

Or use GitHub's "Update branch" button in the PR UI.

## Squash Merging

This monorepo uses **squash merging** by default:

- All commits in the PR become a single commit on main
- PR title becomes the commit message
- Keep PR title clean and following conventions

## Common Patterns

### Feature PR

````text
Title: feat(lexico): ✨ add dictionary search autocomplete

## Summary

Adds autocomplete suggestions to the dictionary search input.

## Changes

- Add SearchAutocomplete component
- Integrate with search API for suggestions
- Add keyboard navigation support
- Add loading and empty states

## Testing

```bash
nx run lexico:test
nx run lexico:develop
```

Navigate to search page and type a query.

Closes #234
````

### Bug Fix PR

````text
Title: fix(caelundas): 🐛 correct timezone offset in ephemeris

## Summary

Fixes incorrect timezone handling for ephemeris calculations near DST boundaries.

## Changes

- Use moment-timezone for DST-aware calculations
- Add edge case handling for DST transitions
- Add regression tests

## Testing

```bash
nx run caelundas:test:unit
nx run caelundas:test:integration
```

Fixes #456
````

### Documentation PR

```text
Title: docs(monorepo): 📝 add contributing guide

## Summary

Adds comprehensive CONTRIBUTING.md with setup instructions and guidelines.

## Changes

- Add CONTRIBUTING.md
- Update README.md with link to contributing guide
- Add development setup section

## Testing

Review the documentation changes in the PR diff.
```

### Dependency Update PR

````text
Title: chore(dependencies): ⬆️ upgrade tanstack router to v1.50

## Summary

Updates TanStack Router to latest version with bug fixes.

## Changes

- Upgrade @tanstack/react-router from 1.45.0 to 1.50.0
- Update peer dependencies
- Fix breaking changes in route definitions

## Testing

```bash
nx run lexico:test
nx run lexico:develop
```

All routes should work as before.
````

## Troubleshooting

| Issue             | Cause                     | Solution                                        |
| ----------------- | ------------------------- | ----------------------------------------------- |
| CI failing        | Code issues               | Run lint, typecheck, test locally               |
| Merge conflicts   | Branch out of date        | Rebase on main                                  |
| PR title rejected | Format incorrect          | Follow commit message conventions               |
| PR body rejected  | Missing required sections | Add ## Summary, ## Details, ## Testing sections |
| Tests failing     | Missing dependencies      | Run `pnpm install`                              |
| Typecheck errors  | Type issues               | Fix TypeScript errors                           |

## Quick Reference

```bash
# Create branch
git checkout -b <type>/<scope>-<description>

# Create PR with GitHub CLI
gh pr create --title "<type>(<scope>): <gitmoji> <subject>" --body "..."

# Run CI checks locally
nx affected --target=lint && nx affected --target=typecheck && nx affected --target=test

# Update branch
git fetch origin main && git rebase origin/main && git push --force-with-lease

# Merge PR
gh pr merge --squash --delete-branch
```

## Resources

- [PR template](../../../.github/PULL_REQUEST_TEMPLATE.md) — Default PR description template
- [commit-code skill](../commit-code/SKILL.md) — Commit and PR title format
- [checkout-branch skill](../checkout-branch/SKILL.md) — Branch naming conventions
- [mcp-github skill](../mcp-github/SKILL.md) — GitHub MCP automation
- [github-actions skill](../github-actions/SKILL.md) — CI workflow details
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Gitmoji](https://gitmoji.dev)
