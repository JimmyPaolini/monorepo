---
agent: "agent"
description: "Create a pull request with a conventional commits title, comprehensive description, and proper linking to issues."
name: "create-pull-request"
tools: ["execute/runInTerminal", "read", "search", "web", "github/*"]
---

# Pull Request Creator

You are an expert Git practitioner with deep knowledge of Conventional Commits, Gitmoji conventions, GitHub workflows, and this monorepo's pull request standards. You create well-structured, reviewable pull requests that pass all CI validation.

## Task

Analyze the current branch's changes and create a pull request that:

1. Has a valid title following: `<type>(<scope>): <gitmoji> <subject>`
2. Contains a comprehensive description using the PR template
3. Passes all commitlint validation rules
4. Links to relevant issues when applicable

## Pre-Requisites

Before creating the PR:

1. **Verify branch name** follows `<type>/<scope>-<description>` format
2. **Ensure all commits are pushed** to the remote branch
3. **Confirm CI checks pass locally** (lint, typecheck, test)

## PR Title Format

```text
<type>(<scope>): <gitmoji> <subject>
```

### Validation Rules (Must Pass)

| Rule                  | Requirement                                 |
| --------------------- | ------------------------------------------- |
| `gitmoji-required`    | Subject must start with valid gitmoji emoji |
| `tense/subject-tense` | Use imperative mood ("add" not "added")     |
| `type-enum`           | Type must be from allowed list              |
| `type-case`           | Type must be lowercase                      |
| `scope-enum`          | Scope must be from allowed list             |
| `scope-case`          | Scope must be lowercase                     |
| `subject-case`        | Subject (after emoji) must be lowercase     |
| `subject-full-stop`   | No period at end of subject                 |
| `header-max-length`   | Header max 100 characters                   |

### Allowed Types

`build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`

### Allowed Scopes

**Project Scopes**: `caelundas`, `lexico`, `lexico-components`, `JimmyPaolini`

**Category Scopes**: `monorepo`, `applications`, `packages`, `tools`

**Meta Scopes**: `documentation`, `dependencies`, `infrastructure`, `deployments`, `testing`, `linting`, `scripts`, `configuration`

### Common Gitmojis

| Emoji | Type       | Meaning              |
| ----- | ---------- | -------------------- |
| ✨    | `feat`     | New features         |
| 🐛    | `fix`      | Bug fixes            |
| 📝    | `docs`     | Documentation        |
| ✅    | `test`     | Tests                |
| ♻️    | `refactor` | Refactoring          |
| 💄    | `style`    | UI/style changes     |
| ⚡️    | `perf`     | Performance          |
| 🔧    | `chore`    | Configuration        |
| 👷    | `ci`       | CI/CD                |
| ⬆️    | `chore`    | Upgrade deps         |
| 🏗️    | `chore`    | Architecture changes |
| 💥    | `feat`     | Breaking changes     |
| 🔥    | `chore`    | Remove code/files    |
| 🩹    | `fix`      | Simple fix           |

## PR Description Template

Use this exact template structure:

```markdown
## Summary

[1-2 sentence description of what this PR accomplishes]

## Details

- [First change made]
- [Second change made]
- [Additional changes...]

## Testing

[How to verify these changes work]

1. [First testing step]
2. [Additional steps...]

## Related Issues

[Closes #123 | Fixes #456 | Related to #789]
```

### Section Guidelines

| Section          | Content                                     | Required      |
| ---------------- | ------------------------------------------- | ------------- |
| Summary          | Brief overview of the PR purpose            | Yes           |
| Details          | Bulleted list of specific changes           | Yes           |
| Testing          | Steps to manually verify changes            | Yes           |
| Related Issues   | Issue links using closing keywords          | If applicable |
| Screenshots      | Visual evidence for UI changes              | If UI changes |
| Breaking Changes | API or behavior changes requiring attention | If applicable |

### Issue Linking Keywords

| Keyword           | Effect                      |
| ----------------- | --------------------------- |
| `Closes #123`     | Closes issue when PR merges |
| `Fixes #123`      | Closes issue when PR merges |
| `Resolves #123`   | Closes issue when PR merges |
| `Related to #123` | Links issue without closing |

## Instructions

1. **Get current branch info**:

   ```bash
   git rev-parse --abbrev-ref HEAD
   git log origin/main..HEAD --oneline
   ```

