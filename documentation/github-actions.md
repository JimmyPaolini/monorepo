# GitHub Actions CI/CD

This document describes the CI/CD pipeline architecture for the monorepo.

## Overview

The monorepo uses 9 GitHub Actions workflows and 1 composite action, all located in `.github/`. Every workflow uses the shared [`setup-monorepo`](#composite-action-setup-monorepo) composite action for consistent environment setup and Nx caching.

## Composite Action: setup-monorepo

**Location:** `.github/actions/setup-monorepo/action.yml`

All workflows call this composite action after checkout. It provides:

| Step         | Tool                            | Version | Purpose                                    |
| ------------ | ------------------------------- | ------- | ------------------------------------------ |
| pnpm         | pnpm/action-setup               | 10.20.0 | Package manager                            |
| Node.js      | actions/setup-node              | 22.20.0 | JavaScript runtime with pnpm cache         |
| Nx SHAs      | nrwl/nx-set-shas                | v4      | Calculates affected projects from git diff |
| Homebrew     | Homebrew/actions/setup-homebrew | master  | Package manager for system tools           |
| yamllint     | brew install                    | latest  | YAML linting support                       |
| Nx cache     | actions/cache                   | v4      | Restores/saves `.nx/cache` directory       |
| Dependencies | pnpm install                    | -       | Frozen lockfile install                    |

**Usage in workflows:**

```yaml
- name: 📥 Checkout Repository
  uses: actions/checkout@v4
  with:
    fetch-depth: 0

- name: 🕋 Setup Monorepo
  uses: ./.github/actions/setup-monorepo
```

---

## Workflows

### On Every PR + Push to Main

#### 1. Build Code (`build-code.yml`)

**Name:** 👷 Build Code

**Triggers:** Push to `main`, pull requests

**Jobs:**

- **Build Projects** - Runs `nx affected -t build --parallel=3` to build all affected projects
- **Bundle Report** (PR only) - Builds both PR and base branch, runs `size-limit` on affected projects, calculates size differences, and posts a comparison comment on the PR with status indicators (decrease/increase/critical)

**Concurrency:** Cancels in-progress runs for the same branch

---

#### 2. Code Analysis (`code-analysis.yml`)

**Name:** 🧑‍💻 Code Analysis

**Triggers:** Push to `main`, pull requests

**Jobs:** Single matrix job running 8 checks in parallel:

| Check            | Command                                                         |
| ---------------- | --------------------------------------------------------------- |
| 🏷️ Type Check    | `nx affected -t typecheck --parallel=3`                         |
| 🧹 Lint Check    | `nx affected -t lint --parallel=3`                              |
| 🖼️ Markdown Lint | `nx affected -t markdown-lint --parallel=3`                     |
| 📄 YAML Lint     | `nx affected -t yaml-lint --parallel=3`                         |
| 🎨 Format Check  | `nx affected -t format --configuration=check --parallel=3`      |
| ✂️ Knip Check    | `nx affected -t knip --parallel=3`                              |
| 🧙‍♂️ Spell Check   | `nx affected -t spell-check --parallel=3`                       |
| 🔖 Type Coverage | `nx affected -t type-coverage --parallel=3` (uploads artifacts) |

**Concurrency:** Cancels in-progress runs for the same branch

---

#### 3. Convention Check (`convention-check.yml`)

**Name:** 🏛️ Convention Check

**Triggers:** Pull requests (opened, reopened, synchronize, edited)

**Jobs:** Single matrix job with 3 checks:

| Check                  | What it validates                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------- |
| 🎋 Branch Validation   | Branch name matches `<type>/<scope>-<description>` pattern via `validate-branch-name` |
| 📝 PR Title Validation | PR title follows Conventional Commits format via `commitlint`                         |
| 🪢 PR Body Validation  | PR body contains required `## Summary`, `## Details`, and `## Testing` sections       |

---

#### 4. Dependency Analysis (`dependency-analysis.yml`)

**Name:** 🕵️ Dependency Analysis

**Triggers:** Push to `main`, pull requests, weekly (Monday 6am UTC)

**Jobs:** Single matrix job with 3 checks:

| Check               | Command                                                                |
| ------------------- | ---------------------------------------------------------------------- |
| 🔗 Dependency Check | `nx affected -t dependency-analysis --parallel=3` (dependency-cruiser) |
| 🔒 Security Audit   | `pnpm audit --audit-level=moderate`                                    |
| 📃 License Check    | `nx run monorepo:license-check`                                        |

---

#### 5. Test Coverage (`test-coverage.yml`)

**Name:** 🧑‍🔬 Test Code

**Triggers:** Push to `main`, pull requests

**Jobs:**

- **Test Coverage** - Runs `nx affected -t test --parallel=3 --coverage` and uploads coverage reports as artifacts (30-day retention)

---

### Automated (Push to Main)

#### 6. Release Projects (`release-projects.yml`)

**Name:** 🚀 Release Projects

**Triggers:** Push to `main`, manual dispatch

**Jobs:**

- **Release** - Runs `pnpm semantic-release` to analyze commits, bump version, update `CHANGELOG.md`, and create a GitHub release

**Permissions:** `contents: write`, `issues: write`, `pull-requests: write`

---

### Automated (Path-Filtered)

#### 7. Build Devcontainer (`build-devcontainer.yml`)

**Name:** 🐳 Build Devcontainer

**Triggers:**

- Push to `main` (only `.devcontainer/**` changes)
- Pull requests (only `.devcontainer/**` changes)
- Manual dispatch (with optional "run tests" input)

**Jobs:**

- **Build Devcontainer** - Builds the dev container image using `devcontainers/ci@v0.3`, pushes to GHCR (`ghcr.io/jimmypaolini/monorepo-devcontainer`) on push to main, uses GitHub Actions cache
- **Test Devcontainer** (conditional) - Runs `pnpm install` + `nx run-many --target=lint --all` inside the container. Only triggered by manual dispatch with `run_tests: true` or PR label `test-devcontainer`

---

### Scheduled (Weekly)

#### 8. Dependency Updates (`dependency-updates.yml`)

**Name:** 🧑‍🚒 Dependency Updates

**Triggers:** Weekly (Sunday 10am UTC), manual dispatch

**Jobs:**

- **Check Updates** - Runs `ncu --workspaces --root` to check for updates. If updates are found, applies them, updates the lockfile, closes any stale dependency update PRs, and opens a new PR with the changes

**Note:** Does **not** use the `setup-monorepo` composite action — sets up pnpm/Node.js directly to avoid Nx cache overhead for a simple dependency check.

---

#### 9. Knip Cleanup (`knip-cleanup.yml`)

**Name:** ✂️ Knip Cleanup

**Triggers:** Weekly (Sunday 6am UTC), manual dispatch

**Jobs:**

- **Knip Cleanup** - Runs `knip --fix --allow-remove-files --format` to auto-remove unused code, closes any existing cleanup PR, and opens a new PR with the changes

---

## Workflow Architecture

### Concurrency Strategy

All workflows use concurrency groups keyed by `${{ github.workflow }}-${{ github.ref }}` with `cancel-in-progress: true`. This ensures only one run per branch per workflow, canceling older runs when new commits are pushed.

### Affected Commands

Most workflows use `nx affected -t <target>` which only runs tasks on projects changed since the base branch. The `nrwl/nx-set-shas` action in `setup-monorepo` automatically determines the correct base SHA for comparison.

### Matrix Strategy

Three workflows use `fail-fast: false` matrix strategies to run multiple checks in parallel while allowing individual failures:

- `code-analysis.yml` — 8 checks
- `convention-check.yml` — 3 checks
- `dependency-analysis.yml` — 3 checks

### Caching

- **pnpm cache:** Managed by `actions/setup-node` via pnpm lockfile hash
- **Nx cache:** Managed by `actions/cache` with SHA-based keys and restore fallbacks

---

## Adding a New Workflow

1. Create `.github/workflows/<name>.yml`
2. Use the standard pattern:

   ```yaml
   name: <emoji> <Name>

   on:
     push:
       branches: [main]
     pull_request:

   concurrency:
     group: ${{ github.workflow }}-${{ github.ref }}
     cancel-in-progress: true

   jobs:
     <job-name>:
       name: <emoji> <Job Name>
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
           with:
             fetch-depth: 0
         - uses: ./.github/actions/setup-monorepo
         - run: npx nx affected -t <target> --parallel=3
   ```

3. Follow the emoji naming convention used by existing workflows
4. Use `nx affected` for project-specific tasks and `nx run monorepo:<target>` for workspace-level tasks
