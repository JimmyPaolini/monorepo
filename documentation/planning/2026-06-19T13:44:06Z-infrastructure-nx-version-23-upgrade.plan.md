name: Nx 23 Workspace Upgrade Plan
description: Upgrade the monorepo from Nx 22.7.3 to Nx 23 with official migrations, aligned plugins, and CI-stable validation.
created: 2026-06-19T13:44:06Z
updated: 2026-06-19T13:44:06Z
status: 'Planned'

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

This plan upgrades the workspace to Nx 23 in a single workspace-wide pull request using the official `nx migrate` workflow. The implementation prioritizes CI stability, preserves existing automation, and validates all established root and project-level Nx targets.

## 1. Requirements & Constraints

- **REQ-001**: Upgrade `nx` and all `@nx/*` packages from `22.7.3` to Nx 23-compatible versions using `pnpm nx migrate`, not manual version edits.
- **REQ-002**: Keep `nx` and all `@nx/*` package versions synchronized across root `package.json`.
- **REQ-003**: Apply and commit generated migrations (`migrations.json` and transformed configs/code) required by Nx 23.
- **REQ-004**: Preserve existing CI workflows and root orchestration targets used by `.github/workflows/*.yml` and `project.json`.
- **REQ-005**: Keep automated dependency-upgrade workflow enabled during migration.
- **SEC-001**: Preserve existing security scanning pathways (`monorepo:scan-dependencies`, audit-security workflows) with no reduction in coverage.
- **CON-001**: Scope is workspace-wide in one pull request.
- **CON-002**: Execution must follow Nx-first tooling conventions (`pnpm nx ...`) and avoid direct tool bypass where Nx targets exist.
- **CON-003**: Current runtime baseline (`node >=24.16.0`, `pnpm 11.2.2`) must remain compatible post-upgrade.
- **GUD-001**: Use official two-phase migration flow (`nx migrate` then `nx migrate --run-migrations`), starting with required updates.
- **GUD-002**: Prioritize safe, deterministic changes over speed; no speculative refactors outside migration needs.
- **PAT-001**: Reuse root target composition in `nx.json` and `project.json` rather than introducing parallel ad-hoc scripts.
- **PAT-002**: Validate via existing monorepo quality targets (`analyze-code`, tests, and affected/run-many build flows) after migration.

## 2. Implementation Steps

### Implementation Phase 1

- GOAL-001: Prepare the workspace for deterministic Nx 23 migration and capture generated version/migration artifacts.

| Task     | Description | Completed | Date |
| -------- | ----------- | --------- | ---- |
| TASK-001 | Create a migration branch state snapshot by recording current `nx --version`, lockfile hash, and baseline output for `pnpm nx run monorepo:analyze-code --configuration=check`. |  |  |
| TASK-002 | Run `pnpm nx migrate nx@23 --interactive=false --include=required` to update `package.json` and generate migration plan artifacts. |  |  |
| TASK-003 | Review generated migration metadata (for example `migrations.json`) and lockfile/package diff for unexpected plugin/version drift outside `nx` and `@nx/*` groups. |  |  |
| TASK-004 | Install updated dependencies with `pnpm install` and ensure workspace resolves platform-specific Nx native package correctly. |  |  |

### Implementation Phase 2

- GOAL-002: Apply Nx 23 code/config migrations and adapt workspace/project configuration safely.

| Task     | Description | Completed | Date |
| -------- | ----------- | --------- | ---- |
| TASK-005 | Execute `pnpm nx migrate --run-migrations` and capture transformed files. |  |  |
| TASK-006 | Reconcile migration edits in `nx.json`, root `project.json`, and affected project `project.json` files (`applications/*`, `packages/*`, `tools/*`) while preserving existing target semantics. |  |  |
| TASK-007 | Update any migration-sensitive plugin usages identified by Nx 23 migrations (for example renamed plugin entrypoints or target executor updates) in workspace configs and source references. |  |  |
| TASK-008 | Remove transient migration scaffolding files only if no longer required after successful run (for example consumed migration manifest files). |  |  |

### Implementation Phase 3

- GOAL-003: Stabilize CI behavior and verify workspace-wide task compatibility on Nx 23.

| Task     | Description | Completed | Date |
| -------- | ----------- | --------- | ---- |
| TASK-009 | Run workspace validation targets used by CI: `pnpm nx run monorepo:analyze-code --configuration=write`, then `--configuration=check`. |  |  |
| TASK-010 | Run project/task smoke validations representative of CI paths: `pnpm nx run-many --target=build --all` and `pnpm nx affected --target=test --base=main`. |  |  |
| TASK-011 | Verify unchanged behavior of dependency automation workflow definitions in `.github/workflows/upgrade-dependencies.yml` while keeping the workflow enabled. |  |  |
| TASK-012 | Document migration outcomes and follow-up items in the PR description, including any optional Nx migrations intentionally deferred. |  |  |

