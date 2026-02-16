---
name: commit-code
description: Write commit messages following this monorepo's Conventional Commits standard with Gitmoji support. Use this skill when creating commits or when asked about commit message formatting.
license: MIT
---

# Commit Message Conventions

This skill teaches how to write commit messages for this monorepo. All commits **must** follow these rules to pass pre-commit checks and CI validation.

## Format

```text
<type>(<scope>): <gitmoji> <subject>
```

**Note:** Body and footer sections are **forbidden** by commitlint configuration.

### Structure Rules

1. **Header**: `<type>(<scope>): <gitmoji> <subject>` (required)
   - Must start with gitmoji emoji (`gitmoji-required`, error level 2)
   - Max 128 characters (`header-max-length: 128`)
   - Subject must not be empty (`subject-empty: never`)
2. **Body**: Forbidden (`body-empty: always`, error level 2)
3. **Footer**: Forbidden (`footer-empty: always`, error level 2)

## Type

**Required.** Must be one of the allowed types defined in [conventional.config.cjs](../../../conventional.config.cjs) (enforced by `type-enum` rule, error level 2).

**Case:** Must be lowercase (`type-case: lower-case`, error level 2)

<!-- types-start -->

| Type       | Description                                                                         |
| ---------- | ----------------------------------------------------------------------------------- |
| `build`    | Build system, Vite/Docker/Helm config, or external dependency integration           |
| `chore`    | Housekeeping that doesn't modify src or test files (gitignore, editor config, etc.) |
| `ci`       | GitHub Actions workflows, composite actions, and CI/CD scripts                      |
| `docs`     | Documentation, AGENTS.md, SKILL.md, README, and planning files                      |
| `feat`     | A new feature or capability                                                         |
| `fix`      | A bug fix                                                                           |
| `perf`     | A code change that improves performance (caching, query optimization, etc.)         |
| `refactor` | Code restructuring that neither fixes a bug nor adds a feature                      |
| `revert`   | Reverts a previous commit                                                           |
| `style`    | Formatting, whitespace, or code structure changes with no semantic effect           |
| `test`     | Adding or correcting unit, integration, or end-to-end tests                         |

<!-- types-end -->

## Scope

**Required.** Must be one of the allowed scopes defined in [conventional.config.cjs](../../../conventional.config.cjs) (enforced by `scope-enum` rule, error level 2).

**Case:** Must be lowercase (`scope-case: lower-case`, error level 2)

<!-- scopes-start -->

| Scope               | Description                                                                   |
| ------------------- | ----------------------------------------------------------------------------- |
| `applications`      | Changes spanning multiple apps (caelundas, lexico, JimmyPaolini)              |
| `caelundas`         | Node.js CLI for astronomical calendar generation (NASA JPL ephemeris)         |
| `configuration`     | Workspace root config files (tsconfig, eslint, vitest, nx.json, etc.)         |
| `dependencies`      | Dependency version changes (upgrades, additions, removals via pnpm)           |
| `deployments`       | GitHub Actions workflows and CI/CD pipeline configuration                     |
| `documentation`     | Markdown docs, skills, planning files, and AGENTS.md files                    |
| `infrastructure`    | Helm charts, Terraform configs, and Kubernetes resources                      |
| `JimmyPaolini`      | Static GitHub profile README project (markdown and assets)                    |
| `lexico-components` | Shared React/shadcn component library in packages/                            |
| `lexico`            | TanStack Start SSR Latin dictionary web app with Supabase backend             |
| `linting`           | ESLint configs, rules, plugins, and lint-related tooling                      |
| `monorepo`          | Workspace root concerns (pnpm-workspace, root package.json, Nx orchestration) |
| `packages`          | Changes spanning multiple shared packages                                     |
| `scripts`           | Shell and TypeScript scripts in scripts/ (sync, setup, utilities)             |
| `testing`           | Vitest configuration, shared test utilities, and coverage setup               |
| `tools`             | Nx custom generators and developer tooling in tools/                          |

