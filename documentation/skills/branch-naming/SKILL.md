---
name: branch-naming
description: Create and validate Git branch names following this monorepo's Conventional Commits naming convention. Use this skill when creating branches, renaming branches, or when asked about branch naming rules and validation.
license: MIT
---

# Branch Naming Conventions

This skill teaches how to name Git branches for this monorepo. All branch names **must** follow these rules to pass pre-push hooks and CI validation.

## When to Use This Skill

- Creating a new feature, fix, or other branch
- Renaming an existing branch to comply with conventions
- Understanding why a branch name was rejected
- Validating branch names before pushing

## Format

```text
<type>/<scope>-<description>
```

**All three parts are required.** The description must be kebab-case (lowercase with hyphens).

## Type

**Required.** Must be one of the allowed types defined in [conventional.config.cjs](../../../conventional.config.cjs):

| Type       | Purpose                  |
| ---------- | ------------------------ |
| `build`    | Build system changes     |
| `chore`    | Maintenance tasks        |
| `ci`       | CI/CD configuration      |
| `docs`     | Documentation only       |
| `feat`     | New features             |
| `fix`      | Bug fixes                |
| `perf`     | Performance improvements |
| `refactor` | Code refactoring         |
| `revert`   | Reverting changes        |
| `style`    | Code style/formatting    |
| `test`     | Adding/updating tests    |

## Scope

**Required.** Must be one of the allowed scopes:

### Project Scopes

Individual projects/applications:

- `caelundas` — Astronomical calendar CLI
- `lexico` — Latin dictionary web app
- `lexico-components` — Shared UI component library
- `JimmyPaolini` — Portfolio website

### Category Scopes

Groups of projects or cross-cutting concerns:

- `monorepo` — Workspace-level configuration
- `applications` — Multiple apps affected
- `packages` — Multiple packages affected
- `tools` — Tooling changes
- `documentation` — Documentation updates
- `dependencies` — Dependency updates
- `infrastructure` — Helm, Terraform, Docker
- `deployments` — CI/CD and deployment
- `testing` — Test infrastructure
- `linting` — Lint configuration
- `scripts` — Build/utility scripts
- `configuration` — Config files

## Description

**Required.** The description must be:

- **Lowercase** — No capital letters
- **Kebab-case** — Words separated by hyphens
- **Descriptive** — Clearly indicate the purpose

### Examples

✅ **Good:**

```bash
git checkout -b feat/lexico-user-auth
git checkout -b fix/caelundas-timezone-bug
git checkout -b docs/monorepo-architecture
git checkout -b chore/dependencies-update-nx
git checkout -b feat/infrastructure-devcontainer
```

❌ **Bad:**

```bash
git checkout -b feat/lexico                  # Missing description
git checkout -b fix/caelundas                # Missing description
git checkout -b feature/lexico-auth          # Invalid type (use 'feat')
git checkout -b feat/lexicoAuth              # Wrong case (use kebab-case)
git checkout -b feat/deps-update             # Invalid scope (use 'dependencies')
```

## Special Branches

These branches are exempt from the naming convention:

- `main` — Default branch
- `develop` — Development branch
- `renovate/*` — Automated dependency updates
- `dependabot/*` — Automated dependency updates

## Creating Branches

```bash
# Feature branch for lexico project
git checkout -b feat/lexico-dashboard

# Bug fix for caelundas project
git checkout -b fix/caelundas-timezone

# Documentation update for monorepo
git checkout -b docs/monorepo-architecture

# Infrastructure change
git checkout -b chore/infrastructure-helm-chart
```

## Renaming Branches

If a branch name is rejected, rename it:

```bash
# Rename local branch
git branch -m <type>/<scope>-<description>

# If already pushed, update remote
git push origin -u <new-branch-name>
git push origin --delete <old-branch-name>
```

## Validation

Branch names are validated at multiple stages:

| Stage | Mechanism                                 | Config File                       |
| ----- | ----------------------------------------- | --------------------------------- |
| Local | `.husky/pre-push` hook                    | `validate-branch-name.config.cjs` |
| CI    | `.github/workflows/branch-validation.yml` | Same config                       |

The validation config imports types and scopes from [conventional.config.cjs](../../../conventional.config.cjs) to ensure consistency with commit message rules.

## Troubleshooting

| Issue                 | Cause                   | Solution                                              |
| --------------------- | ----------------------- | ----------------------------------------------------- |
| "Branch name invalid" | Missing description     | Add `-<description>` after scope                      |
| "Unknown scope"       | Typo or invalid scope   | Check allowed scopes list above                       |
| "Unknown type"        | Typo or invalid type    | Check allowed types list above                        |
| "Invalid format"      | Wrong separator or case | Use `/` after type, `-` in description, all lowercase |

## Quick Reference

```bash
# Format
<type>/<scope>-<description>

# Common patterns
feat/lexico-feature-name        # New feature in lexico
fix/caelundas-bug-name          # Bug fix in caelundas
docs/documentation-topic        # Documentation update
chore/dependencies-update       # Dependency update
refactor/monorepo-cleanup       # Refactoring

# Rules
- Type: lowercase, from allowed list (feat, fix, docs, etc.)
- Scope: lowercase, from allowed list (project or category)
- Description: required, lowercase, kebab-case
- Separator: / between type and scope, - between scope and description
```

## Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [validate-branch-name.config.cjs](../../../validate-branch-name.config.cjs) — Validation config
- [conventional.config.cjs](../../../conventional.config.cjs) — Types and scopes