## 3. Alternatives

- **ALT-001**: Manual package version bump for `nx`/`@nx/*` without `nx migrate`; rejected because it bypasses official migration transforms and increases configuration drift risk.
- **ALT-002**: Multi-PR phased rollout by project groups; rejected because requested scope is a single workspace-wide PR.
- **ALT-003**: Pausing dependency automation during migration; rejected because requested constraint is to keep automation running.

## 4. Dependencies

- **DEP-001**: Nx core and plugin packages in root `package.json` (`nx`, `@nx/devkit`, `@nx/eslint`, `@nx/js`, `@nx/nest`, `@nx/node`, `@nx/plugin`, `@nx/react`, `@nx/vite`, `@nx/workspace`).
- **DEP-002**: Workspace package manager lock state (`pnpm-lock.yaml`) after migration/install.
- **DEP-003**: CI workflows invoking Nx (`.github/workflows/build-projects.yml`, `.github/workflows/validate-conventions.yml`, `.github/workflows/upgrade-dependencies.yml`).
- **DEP-004**: Root and project task configuration (`nx.json`, `project.json`, `**/project.json`).

## 5. Files

- **FILE-001**: `package.json` — update Nx package versions and keep package group alignment.
- **FILE-002**: `pnpm-lock.yaml` — lockfile updates from migration/install.
- **FILE-003**: `migrations.json` (or Nx-generated migration manifest) — migration instructions executed by Nx.
- **FILE-004**: `nx.json` — workspace plugins, target defaults, named inputs, and caching semantics after migration transforms.
- **FILE-005**: `project.json` (root) — monorepo orchestration targets and migration-adjusted executor configuration.
- **FILE-006**: `applications/*/project.json` — app-level target compatibility updates if generated.
- **FILE-007**: `packages/*/project.json` — library/package target compatibility updates if generated.
- **FILE-008**: `tools/*/project.json` — tooling/generator project target compatibility updates if generated.
- **FILE-009**: `.github/workflows/*.yml` — only if required for Nx 23 command or output compatibility.

## 6. Testing

- **TEST-001**: Run `pnpm nx run monorepo:analyze-code --configuration=write` and confirm autofixable issues are resolved.
- **TEST-002**: Run `pnpm nx run monorepo:analyze-code --configuration=check` and confirm strict checks pass.
- **TEST-003**: Run `pnpm nx run-many --target=build --all` to verify CI-equivalent build orchestration.
- **TEST-004**: Run `pnpm nx affected --target=test --base=main` to validate changed projects and dependency graph integrity.
- **TEST-005**: Run `pnpm nx graph --file=stdout` (or equivalent non-interactive graph generation) to confirm project graph generation remains healthy.

## 7. Risks & Assumptions

- **RISK-001**: Nx 23 migration may alter plugin/executor wiring in ways that impact custom root target composition (`nx:run-commands` chains).
- **RISK-002**: Native optional dependency resolution issues could break local/CI Nx execution on specific architectures if lockfile state is inconsistent.
- **RISK-003**: Keeping dependency automation active may introduce concurrent lockfile churn during migration window.
- **RISK-004**: Hidden coupling in custom tooling (`tools/conformance`) may require additional compatibility adjustments after migration.
- **ASSUMPTION-001**: Workspace Node and pnpm versions remain within Nx 23 supported compatibility matrix.
- **ASSUMPTION-002**: Upgrade is executed from a clean branch state without unrelated lockfile mutations.
- **ASSUMPTION-003**: No mandatory cross-major intermediate migration step is required because the workspace starts at Nx 22.7.3.

## 8. Related Specifications / Further Reading

- https://nx.dev/docs/features/automate-updating-dependencies
- https://nx.dev/docs/guides/tips-n-tricks/advanced-update
- https://nx.dev/docs/guides/tips-n-tricks/keep-nx-versions-in-sync
- https://nx.dev/docs/technologies/node/introduction
- https://nx.dev/docs/troubleshooting/troubleshoot-nx-install-issues
- https://github.com/nrwl/nx/releases/tag/23.0.0
- `/Users/jimmypaolini/Development/Personal/monorepo.worktrees/copilot-upgrade-nx-version-23/AGENTS.md`
- `/Users/jimmypaolini/Development/Personal/monorepo.worktrees/copilot-upgrade-nx-version-23/nx.json`
- `/Users/jimmypaolini/Development/Personal/monorepo.worktrees/copilot-upgrade-nx-version-23/project.json`
