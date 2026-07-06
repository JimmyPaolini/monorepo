---
name: Nx Local Caching Optimization Across Monorepo
description: Optimize Nx local task caching and affected targeting for root, all projects, and generator templates without using Nx Cloud.
created: 2026-07-06T19:50:45Z
updated: 2026-07-06T19:50:45Z
status: 'Planned'
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

This plan defines a repository-wide Nx local caching optimization to reduce redundant task execution and improve `nx affected` precision for both developer workflows and CI. The implementation explicitly excludes Nx Cloud and uses only local cache behavior, including optional `.nx/cache` persistence in GitHub Actions.

## 1. Requirements & Constraints

- **REQ-001**: Optimize task caching behavior at root level in `nx.json` using deterministic, minimal invalidation inputs for all cacheable targets.
- **REQ-002**: Apply caching optimization to all existing Nx projects: `monorepo`, `affirmations`, `caelundas`, `lexico`, `lexico-ingestion`, `lexico-components`, `lexico-entities`, `conformance`, and `synchronization`.
- **REQ-003**: Update conformance generator templates so newly generated projects inherit the same caching strategy.
- **REQ-004**: Improve `nx affected` targeting accuracy by refining `namedInputs`, target `inputs`, target `outputs`, and `dependsOn` graph behavior.
- **REQ-005**: Re-evaluate all currently uncached targets and cache aggressively when commands are deterministic and safe to replay.
- **REQ-006**: Preserve CI support for restoring and saving `.nx/cache` through GitHub Actions cache.
- **SEC-001**: Keep non-deterministic or security-sensitive targets uncached when replay could hide important runtime behavior or stale risk signals.
- **CON-001**: Do not use Nx Cloud configuration, authentication, distributed execution, or remote cache service.
- **CON-002**: Keep compatibility with current workspace Nx version and plugin inference behavior; avoid config shapes requiring beta-only behavior.
- **CON-003**: Root/project conventions in `AGENTS.md` and existing quality gates must remain unchanged.
- **GUD-001**: Prefer global `targetDefaults` and `namedInputs` for consistency; only add per-project overrides when root defaults are insufficient.
- **GUD-002**: Use spread (`"..."`) merge semantics where needed to avoid unintentionally replacing inferred plugin configuration.
- **PAT-001**: Keep side-effect tasks (for example, environment setup, downloads, orchestration, infrastructure operations) explicitly documented with cache rationale.
- **PAT-002**: Validate configuration by measuring cache hits/misses and affected project count before and after changes on representative targets.

## 2. Implementation Steps

### Implementation Phase 1

- GOAL-001: Baseline current cache behavior and classify all targets by cache safety/determinism.

| Task     | Description                                                                                                                                                                                      | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ---- |
| TASK-001 | Create an inventory table of all workspace targets from `nx.json` + all `project.json` files, including current `cache`, `inputs`, `outputs`, `dependsOn`, executor, and command side effects. |           |      |
| TASK-002 | Run baseline measurements for representative commands (`nx run-many`, `nx affected`) and record task counts, cache hit rate, and execution time.                                                |           |      |
| TASK-003 | Classify every currently uncached target into `cache-safe`, `conditionally-cache-safe`, or `must-remain-uncached` with explicit rationale and risk notes.                                      |           |      |
| TASK-004 | Capture current CI cache behavior in `.github/actions/setup-monorepo/action.yml` and verify no Nx Cloud references exist in workflow configuration.                                            |           |      |

### Implementation Phase 2

- GOAL-002: Implement root-level cache/input/output pipeline improvements in `nx.json`.

| Task     | Description                                                                                                                                                                                                           | Completed | Date |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-005 | Refine `namedInputs` in `nx.json` to minimize global invalidation scope while preserving correctness (including production-focused patterns and explicit include/exclude boundaries).                                |           |      |
| TASK-006 | Update `targetDefaults` caching strategy for common targets (`build`, `test`, `lint`, `typecheck`, `analyze-code`, etc.) with precise `inputs`, `outputs`, and `dependsOn` definitions.                          |           |      |
| TASK-007 | Convert reclassified cache-safe root-level targets in `/project.json` from `cache: false` to deterministic cache configs, including explicit `inputs` and `outputs` where missing.                                |           |      |
| TASK-008 | Preserve `cache: false` only for targets confirmed as non-deterministic or side-effectful; add clear inline rationale near each retained uncached target in root/project configs.                                  |           |      |

### Implementation Phase 3

- GOAL-003: Apply and align project-level overrides for all applications, packages, and tools.

| Task     | Description                                                                                                                                                                                         | Completed | Date |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-009 | Review and update project targets in `applications/*/project.json` to align with root defaults while keeping required project-specific inputs/outputs.                                            |           |      |
| TASK-010 | Review and update project targets in `packages/*/project.json` with deterministic cache behavior and dependency-aware pipelines (`dependsOn` with dependency builds/tests where applicable).        |           |      |
| TASK-011 | Review and update project targets in `tools/*/project.json` to cache deterministic tasks and keep side-effect tooling tasks uncached with explicit rationale.                                      |           |      |
| TASK-012 | Verify `implicitDependencies` and affected graph behavior for cross-project paths (for example `lexico -> lexico-components`) to ensure only necessary downstream tasks are scheduled.             |           |      |

### Implementation Phase 4

- GOAL-004: Propagate strategy to generators and validate performance/correctness end-to-end.

