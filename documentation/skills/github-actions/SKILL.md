---
name: github-actions
description: Build and test GitHub Actions workflows in this monorepo. Covers the composite action pattern and workflow templates. Use this skill when creating, modifying, or testing GitHub Actions workflows.
license: MIT
---

# GitHub Actions Workflows

Complete guide for building and testing GitHub Actions workflows in this Nx monorepo.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Creating Workflows](#creating-workflows)
- [Troubleshooting](#troubleshooting)
- [Reference](#reference)

## Architecture Overview

### Composite Action Pattern

All task workflows in this repository use a composite action for consistent setup, reducing workflow file sizes by ~65% (from ~60 lines to ~21 lines):

- **Checkout step**: Each workflow checks out the repository with full git history
- **[.github/actions/setup-monorepo](/.github/actions/setup-monorepo)**: Handles pnpm/node setup, Nx cache management, dependency installation, and prepares the workspace for task execution

### The setup-monorepo Composite Action

The [.github/actions/setup-monorepo/action.yml](/.github/actions/setup-monorepo/action.yml) composite action handles common setup steps (requires repository checkout first):

1. Setup pnpm (version: 10.20.0)
2. Setup Node.js (version: 22.20.0) with pnpm caching
3. Set Nx SHAs for affected computation
4. Restore/save Nx cache automatically
5. Install dependencies with `pnpm install --frozen-lockfile`

**Prerequisites:** The composite action requires the repository to be checked out first with `fetch-depth: 0` for Nx affected computation:

```yaml
- name: 📥 Checkout repository
  uses: actions/checkout@v4
  with:
    fetch-depth: 0

- name: 🕋 Setup Monorepo
  uses: ./.github/actions/setup-monorepo
```

**No Additional Inputs Required:** The composite action automatically generates cache keys based on `pnpm-lock.yaml` hash and commit SHA, with restore-keys for cache fallback.

**Centralized Version Management:** To upgrade pnpm or Node.js across all workflows, update version numbers in [.github/actions/setup-monorepo/action.yml](/.github/actions/setup-monorepo/action.yml) - all workflows will automatically use the new versions.

## Creating Workflows

### Minimal Workflow Template

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

      - name: 🕋 Setup Monorepo
        uses: ./.github/actions/setup-monorepo

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

### When to Use This Pattern

**Use the composite action pattern when:**

- The workflow runs Nx tasks on affected projects
- The workflow requires full git history for Nx affected computation
- The workflow follows the standard setup → task execution flow
- You want automatic version upgrades when pnpm/node versions change

**Use a custom workflow when:**

- The workflow doesn't use Nx (e.g., dependency updates, releases)
- The workflow requires special checkout options (e.g., shallow clone)
- The workflow has unique setup requirements not covered by the composite action

### Current Workflows Using This Pattern

All task workflows use the composite action pattern:

- [lint.yml](.github/workflows/lint.yml) - ESLint checks
- [test.yml](.github/workflows/test.yml) - Unit/integration tests with coverage
- [typecheck.yml](.github/workflows/typecheck.yml) - TypeScript type checking
- [format.yml](.github/workflows/format.yml) - Prettier formatting checks
- [knip.yml](.github/workflows/knip.yml) - Unused exports/dependencies detection
- [bundlesize.yml](.github/workflows/bundlesize.yml) - Bundle size analysis
- [type-coverage.yml](.github/workflows/type-coverage.yml) - TypeScript type coverage reports
- [dependency-analysis.yml](.github/workflows/dependency-analysis.yml) - Dependency constraint validation
- [security-audit.yml](.github/workflows/security-audit.yml) - npm security audit
- [markdown-lint.yml](.github/workflows/markdown-lint.yml) - Markdown style enforcement
- [spell-check.yml](.github/workflows/spell-check.yml) - Spell checking with cspell
- [license-check.yml](.github/workflows/license-check.yml) - License compliance validation

### Workflow-Specific Steps

Some workflows include additional steps after the composite action:

- **test.yml**: Uploads coverage reports to artifacts
- **type-coverage.yml**: Uploads type coverage reports to artifacts
- **bundlesize.yml**: Restricted path triggers for web-related changes only
- **security-audit.yml**: Runs `pnpm audit` instead of Nx affected tasks
- **license-check.yml**: Weekly scheduled runs for compliance monitoring

These workflow-specific steps are preserved in individual workflow files, maintaining flexibility for unique requirements.

## Troubleshooting

### NX Affected Not Working in CI

If `nx affected` shows no projects or wrong projects in GitHub Actions:

1. **Verify fetch-depth is set to 0**:

   ```yaml
   - name: 📥 Checkout repository
     uses: actions/checkout@v4
     with:
       fetch-depth: 0 # Required for Nx affected
   ```

2. **Check the nx-set-shas action is running**:
   The `nrwl/nx-set-shas@v4` action sets `NX_BASE` and `NX_HEAD` environment variables automatically.

3. **Test locally**:

   ```bash
   # Export the same variables locally to debug
   export NX_BASE=$(git merge-base origin/main HEAD)
   export NX_HEAD=$(git rev-parse HEAD)

   # Run nx affected to see what projects it finds
   npx nx affected:graph
   npx nx affected -t lint --dry-run
   ```

### Workflow Fails on GitHub but Works Locally

Common causes:

- **Environment variables**: Ensure all required secrets are configured in GitHub repository settings
- **Cache issues**: Clear GitHub Actions cache and re-run
- **Dependency versions**: Check for platform-specific package installation failures

### Cache Not Working

If workflows install dependencies every time:

1. Verify `pnpm-lock.yaml` is committed
2. Check cache keys in workflow logs match expected pattern
3. Clear GitHub Actions cache after pnpm/node version changes in composite action

## Best Practices

1. **Test locally before pushing** - Run `nx affected` locally to catch errors early
2. **Use composite action** - Leverage [.github/actions/setup-monorepo](/.github/actions/setup-monorepo) for consistency
3. **Keep versions centralized** - Update pnpm/node versions in composite action only
4. **Monitor cache usage** - Review workflow run times to ensure caching is effective
5. **Use meaningful job names** - Include emojis and clear descriptions for better visibility

## Reference

### Quick Commands

```bash
# Local testing
npx nx affected -t lint,typecheck --dry-run  # Preview affected projects
npx nx affected:graph                         # Visualize project dependencies

# NX SHA management for debugging
export NX_BASE=$(git merge-base origin/main HEAD)
export NX_HEAD=$(git rev-parse HEAD)
npx nx affected -t lint --dry-run            # Test with explicit SHAs

# Common workflow commands
npx nx affected -t lint --parallel=3         # Lint affected projects
npx nx affected -t test --parallel=3         # Test affected projects
npx nx affected -t build --parallel=3        # Build affected projects
```

### Cache Management

- **Keys**: `nx-cache-{os}-{lockfile-hash}-{commit-sha}` with fallbacks
- **Benefits**: Parallel execution, fast pnpm installs (~30s), incremental builds
- **Troubleshooting**: Check lockfile is committed, review cache keys in logs, clear GitHub Actions cache after version changes

### Links

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Actions Events](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows)
- [Nx Affected Documentation](https://nx.dev/concepts/affected)
- [Composite Actions Guide](https://docs.github.com/en/actions/creating-actions/creating-a-composite-action)
