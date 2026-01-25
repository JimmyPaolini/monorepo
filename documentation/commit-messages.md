---
name: commit-messages
description: Write commit messages following this monorepo's Conventional Commits standard with Gitmoji support. Use this skill when creating commits or when asked about commit message formatting.
license: MIT
---

# Commit Message Conventions

This skill teaches how to write commit messages for this monorepo. All commits **must** follow these rules to pass pre-commit checks and CI validation.

## Format

```text
<type>(<scope>): <gitmoji> <subject>

[optional body]

[optional footer]
```

### Structure Rules

1. **Header**: `<type>(<scope>): <gitmoji> <subject>` (required)
   - Must start with gitmoji emoji (`gitmoji-required`, error level 2)
   - Max 100 characters (`header-max-length: 100`)
   - Subject must not be empty (`subject-empty: never`)
2. **Body**: Optional, must be separated by blank line (`body-leading-blank: always`)
   - Max 1000 characters total (`body-max-length: 1000`, warning level 1)
   - Wrap at 72 characters per line (best practice)
3. **Footer**: Optional, must be separated by blank line (`footer-leading-blank: always`)

## Type

**Required.** Must be one of the following (enforced by `type-enum` rule, error level 2):

**Case:** Must be lowercase (`type-case: lower-case`, error level 2)

| Type       | Description                                                   | Example Use Case                  |
| ---------- | ------------------------------------------------------------- | --------------------------------- |
| `build`    | Changes that affect the build system or external dependencies | Update webpack, vite configs      |
| `chore`    | Other changes that don't modify src or test files             | Update .gitignore, housekeeping   |
| `ci`       | Changes to CI configuration files and scripts                 | Modify GitHub Actions workflows   |
| `docs`     | Documentation only changes                                    | Update README, add code comments  |
| `feat`     | A new feature                                                 | Add user authentication           |
| `fix`      | A bug fix                                                     | Fix null pointer exception        |
| `perf`     | A code change that improves performance                       | Optimize database queries         |
| `refactor` | A code change that neither fixes a bug nor adds a feature     | Rename variables, extract methods |
| `revert`   | Reverts a previous commit                                     | Revert commit abc123              |
| `style`    | Changes that do not affect the meaning of the code            | Format code, fix linting          |
| `test`     | Adding missing tests or correcting existing tests             | Add unit tests for utils          |

## Scope

**Required.** Must be one of the following (enforced by `scope-enum` rule, error level 2):

**Case:** Must be lowercase (`scope-case: lower-case`, error level 2)

### Project Scopes

- `caelundas` — Caelundas application
- `lexico` — Lexico application
- `lexico-components` — Lexico components package
- `JimmyPaolini` — JimmyPaolini application

### Category Scopes

- `monorepo` — Workspace root (nx.json, pnpm-workspace.yaml, etc.)
- `applications` — All applications (cross-cutting changes)
- `packages` — All packages (cross-cutting changes)
- `tools` — Build or development tooling

### Meta Scopes

- `documentation` — Documentation files
- `dependencies` — Dependency updates (package.json, pnpm-lock.yaml)
- `infrastructure` — Infrastructure changes (Terraform, Helm, Kubernetes)
- `deployments` — CI/CD workflows and deployment configs

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
- Be **under 45 characters** (best practice for readability with emoji)
  - Hard limit is 100 chars total for entire header (`header-max-length: 100`)
- **Not end with a period** (`subject-full-stop: never`, error level 2)
- **Not be empty** (`subject-empty: never`, error level 2)
- Be **concise and descriptive**

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

See [gitmoji.md](gitmoji.md) for the complete emoji guide.

## Body

**Optional.** Use the body to explain:

- **What** changed (if not obvious from subject)
- **Why** the change was made
- **Breaking changes** or important notes

### Body Guidelines

- Separate from subject with a **blank line**
- Wrap text at **72 characters** per line
- Use **bullet points** with `-` for lists
- Reference issues with `#123` or `fixes #123`

**Example:**

```text
feat(lexico): ✨ add user profile page

Add a dedicated profile page where users can:
- View and edit their personal information
- Upload a profile picture
- Manage account settings

This replaces the old inline profile editor which had
poor UX on mobile devices.

Fixes #234
```

## Footer

**Optional.** Use the footer for:

- Breaking changes: `BREAKING CHANGE: <description>`
- Issue references: `Fixes #123`, `Closes #456`
- Co-authors: `Co-authored-by: Name <email>`

**Example:**

```text
feat(lexico): 💥 migrate to new auth API

BREAKING CHANGE: The old /api/login endpoint is removed.
Use /api/auth/login instead.

Fixes #789
```

## Full Examples

### Simple Feature

```text
feat(caelundas): ✨ add moon phase calculations
```

### Bug Fix with Body

```text
fix(lexico): 🐛 prevent crash on null user data

Check for null user object before accessing properties.
This crash occurred when the authentication token expired
during an active session.

Fixes #456
```

### Feature with Breaking Change

```text
feat(lexico): 💥 migrate to new auth API

Replace legacy authentication system with OAuth2.
Provides better security and supports social login.

BREAKING CHANGE: The old /api/login endpoint is removed.
Use /api/auth/login instead.

Fixes #789
```

## Commitlint Rules Summary

All rules defined in [../commitlint.config.ts](../commitlint.config.ts):

**Error (level 2) - Will fail commit:**

- `gitmoji-required`: Must start with valid gitmoji
- `tense/subject-tense`: Must use imperative tense ("add" not "added")
- `type-enum`, `type-case`: Valid lowercase type required
- `scope-enum`, `scope-case`: Valid lowercase scope required
- `subject-case`: Subject must be lowercase
- `subject-full-stop`: No period at end
- `subject-empty`: Subject cannot be empty
- `header-max-length`: Max 100 characters
- `body-leading-blank`, `footer-leading-blank`: Blank lines required

**Warning (level 1) - Won't fail commit:**

- `body-max-length`: Max 1000 characters

## Validation

Commit messages are validated by:

1. **Husky pre-commit hook** — Runs commitlint locally before commit
2. **GitHub Actions CI** — Validates all commits in PRs

Configuration files:

- [../commitlint.config.ts](../commitlint.config.ts) — Complete rules and validation config
- [../.husky/commit-msg](../.husky/commit-msg) — Git hook script

## Quick Reference

```bash
# Basic format
<type>(<scope>): <gitmoji> <subject>    # Required
                                        # Blank line
<body>                                  # Optional
                                        # Blank line
<footer>                                # Optional

# Rules (all enforced at error level 2)
- Gitmoji: required at start of subject
- Tense: imperative mood (add/fix/update, not added/fixed/updated)
- Type: lowercase, from allowed list
- Scope: lowercase, from allowed list
- Subject: lowercase, imperative, no period, <45 chars
- Header: <100 chars total
- Body: blank line before, wrap at 72 chars, <1000 chars (warning)
- Footer: blank line before, for breaking changes/issue refs

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
- [gitmoji.md](gitmoji.md) — Full emoji reference