| Task     | Description                                                                                                                                                                                             | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-013 | Update conformance generator templates under `tools/conformance/src/generators/*/templates/project.json` so generated projects inherit revised cache/input/output patterns.                           |           |      |
| TASK-014 | Update conformance tests (for example `tools/conformance/src/conformance.test.ts`) to assert required caching fields and target behavior in generated project files.                                  |           |      |
| TASK-015 | Run workspace validation targets and representative cache tests twice (cold + warm) to confirm deterministic replay and measurable runtime improvements without correctness regressions.               |           |      |
| TASK-016 | Validate CI workflow with `.nx/cache` restore/save and `nx affected` behavior on a branch diff to ensure no Nx Cloud usage and no over-triggering of unrelated projects/tasks.                       |           |      |

## 3. Alternatives

- **ALT-001**: Adopt Nx Cloud remote caching/distributed execution. Rejected because scope explicitly forbids Nx Cloud usage.
- **ALT-002**: Optimize only `nx.json` and avoid per-project/template updates. Rejected because inconsistent project overrides and generator drift would quickly reintroduce cache misses.
- **ALT-003**: Keep all currently uncached targets as-is. Rejected due to explicit requirement to re-evaluate and cache aggressively where deterministic.
- **ALT-004**: Move all caching config into project files only. Rejected because it duplicates configuration and increases maintenance cost versus root `targetDefaults`.

## 4. Dependencies

- **DEP-001**: Nx workspace configuration files: `nx.json` and root `/project.json`.
- **DEP-002**: Per-project configs in `applications/**/project.json`, `packages/**/project.json`, and `tools/**/project.json`.
- **DEP-003**: Generator templates in `tools/conformance/src/generators/**/templates/project.json`.
- **DEP-004**: Template validation tests in `tools/conformance/src/conformance.test.ts`.
- **DEP-005**: CI cache action configuration in `.github/actions/setup-monorepo/action.yml`.
- **DEP-006**: Existing analyze-code and test targets used for validation (`nx affected --target=analyze-code`, project-level `analyze-code` and `test` targets).

## 5. Files

- **FILE-001**: `nx.json` - Root `namedInputs`, `targetDefaults`, cache directory, and global task behavior.
- **FILE-002**: `project.json` - Root monorepo targets and cache enablement/disablement decisions.
- **FILE-003**: `applications/**/project.json` - Application-specific target overrides and dependency wiring.
- **FILE-004**: `packages/**/project.json` - Shared package target definitions and cache/input/output settings.
- **FILE-005**: `tools/**/project.json` - Tool project targets and determinism-aware cache policy.
- **FILE-006**: `tools/conformance/src/generators/**/templates/project.json` - Generator template defaults for future projects.
- **FILE-007**: `tools/conformance/src/conformance.test.ts` - Assertions enforcing generated config consistency.
- **FILE-008**: `.github/actions/setup-monorepo/action.yml` - CI `.nx/cache` restore/save behavior without Nx Cloud.

## 6. Testing & Validation

- **TEST-001**: Run warm-cache verification for representative targets (`build`, `test`, `lint`, `typecheck`, `analyze-code`) and confirm second run reuses cache outputs.
- **TEST-002**: Execute `nx affected` on representative diffs (single-project, shared-package, root-config changes) and verify affected scope is minimal and correct.
- **TEST-003**: Validate formerly uncached targets converted to cached mode produce identical outputs across repeated runs.
- **TEST-004**: Validate retained uncached targets execute each run and do not incorrectly reuse stale outputs.
- **VAL-001**: Run `pnpm exec nx affected --target=analyze-code --configuration=write --base=main`.
- **VAL-002**: Run `pnpm exec nx affected --target=analyze-code --configuration=check --base=main`.
- **VAL-003**: Run focused project tests/builds for impacted projects after config changes.
- **VAL-004**: Confirm no Nx Cloud usage by verifying absence of Nx Cloud configuration and by running tasks with local cache-only behavior.

## 7. Risks & Assumptions

- **RISK-001**: Overly broad `inputs` may reduce cache hit rate and preserve unnecessary task invalidation.
- **RISK-002**: Overly narrow `inputs` may cause stale cache replay and false confidence in correctness.
- **RISK-003**: Aggressive caching of side-effect tasks may mask runtime failures or external dependency drift.
- **RISK-004**: Template updates without matching test updates may allow future drift in generated project configs.
- **RISK-005**: CI/local parity can regress if `.nx/cache` assumptions differ between developers and runners.
- **ASSUMPTION-001**: Workspace remains on an Nx version supporting current `targetDefaults` and spread merge behavior.
- **ASSUMPTION-002**: `.nx/cache` persistence in GitHub Actions remains acceptable as a local-cache acceleration mechanism.
- **ASSUMPTION-003**: Existing project targets are deterministic unless explicitly identified as side-effectful during Phase 1 classification.

## 8. Related Specifications / Further Reading

- Nx cache task results: https://nx.dev/docs/features/cache-task-results
- Nx inputs reference: https://nx.dev/docs/reference/inputs
- Nx outputs configuration: https://nx.dev/docs/guides/tasks--caching/configure-outputs
- Nx task pipeline / dependsOn: https://nx.dev/docs/guides/tasks--caching/defining-task-pipeline
- Nx affected command: https://nx.dev/docs/features/ci-features/affected
- Workspace reference plan: `documentation/planning/2026-06-19T13:44:06Z-infrastructure-nx-version-23-upgrade.plan.md`
- Workspace conventions: `AGENTS.md`
