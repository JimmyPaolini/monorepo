---
name: Migrate Monorepo to PNPM Catalogs
description: Replace explicit semver version strings across all workspace package.json files with pnpm catalog references, making pnpm-workspace.yaml the single source of truth for all external dependency versions.
created: 2026-07-06T13:58:40Z
updated: 2026-07-07T02:45:17Z
status: 'In progress'
---

# Introduction

![Status: In progress](https://img.shields.io/badge/status-In%20progress-yellow)

This plan migrates the monorepo to use [PNPM Catalogs](https://pnpm.io/catalogs) — a feature (available since pnpm v9.5.0, fully supported in the repo's `pnpm@11.2.2`) that centralizes all external dependency version strings in a `catalog:` section of `pnpm-workspace.yaml`. Individual `package.json` files then reference those entries via the `catalog:` protocol instead of hard-coding version ranges, eliminating the risk of version drift across the 8 workspace projects. A `catalogMode: strict` policy is applied post-migration so that `pnpm add` refuses new installs that are not cataloged first, keeping the workspace consistently governed.

## 1. Requirements & Constraints

- **REQ-001**: All external dependencies in every workspace `package.json` (`applications/*`, `packages/*`, `tools/*`, and the root) must be replaced with `catalog:` protocol references after migration.
- **REQ-002**: All catalog entries must be placed in the single `default` catalog (the `catalog:` top-level key in `pnpm-workspace.yaml`). Named catalogs must not be introduced.
- **REQ-003**: Generator scaffold template files (`tools/conformance/src/generators/nestjs-command-application/templates/package.json` and `tools/conformance/src/generators/nestjs-graphql-application/templates/package.json`) must **not** use `catalog:` references — they must retain explicit semver ranges.
- **REQ-004**: Internal `@monorepo/*` package references must continue to use `workspace:*` protocol and must not be added to the catalog.
- **REQ-005**: `catalogMode: strict` must be set in `pnpm-workspace.yaml` after migration so that `pnpm add` refuses to install packages not already in the catalog.
- **REQ-006**: `cleanupUnusedCatalogs: true` must be set in `pnpm-workspace.yaml` so pnpm prunes stale catalog entries automatically.
- **REQ-007**: `pnpm-lock.yaml` must be regenerated and committed after migration so CI can continue to use `--frozen-lockfile`.
- **CON-001**: `syncpack` is enforced in CI (`analyze-code` workflow). Its `semverGroups` rule enforcing `^` ranges will flag `catalog:` protocol values as violations. The `syncpack` config must be updated to ignore `catalog:` entries before or immediately after the codemod step.
- **CON-002**: Generator template `package.json` files use Mustache syntax (`{{nameKebabCase}}`) and are **not scanned by syncpack** (syncpack's `source` globs cover `applications/*/`, `packages/*/`, `tools/*/` but not generator template subdirectories). They must be excluded from the codemod and retain explicit semver.
- **CON-003**: `pnpm-lock.yaml` is listed in `nx.json` `sharedGlobals` — the migration will invalidate all Nx local/remote task caches on the first run. This is expected and one-time.
- **CON-004**: `validate-code` skill must pass cleanly (both `write` and `check` configurations) before the migration is considered complete, including `yamllint` on the modified `pnpm-workspace.yaml`.
- **GUD-001**: Catalog entry names must match the exact npm package names (no abbreviations or aliases).
- **GUD-002**: The `catalog:` block in `pnpm-workspace.yaml` must be sorted alphabetically by package name for readability and to minimize merge conflicts.
- **PAT-001**: The `analyze-code` CI workflow runs `syncpack lint` — the updated `syncpack` config must allow `catalog:` protocol values to pass without errors.
- **PAT-002**: `pnpm-workspace.yaml` is YAML-linted by `yamllint` (configured in `configuration/yamllint.yaml`). The expanded catalog block must pass yamllint.

## 2. Implementation Steps

### Phase 1 — Pre-Migration Audit

- **GOAL-001**: Confirm dependency versions are already consistent across all workspace `package.json` files so that a single catalog version per package is unambiguous, and identify the exact files excluded from the codemod.

| Task     | Description                                                                                                                                                                                                                                                   | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-001 | Run `pnpm exec syncpack lint --config configuration/syncpack.config.cjs` and confirm zero violations. If any versions are inconsistent across projects, fix them with `pnpm exec syncpack fix` before proceeding.                                            | ✅        | 2026-07-06T19:12:00Z |
| TASK-002 | Confirm the two generator template files exist at their expected paths and document them as codemod-exclusion targets: `tools/conformance/src/generators/nestjs-command-application/templates/package.json` and `tools/conformance/src/generators/nestjs-graphql-application/templates/package.json`. Stage their current content (e.g., via `git stash` or a manual copy) so they can be restored if the codemod touches them. | ✅        | 2026-07-06T19:12:00Z |

### Phase 2 — Automated Migration via Code-mod

- **GOAL-002**: Use the official pnpm catalog codemod to automatically populate the `catalog:` section in `pnpm-workspace.yaml` and rewrite all workspace `package.json` files to use `catalog:` protocol references.

| Task     | Description                                                                                                                                                                                                                                                                                       | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-003 | Run `pnpx codemod pnpm/catalog` from the workspace root (`/Users/jimmypaolini/Development/Personal/monorepo.worktrees/copilot-migrate-to-pnpm-catalogs`). The codemod reads all `package.json` files, collects dependency versions, writes a `catalog:` block to `pnpm-workspace.yaml`, and replaces version strings with `catalog:` in each `package.json`. | ✅        | 2026-07-06T19:16:24Z |
| TASK-004 | Review the diff of `pnpm-workspace.yaml` to confirm all expected external dependencies were promoted to the `catalog:` block and no `workspace:*` entries for `@monorepo/*` packages were incorrectly included.                                                                                    | ✅        | 2026-07-06T19:16:24Z |
| TASK-005 | Check whether the codemod modified either generator template file. If it did, restore them to their pre-codemod state using `git checkout -- tools/conformance/src/generators/nestjs-command-application/templates/package.json tools/conformance/src/generators/nestjs-graphql-application/templates/package.json`. | ✅        | 2026-07-06T19:16:24Z |
| TASK-006 | Verify every external dependency in each of the following `package.json` files has been replaced with `catalog:`: `package.json` (root), `applications/caelundas/package.json`, `applications/lexico-ingestion/package.json`, `applications/lexico/package.json`, `packages/lexico-components/package.json`, `packages/lexico-entities/package.json`, `tools/conformance/package.json`, `tools/synchronization/package.json`. The `applications/affirmations/package.json` has no external JS dependencies and requires no changes. | ✅        | 2026-07-06T19:16:24Z |

### Phase 3 — Catalog & Workspace Config Hardening

- **GOAL-003**: Add governance settings to `pnpm-workspace.yaml` so the catalog is self-maintaining and strictly enforced for future dependency additions.

| Task     | Description                                                                                                                                                                                                                                         | Completed | Date |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-007 | Add `catalogMode: strict` to `pnpm-workspace.yaml` so that `pnpm add` refuses to install packages that are not already in the catalog.                                                                                                              | ✅        | 2026-07-06T19:18:33Z |
| TASK-008 | Add `cleanupUnusedCatalogs: true` to `pnpm-workspace.yaml` so pnpm automatically removes catalog entries that are no longer referenced in any `package.json`.                                                                                       | ✅        | 2026-07-06T19:18:33Z |
| TASK-009 | Add `pnpm-workspace.yaml` to the `sharedGlobals` `inputs` array in `nx.json` (alongside the existing `pnpm-lock.yaml` entry). Since catalog entries now control resolved versions for all projects, changes to `pnpm-workspace.yaml` must invalidate all Nx task caches. | ✅        | 2026-07-06T19:18:33Z |

### Phase 4 — Update Syncpack Configuration

- **GOAL-004**: Update `configuration/syncpack.config.cjs` so that `syncpack lint` passes cleanly after migration — `catalog:` protocol values must not be flagged as semver range violations.

| Task     | Description                                                                                                                                                                                                                                                                                                                                                                                                                  | Completed | Date |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-010 | In `configuration/syncpack.config.cjs`, add a new entry at the **top** of the `semverGroups` array (before the existing `{ range: "^", ... }` rule) that sets `isIgnored: true` for all non-`@monorepo/*` dependencies across all packages. This exempts `catalog:` protocol values from range enforcement since the catalog itself is now the version governance mechanism. The existing `workspace:*` versionGroup rule remains unchanged. The `pnpmOverrides` ignore rule remains unchanged. | ✅        | 2026-07-06T19:28:11Z |
| TASK-011 | Run `pnpm exec syncpack lint --config configuration/syncpack.config.cjs` and confirm zero violations after the config change.                                                                                                                                                                                                                                                                                                 | ✅        | 2026-07-06T19:28:11Z |

### Phase 5 — Lockfile Regeneration

- **GOAL-005**: Regenerate `pnpm-lock.yaml` with the catalog-resolved entries so the lockfile is valid and CI can run with `--frozen-lockfile`.

| Task     | Description                                                                                                                                                                                             | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-012 | Run `pnpm install --fix-lockfile` from the workspace root to regenerate `pnpm-lock.yaml` with catalog-resolved dependency entries. Confirm the command exits with code 0.                              | ✅        | 2026-07-06T19:28:56Z |
| TASK-013 | Confirm `node_modules` are intact and all projects' binaries are accessible (e.g., `pnpm exec nx --version` exits 0, `pnpm exec tsc --version` exits 0).                                              | ✅        | 2026-07-06T19:28:56Z |

### Phase 6 — Validation

- **GOAL-006**: Confirm no code quality regressions, all projects build, and the migration is complete and clean.

| Task     | Description                                                                                                                                                                                                                                   | Completed | Date |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-014 | Run `pnpm exec nx affected --target=analyze-code --configuration=write --base=main` to auto-fix any formatting or linting issues introduced by the migration (e.g., in `pnpm-workspace.yaml` or `syncpack.config.cjs`).                       | ✅        | 2026-07-07T02:45:17Z |
| TASK-015 | Run `pnpm exec nx affected --target=analyze-code --configuration=check --base=main` and confirm zero violations. This runs `yamllint` on `pnpm-workspace.yaml`, ESLint on `syncpack.config.cjs`, and all other analysis checks.               |           |      |
| TASK-016 | Run `pnpm exec nx run-many --target=build --all` and confirm all projects build successfully with the catalog-resolved dependency versions.                                                                                                    | ✅        | 2026-07-06T20:12:29Z |
| TASK-017 | Run `pnpm exec nx run-many --target=typecheck --all` and confirm zero TypeScript errors across all projects.                                                                                                                                   | ✅        | 2026-07-07T02:45:17Z |

## 3. Alternatives

- **ALT-001**: **Named catalogs by group** — organize entries into named catalogs (`catalog:nestjs`, `catalog:react`, `catalog:testing`). Rejected in favour of a single default catalog for simplicity; `catalog:` references are shorter and the reduced coupling between catalog name and package grouping avoids churn when packages move between logical groups.
- **ALT-002**: **Partial migration (shared deps only)** — only promote dependencies that appear in 2+ projects. Rejected; migrating all external deps provides the strongest version governance guarantee and eliminates the need to reason about which deps are "shared enough" for the catalog.
- **ALT-003**: **Remove syncpack entirely** — rely solely on `catalogMode: strict` and `cleanupUnusedCatalogs` for governance. Rejected because syncpack still provides value for enforcing `workspace:*` on internal `@monorepo/*` packages and for auditing cross-package dependency consistency during future upgrades.
- **ALT-004**: **Manual migration (no codemod)** — hand-edit every `package.json` and `pnpm-workspace.yaml`. Rejected; the `pnpx codemod pnpm/catalog` automated migration is lower-risk and faster across 8 project `package.json` files plus the root.

## 4. Dependencies

- **DEP-001**: `pnpm@11.2.2` — already set as `packageManager` in root `package.json`. Catalogs and `catalogMode` are fully supported at this version.
- **DEP-002**: `pnpx codemod pnpm/catalog` — the community codemod from [Codemod.com](https://go.codemod.com/pnpm-catalog) used to automate the migration. Requires network access at migration time; no persistent install needed.
- **DEP-003**: `syncpack@^15.3.1` — already in root `devDependencies`. Config must be updated (TASK-010) before `syncpack lint` will pass post-migration.
- **DEP-004**: `yamllint` — already configured in `configuration/yamllint.yaml` and run by the `analyze-code` workflow. The expanded `pnpm-workspace.yaml` must satisfy its rules.

## 5. Files

- **FILE-001**: `pnpm-workspace.yaml` — add `catalog:` block with all external dependency entries, `catalogMode: strict`, and `cleanupUnusedCatalogs: true`
- **FILE-002**: `package.json` (root) — replace all external devDependency version strings with `catalog:`
- **FILE-003**: `applications/caelundas/package.json` — replace all external dependency version strings with `catalog:`
- **FILE-004**: `applications/lexico-ingestion/package.json` — replace all external dependency version strings with `catalog:`
- **FILE-005**: `applications/lexico/package.json` — replace all external dependency version strings with `catalog:`
- **FILE-006**: `packages/lexico-components/package.json` — replace all external dependency version strings with `catalog:`
- **FILE-007**: `packages/lexico-entities/package.json` — replace all external dependency version strings with `catalog:`
- **FILE-008**: `tools/conformance/package.json` — replace all external dependency version strings with `catalog:`
- **FILE-009**: `tools/synchronization/package.json` — replace all external dependency version strings with `catalog:`
- **FILE-010**: `configuration/syncpack.config.cjs` — add `isIgnored: true` semver group rule for external dependencies to exempt `catalog:` protocol values from range enforcement
- **FILE-011**: `nx.json` — add `pnpm-workspace.yaml` to the `sharedGlobals` inputs array
- **FILE-012**: `pnpm-lock.yaml` — regenerated by `pnpm install --fix-lockfile`; must be committed
- **FILE-013**: `tools/conformance/src/generators/nestjs-command-application/templates/package.json` — **excluded from migration**; must retain explicit semver ranges
- **FILE-014**: `tools/conformance/src/generators/nestjs-graphql-application/templates/package.json` — **excluded from migration**; must retain explicit semver ranges
- **FILE-015**: `applications/affirmations/package.json` — **no changes required** (Python-only project, no external JS dependencies)

## 6. Testing & Validation

- **TEST-001**: `pnpm exec syncpack lint --config configuration/syncpack.config.cjs` passes with zero violations after the syncpack config update (TASK-011)
- **TEST-002**: `pnpm exec nx affected --target=analyze-code --configuration=check --base=main` passes cleanly, including `yamllint` on `pnpm-workspace.yaml` (TASK-015)
- **TEST-003**: `pnpm exec nx run-many --target=build --all` exits 0 for all projects (TASK-016)
- **TEST-004**: `pnpm exec nx run-many --target=typecheck --all` exits 0 for all projects (TASK-017)
- **VAL-001**: Every external dependency in each of the 8 project `package.json` files and the root `package.json` resolves to `"catalog:"` — verified by running `grep -r '"catalog:' applications packages tools package.json` and confirming no remaining bare semver strings for external packages
- **VAL-002**: Neither generator template file contains `catalog:` references — verified by `grep 'catalog:' tools/conformance/src/generators/*/templates/package.json` returning no matches
- **VAL-003**: `pnpm-workspace.yaml` contains a `catalogMode: strict` field and a `cleanupUnusedCatalogs: true` field
- **VAL-004**: `nx.json` `sharedGlobals` inputs array includes both `{fileset: "pnpm-lock.yaml"}` and `{fileset: "pnpm-workspace.yaml"}`
- **VAL-005**: `pnpm install --fix-lockfile` exits 0 and `pnpm-lock.yaml` contains `catalogs:` entries

## 7. Risks & Assumptions

- **RISK-001**: The `pnpx codemod pnpm/catalog` tool may modify the generator template `package.json` files if its file glob is broader than expected. Mitigated by TASK-002 (pre-stage template content) and TASK-005 (restore if modified).
- **RISK-002**: The codemod may not handle version conflicts gracefully if the same package somehow appears at different versions across projects (unlikely given syncpack enforcement). Mitigated by TASK-001 (run syncpack lint first to confirm consistency).
- **RISK-003**: All Nx local and remote task caches will be invalidated on the first CI run post-migration because `pnpm-lock.yaml` (a `sharedGlobals` input) changes. This is a one-time cost with no mitigation needed; builds will be slower on the first post-merge CI run.
- **RISK-004**: `syncpack` v15 may not natively recognize `catalog:` as a valid version specifier type, causing it to error rather than lint incorrectly. If `isIgnored: true` in `semverGroups` is insufficient, the fallback is to wrap the `source` glob to exclude project `package.json` files from semver-range linting while retaining the `versionGroups` workspace:* check.
- **RISK-005**: Future use of `nx release` for version bumping may overwrite `catalog:` references in `package.json` with resolved semver strings. This risk is post-migration and requires manual verification when `nx release` is next used.
- **ASSUMPTION-001**: All external dependency versions are already consistent across workspace `package.json` files (maintained by syncpack CI enforcement), so a single catalog entry per package is unambiguous.
- **ASSUMPTION-002**: The CI pipeline runs `pnpm install --frozen-lockfile`; a new `pnpm-lock.yaml` must be committed as part of this migration before merging.
- **ASSUMPTION-003**: `pnpm-workspace.yaml` YAML linting passes without changes to `configuration/yamllint.yaml` (the expanded catalog block uses standard YAML block mappings compatible with the existing ruleset).

## 8. Related Specifications / Further Reading

- [PNPM Catalogs Official Documentation](https://pnpm.io/catalogs)
- [pnpm-workspace.yaml Reference](https://pnpm.io/pnpm-workspace_yaml)
- [PNPM Settings (catalogMode, cleanupUnusedCatalogs)](https://pnpm.io/settings)
- [PNPM Install CLI (--fix-lockfile, --lockfile-only)](https://pnpm.io/cli/install)
- [Codemod.com pnpm/catalog Migration Tool](https://go.codemod.com/pnpm-catalog)
- [Nx nx.json Reference (sharedGlobals)](https://nx.dev/docs/reference/nx-json)
- [Syncpack Documentation](https://jamiemason.github.io/syncpack/)
- `configuration/syncpack.config.cjs` — existing syncpack configuration
- `documentation/planning/2026-06-19T13:44:06Z-infrastructure-nx-version-23-upgrade.plan.md` — adjacent dependency management work
