# GitHub Actions Workflows

This document describes the GitHub Actions workflow architecture used in this monorepo, including the composite action pattern for Nx workspace setup.

## Composite Action Pattern

All task workflows in this repository use a composite action for consistent setup:

- **Checkout step**: Each workflow checks out the repository with full git history
- **[.github/actions/nx-setup](/.github/actions/nx-setup)**: Handles pnpm/node setup, Nx cache management, dependency installation, and prepares the workspace for task execution

This pattern reduces workflow file sizes by ~65% (from ~60 lines to ~21 lines) while maintaining consistency across all workflows.

## The nx-setup Composite Action

The [.github/actions/nx-setup/action.yml](/.github/actions/nx-setup/action.yml) composite action handles the common setup steps (requires repository checkout first):

1. Setup pnpm (version: 10.20.0)
2. Setup Node.js (version: 22.20.0) with pnpm caching
3. Set Nx SHAs for affected computation
4. Restore/save Nx cache automatically
5. Install dependencies with `pnpm install --frozen-lockfile`

### Prerequisites

The composite action requires the repository to be checked out first (with `fetch-depth: 0` for Nx affected computation):

```yaml
- name: 📥 Checkout repository
  uses: actions/checkout@v4
  with:
    fetch-depth: 0

- name: 🔧 Setup Nx workspace
  uses: ./.github/actions/nx-setup
```

### No Additional Inputs Required

The composite action has no inputs. It automatically:

- Generates cache keys based on `pnpm-lock.yaml` hash and commit SHA
- Uses restore-keys for cache fallback across branches
- Saves cache at the end of the job (via `actions/cache@v4`)

### Centralized Version Management

The composite action hardcodes pnpm and Node.js versions, providing a single source of truth for version upgrades. To upgrade these tools across all workflows:

1. Update the version numbers in [.github/actions/nx-setup/action.yml](/.github/actions/nx-setup/action.yml)
2. Commit the changes - all workflows will automatically use the new versions

## Minimal Workflow Template

Use this template to create new task workflows that follow the standard pattern:

```yaml
name: 🎯 Task Name

on:
  push:
    branches:
      - main
  pull_request:

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  task-name:
    name: 🎯 Task Name
    runs-on: ubuntu-latest

    steps:
      - name: 📥 Checkout Repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: 🔧 Setup Nx workspace
        uses: ./.github/actions/nx-setup

      - name: 🎯 Run Task
        run: npx nx affected -t task-name --parallel=3 --verbose

      # Optional: Add workflow-specific steps here (e.g., artifact uploads)
      - name: 📊 Upload Artifacts
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: task-output
          path: output/
          retention-days: 30
```

## When to Use This Pattern

**Use the composite action pattern when:**

- The workflow runs Nx tasks on affected projects
- The workflow requires full git history for Nx affected computation
- The workflow follows the standard setup → task execution flow
- You want automatic version upgrades when pnpm/node versions change

**Use a custom workflow when:**

- The workflow doesn't use Nx (e.g., dependency updates, releases)
- The workflow requires special checkout options (e.g., shallow clone)
- The workflow has unique setup requirements not covered by the composite action

## Current Workflows Using This Pattern

All task workflows use the composite action pattern:

- [lint.yml](.github/workflows/lint.yml) - ESLint checks
- [test.yml](.github/workflows/test.yml) - Unit/integration tests with coverage
- [typecheck.yml](.github/workflows/typecheck.yml) - TypeScript type checking
- [format.yml](.github/workflows/format.yml) - Prettier formatting checks
- [knip.yml](.github/workflows/knip.yml) - Unused exports/dependencies detection
- [bundlesize.yml](.github/workflows/bundlesize.yml) - Bundle size analysis
- [type-coverage.yml](.github/workflows/type-coverage.yml) - TypeScript type coverage reports
- [dependency-check.yml](.github/workflows/dependency-check.yml) - Dependency constraint validation
- [security-audit.yml](.github/workflows/security-audit.yml) - npm security audit
- [markdown-lint.yml](.github/workflows/markdown-lint.yml) - Markdown style enforcement
- [spell-check.yml](.github/workflows/spell-check.yml) - Spell checking with cspell
- [license-check.yml](.github/workflows/license-check.yml) - License compliance validation

## Workflow-Specific Steps

Some workflows include additional steps after the composite action:

- **test.yml**: Uploads coverage reports to artifacts
- **type-coverage.yml**: Uploads type coverage reports to artifacts
- **bundlesize.yml**: Restricted path triggers for web-related changes only
- **security-audit.yml**: Runs `pnpm audit` instead of Nx affected tasks
- **license-check.yml**: Weekly scheduled runs for compliance monitoring

These workflow-specific steps are preserved in the individual workflow files and not extracted into the composite action, maintaining flexibility for unique requirements.

## Cache Management

The composite action uses `actions/cache@v4` which automatically:

- **Restores** from cache at the beginning (using restore-keys for fallback)
- **Saves** to cache at the end of the job

Cache keys include:

- Primary: `nx-cache-{os}-{lockfile-hash}-{commit-sha}`
- Fallback: `nx-cache-{os}-{lockfile-hash}-`
- Fallback: `nx-cache-{os}-`

This approach:

- Leverages pnpm's built-in caching via `setup-node`
- Caches Nx task outputs across workflow runs
- Provides automatic cache invalidation on lockfile changes
- Enables cache reuse across branches with same dependencies

## Performance Benefits

The self-contained approach:

- Eliminates job orchestration overhead (no setup job dependency)
- Enables truly parallel task execution (no sequential dependency chain)
- Leverages pnpm caching for fast dependency installation (~30s)
- Caches Nx task outputs for incremental builds
- Reduces workflow complexity and maintenance burden

## Troubleshooting

**Cache not restoring:**

- Verify pnpm-lock.yaml is committed and unchanged
- Check cache storage limits in repository settings
- Review cache key output in workflow logs

**Version mismatch errors:**

- Ensure the composite action has the correct pnpm and node versions
- Clear GitHub Actions cache if versions were recently changed

**Workflow fails with "action not found":**

- Confirm the path `./.github/actions/nx-setup` is correct
- Verify the action.yml file exists in the composite action directory
- Check that the workflow has access to the repository (not running from a fork without appropriate permissions)