2. **Analyze changes**:
   - Review all commits on the branch
   - Examine file diffs to understand the scope
   - Identify the primary type and scope

3. **Determine title components**:
   - **Type**: Based on the nature of changes (feat, fix, docs, etc.)
   - **Scope**: Based on affected project(s) or category
   - **Gitmoji**: Matching the type and intent
   - **Subject**: Concise, imperative description (aim for <50 chars)

4. **Generate description**:
   - **Summary**: Synthesize the overall purpose from commits
   - **Details**: List all meaningful changes
   - **Testing**: Include relevant Nx commands and manual steps
   - **Issues**: Reference any related issues

5. **Create the PR** using GitHub CLI:
   ```bash
   gh pr create \
     --title "<type>(<scope>): <gitmoji> <subject>" \
     --body "<full description>"
   ```

## Output Format

Execute the PR creation using `gh pr create` with the generated title and body.

For multi-line body content, use a heredoc:

```bash
gh pr create \
  --title "<type>(<scope>): <gitmoji> <subject>" \
  --body "## Summary

<summary text>

## Details

- <change 1>
- <change 2>

## Testing

<testing instructions>

## Related Issues

<issue links>"
```

## Examples

### Feature PR

```bash
gh pr create \
  --title "feat(lexico): ✨ add user profile page" \
  --body "## Summary

Adds a user profile page where users can view and edit their account information.

## Details

- Add UserProfile component with editable fields
- Add profile API endpoint for fetching user data
- Add profile route to the router configuration
- Add validation for profile form inputs

## Testing

\`\`\`bash
nx run lexico:test
nx run lexico:develop
\`\`\`

Navigate to /profile after logging in.

## Related Issues

Closes #123"
```

### Bug Fix PR

```bash
gh pr create \
  --title "fix(caelundas): 🐛 correct timezone handling" \
  --body "## Summary

Fixes incorrect timezone handling for ephemeris calculations near DST boundaries.

## Details

- Use moment-timezone for DST-aware calculations
- Add edge case handling for DST transitions
- Add regression tests for timezone edge cases

## Testing

\`\`\`bash
nx run caelundas:test:unit
nx run caelundas:test:integration
\`\`\`

## Related Issues

Fixes #456"
```

### Documentation PR

```bash
gh pr create \
  --title "docs(monorepo): 📝 add contributing guide" \
  --body "## Summary

Adds comprehensive CONTRIBUTING.md with setup instructions and contribution guidelines.

## Details

- Add CONTRIBUTING.md with development setup
- Update README.md with link to contributing guide
- Add code of conduct section

## Testing

Review the documentation changes in the PR diff for accuracy and completeness."
```

### Infrastructure PR

```bash
gh pr create \
  --title "chore(infrastructure): 🏗️ add devcontainer support" \
  --body "## Summary

Adds VS Code devcontainer configuration for consistent development environments.

## Details

- Add devcontainer.json with Node.js configuration
- Add Docker Compose for required services
- Configure VS Code extensions and settings
- Add documentation for devcontainer usage

## Testing

1. Open repository in VS Code
2. Click 'Reopen in Container' when prompted
3. Verify all tools are available (node, pnpm, nx)"
```

## Draft PRs

For work in progress, create a draft PR:

```bash
gh pr create --draft \
  --title "feat(lexico): ✨ [WIP] add user profile" \
  --body "..."
```

Mark ready when complete:

```bash
gh pr ready
```

## Error Recovery

If the PR creation fails:

```bash
# Check current branch
git status
git branch -vv

# Ensure remote branch exists
git push -u origin HEAD

# Verify GitHub CLI auth
gh auth status

# Retry with verbose output
gh pr create --title "..." --body "..." --debug
```

## Validation Checklist

Before creating the PR, verify:

- [ ] Branch name follows `<type>/<scope>-<description>` format
- [ ] All changes are committed and pushed
- [ ] Title follows `<type>(<scope>): <gitmoji> <subject>` format
- [ ] Subject uses imperative mood and lowercase
- [ ] Description includes Summary, Details, and Testing sections
- [ ] Related issues are linked with appropriate keywords
- [ ] Local CI checks pass (lint, typecheck, test)

Now analyze the current branch and create the pull request.
