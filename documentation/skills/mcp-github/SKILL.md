---
name: mcp-github
description: Use gh CLI and git commands for GitHub repository operations — PRs, issues, branches, and code search.
license: MIT
---

# GitHub CLI & Git Workflows

Use `gh` (GitHub CLI) and `git` for all GitHub repository operations. The `gh` CLI is authenticated in the Copilot environment and covers every common workflow.

## When to Use This Skill

- Creating or updating pull requests
- Managing issues and labels
- Reviewing code changes
- Working with branches and commits
- Searching code and repositories

## Quick Reference

| Task | Command |
| ---- | ------- |
| Create PR | `gh pr create` |
| Update PR | `gh pr edit` |
| View PR | `gh pr view` |
| Merge PR | `gh pr merge` |
| List PRs | `gh pr list` |
| Review PR | `gh pr review` |
| Create issue | `gh issue create` |
| List issues | `gh issue list` |
| Close issue | `gh issue close` |
| Create branch | `git checkout -b` + `git push` |
| Read file | `cat` / view tool |
| Write file | edit tool + `git commit` + `git push` |
| Search code | `grep -r` (local) or `gh search code` |

## Workflow Patterns

### Creating Pull Requests

```bash
# 1. Create feature branch
git checkout -b feat/new-feature

# 2. Make changes, commit, push
git add .
git commit -m "feat(lexico-components): ✨ add new button component"
git push -u origin feat/new-feature

# 3. Create pull request
gh pr create \
  --title "feat(lexico-components): ✨ add new button component" \
  --assignee @me \
  --body "## 🌰 Summary

Adds a new button component to lexico-components.

## 📝 Details

- Add NewButton component
- Export from index

## 🧪 Testing

\`nx run lexico-components:test\`

## 🔗 Related

- <!-- links -->"
```

### Code Review Workflow

```bash
# View PR details
gh pr view 42

# View diff
gh pr diff 42

# Submit review
gh pr review 42 --approve --body "Looks good!"
# or
gh pr review 42 --comment --body "A few suggestions..."
# or
gh pr review 42 --request-changes --body "Please fix..."
```

### Issue Operations

```bash
# Create issue
gh issue create \
  --title "Add dark mode support to lexico-components" \
  --body "Add dark mode theming support to all components." \
  --label "enhancement,lexico-components" \
  --assignee JimmyPaolini

# Search issues
gh issue list --search "is:open label:bug"

# Comment and close issue
gh issue comment 123 --body "Fixed in PR #456"
gh issue close 123
```

### Repository File Operations

```bash
# Read file
cat package.json

# Edit file with editor / edit tool, then commit and push
git add package.json
git commit -m "chore(monorepo): bump version to 1.2.3"
git push
```

## Project-Specific Usage

### monorepo Automation

**Create documentation PR:**

```bash
git checkout -b docs/update-agents
# ... make file edits ...
git add AGENTS.md applications/caelundas/AGENTS.md applications/lexico/AGENTS.md
git commit -m "docs: update AGENTS.md documentation"
git push -u origin docs/update-agents
gh pr create \
  --title "docs: update AGENTS.md documentation" \
  --assignee @me \
  --body "Updates AGENTS.md files with latest architecture patterns."
```

**Read PR template:**

```bash
cat .github/PULL_REQUEST_TEMPLATE.md
```

### Issue Automation

**Create issues from backlog:**

```bash
gh issue create \
  --title "Add pagination to search results" \
  --body "Estimated effort: 5 story points" \
  --label "enhancement,lexico"

gh issue create \
  --title "Improve ephemeris calculation performance" \
  --body "Estimated effort: 8 story points" \
  --label "performance,caelundas"
```

**Close stale issues:**

```bash
# List old issues
gh issue list --search "is:open created:<2024-01-01"

# Close with comment
gh issue comment 123 --body "Closing due to inactivity. Please reopen if still relevant."
gh issue close 123
```

## Advanced Patterns

### Automated Release PR

```bash
# Get last release tag
git describe --tags --abbrev=0

# Get commits since last release
git log <last-tag>..HEAD --oneline

# Create release branch, update files, push
git checkout -b release/1.2.3
# ... edit package.json, CHANGELOG.md ...
git add package.json CHANGELOG.md
git commit -m "chore(monorepo): release 1.2.3"
git push -u origin release/1.2.3

# Create release PR
gh pr create \
  --title "chore(monorepo): release 1.2.3" \
  --assignee @me \
  --body "$(cat CHANGELOG.md)"
```

### Code Search & Refactoring

```bash
# Find all usages of deprecated API in local checkout
grep -r "oldAPIFunction" --include="*.ts" .

# Search on GitHub
gh search code "oldAPIFunction" --repo JimmyPaolini/monorepo
```

## Best Practices

1. **Use descriptive PR titles** following conventional commits
2. **Include comprehensive PR descriptions** with context and testing
3. **Request reviews** from appropriate team members
4. **Label issues and PRs** for organization
5. **Close issues with references** (`Closes #123`)
6. **Use draft PRs** for work in progress
7. **Keep commits atomic** and well-described

## Troubleshooting

**Authentication:**

```bash
gh auth status
gh auth login
```

**File conflicts:**

- Pull latest changes before updating: `git pull --rebase`
- Handle merge conflicts manually, then `git push --force-with-lease`

## Related Documentation

- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Contribution guidelines
- [commit-code skill](../commit-code/SKILL.md) - Commit message format
- [github-actions skill](../github-actions/SKILL.md) - CI/CD workflows
- [create-pull-request skill](../create-pull-request/SKILL.md) - PR conventions

## See Also

- **github-actions skill** - For workflow automation
- **commit-code skill** - For proper commit formatting
- **create-pull-request skill** - For PR conventions and description template