<!-- scopes-end -->

### Scope Selection Guidelines

1. **Single project change**: Use project scope (`caelundas`, `lexico`, etc.)
2. **Multiple projects of same type**: Use category scope (`applications`, `packages`)
3. **Workspace config**: Use `monorepo`
4. **CI/CD**: Use `deployments`
5. **Docs**: Use `documentation`
6. **Dependencies**: Use `dependencies`

## Subject

**Required.** The subject line must:

- **Start with gitmoji** (`gitmoji-required`, error level 2) - see Gitmoji section below
- Be **lowercase** after the emoji (`subject-case: lower-case`, error level 2)
- Use **imperative mood** (`tense/subject-tense: imperative`, error level 2)
  - ✅ "add feature" ✅ "fix bug" ✅ "update docs"
  - ❌ "added feature" ❌ "fixes bug" ❌ "updating docs"
- Be **under 72 characters** (best practice for readability with emoji)
  - Hard limit is 128 chars total for entire header (`header-max-length: 128`)
  - See **Character Budget** section below for calculating available space
- **Not end with a period** (`subject-full-stop: never`, error level 2)
- **Not be empty** (`subject-empty: never`, error level 2)
- Be **concise and descriptive**
- **Describe ONE logical change** — never list multiple changes with commas or "and"

### Character Budget & Multi-Change Commits

The prefix `type(scope): <gitmoji>` eats into the 128-char header limit. Long scopes like `infrastructure` (~27 chars) or `lexico-components` (~35 chars) leave as few as **93–101 characters** for the subject. Always count the full header.

When a commit touches multiple concerns, **summarize or split** — never list changes with commas/"and":

```text
# ❌ BAD — lists multiple changes with commas/"and"
feat(infrastructure): 🏗️ migrate lint-staged configuration to new file, add sync scripts for VS Code extensions and conventional commit scopes

# ✅ Summarize at a higher level
feat(infrastructure): 🏗️ add lint-staged config and sync scripts

# ✅ Or split into separate commits
feat(infrastructure): 🏗️ migrate lint-staged to standalone config
feat(scripts): ✨ add vscode extension sync script
feat(scripts): ✨ add conventional scopes sync script
```

### Examples

✅ **Good:**

```text
feat(lexico): ✨ add user profile page
fix(caelundas): 🐛 correct aspect angle calculation
docs(monorepo): 📝 update nx workspace guide
chore(dependencies): ⬆️ upgrade react to v19
```

❌ **Bad:**

```text
feat(lexico): add user profile page             # Missing gitmoji
feat(lexico): ✨ Added profile page.             # Wrong tense, period
Fix(Caelundas): 🐛 fix bug                       # Wrong case (type)
fix(caelundas): 🐛 Fix bug                       # Wrong case (subject)
docs: 📝 updated docs                            # Missing scope, wrong tense
chore(deps): ⬆️ bump                             # Invalid scope (use 'dependencies')
feat(infrastructure): 🏗️ add config, scripts, and sync tools  # Too verbose, lists multiple changes
```

## Gitmoji

**Required.** Must add a gitmoji emoji at the start of the subject line (`gitmoji-required`, error level 2). Use either the emoji glyph or short code.

Format: `<type>(<scope>): <gitmoji> <subject>`

### Common Gitmojis

| Emoji | Code                    | Type         | Meaning                  |
| ----- | ----------------------- | ------------ | ------------------------ |
| ✨    | `:sparkles:`            | `feat`       | Introduce new features   |
| 🐛    | `:bug:`                 | `fix`        | Fix a bug                |
| 📝    | `:memo:`                | `docs`       | Add/update documentation |
| ✅    | `:white_check_mark:`    | `test`       | Add/update tests         |
| ♻️    | `:recycle:`             | `refactor`   | Refactor code            |
| 💄    | `:lipstick:`            | `style`      | UI and style files       |
| 🎨    | `:art:`                 | `style`      | Improve code structure   |
| ⚡️    | `:zap:`                 | `perf`       | Improve performance      |
| 🔧    | `:wrench:`              | `chore`      | Configuration files      |
| 👷    | `:construction_worker:` | `ci`         | CI build system          |
| ⬆️    | `:arrow_up:`            | `chore`      | Upgrade dependencies     |
| 🗃️    | `:card_file_box:`       | `feat`/`fix` | Database changes         |

See [gitmoji.md](../../gitmoji.md) for the complete emoji guide.

## Body and Footer

**Forbidden.** Body and footer sections are not allowed in commit messages in this repository. All information must be conveyed in the subject line.

If you need to provide:

- **Issue references**: Link the PR to issues in GitHub UI, or use commit description in GitHub
- **Breaking changes**: Prefix subject with 💥 gitmoji
- **Detailed explanations**: Add to PR description instead of commit message

## Full Examples

### Simple Feature

```text
feat(caelundas): ✨ add moon phase calculations
```

### Bug Fix

```text
fix(lexico): 🐛 prevent crash on null user data
```

### Breaking Change

```text
feat(lexico): 💥 migrate to new auth API
```

## Git CLI Usage

### Committing from the Command Line

Since body and footer sections are forbidden, all commits must be single-line:

```bash
git commit -m "feat(monorepo): ✨ add new feature"
```

Use the `-m` flag with your complete commit message in the proper format.

### Common Pitfalls

❌ **Avoid:** Using multiple `-m` flags or newlines:

```bash
# This will fail - no body allowed
git commit -m "feat(monorepo): ✨ add feature" \
           -m "This is the body paragraph"

# This will also fail
git commit -m "feat(monorepo): ✨ add feature
This is the body"
```

### Tips

- Use `git commit --amend` to edit the last commit message
- Test commit messages locally before pushing: `git log --oneline -1`
- Put detailed explanations in the PR description, not the commit message

## Commitlint Rules Summary

All rules defined in [../commitlint.config.ts](../../../commitlint.config.ts):

**Error (level 2) - Will fail commit:**

- `gitmoji-required`: Must start with valid gitmoji
- `tense/subject-tense`: Must use imperative tense ("add" not "added")
- `type-enum`, `type-case`: Valid lowercase type required
- `scope-enum`, `scope-case`: Valid lowercase scope required
- `subject-case`: Subject must be lowercase
- `subject-full-stop`: No period at end
- `subject-empty`: Subject cannot be empty
- `header-max-length`: Max 128 characters
- `body-empty`: Body is forbidden
- `footer-empty`: Footer is forbidden

## Validation

Commit messages are validated by:

1. **Husky pre-commit hook** — Runs commitlint locally before commit
2. **GitHub Actions CI** — Validates all commits in PRs

Configuration files:

- [../../../commitlint.config.ts](../../../commitlint.config.ts) — Complete rules and validation config
- [../../../.husky/commit-msg](../../../.husky/commit-msg) — Git hook script

## Quick Reference

```bash
# Basic format
<type>(<scope>): <gitmoji> <subject>    # Required (single line only)

# Rules (all enforced at error level 2)
- Gitmoji: required at start of subject
- Tense: imperative mood (add/fix/update, not added/fixed/updated)
- Type: lowercase, from allowed list
- Scope: lowercase, from allowed list
- Subject: lowercase, imperative, no period, <72 chars
- Header: <128 chars total (count prefix + subject!)
- Body: forbidden
- Footer: forbidden
- NEVER list multiple changes with commas/"and" — summarize or split commits

# Common patterns
feat(project): ✨ add feature
fix(project): 🐛 fix bug
docs(documentation): 📝 update docs
chore(dependencies): ⬆️ upgrade deps
test(project): ✅ add tests
refactor(project): ♻️ refactor code
```

## Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Gitmoji Guide](https://gitmoji.dev)
- [commitlint](https://commitlint.js.org/)
- [gitmoji.md](../../gitmoji.md) — Full emoji reference
