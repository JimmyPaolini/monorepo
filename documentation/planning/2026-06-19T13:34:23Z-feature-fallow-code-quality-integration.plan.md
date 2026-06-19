---
name: Fallow Code Quality Integration Plan
description: Integrate fallow static analysis into monorepo quality workflows with advisory-first CI and permanent knip parallelism.
created: 2026-06-19T13:34:23Z
updated: 2026-06-19T14:57:36Z
status: "Completed"
---

# Introduction

![Status: Completed](https://img.shields.io/badge/status-Completed-brightgreen)

This plan introduces `fallow` as an additional static analysis tool across local development, Nx workflows, CI, and automated cleanup workflows. The rollout is advisory-first for CI, uses static-only features (no runtime license/coverage setup), and keeps `knip` in permanent parallel operation.

## 1. Requirements & Constraints

- **REQ-001**: Add `fallow` as a root workspace tool with deterministic execution through Nx targets instead of ad-hoc shell usage.
- **REQ-002**: Configure a repository-level fallow config file with explicit schema, entry, ignore, rule severity, and monorepo workspace behavior.
- **REQ-003**: Integrate `fallow` into existing monorepo quality workflows: local runs, CI reporting, and automation jobs.
- **REQ-004**: Include static analyses (`dead-code`, `dupes`, `health`, `audit`, optional `fix --dry-run`) and JSON/SARIF outputs where useful.
- **REQ-005**: Preserve existing `knip` checks permanently; no removal or replacement tasks are allowed in this plan.
- **SEC-001**: Avoid unsafe auto-delete behavior in automated contexts by defaulting CI and bots to non-destructive modes (`--dry-run`, advisory outputs).
- **SEC-002**: Ensure no secrets or paid runtime-license keys are introduced; runtime coverage/license flows are out of scope.
- **CON-001**: CI rollout is advisory-first; fallow findings are published but do not fail pull requests until a future explicit policy change.
- **CON-002**: Existing Nx `analyze-code`, `clean`, lint-staged, and workflow conventions must remain valid and backward compatible.
- **CON-003**: All new commands and targets must follow existing root `project.json` and `nx.json` target/default patterns.
- **GUD-001**: Reuse existing monorepo patterns for config comments, quality target composition, and workflow naming.
- **GUD-002**: Prefer machine-readable output (`--format json`/`--format sarif`) for CI and future agent automation.
- **PAT-001**: Root-level quality tooling is defined in `project.json` under `monorepo` and orchestrated by workflow-level `nx affected --target=...`.
- **PAT-002**: Pre-commit integration is centralized in `configuration/lint-staged.config.ts`.
- **PAT-003**: Cleanup automation is currently routed via `.github/workflows/remove-deprecations.yml` and must be updated without disrupting signed PR automation.

## 2. Implementation Steps

### Implementation Phase 1

- GOAL-001: Add and baseline fallow toolchain plus repository configuration for static analysis only.

| Task     | Description | Completed | Date |
| -------- | ----------- | --------- | ---- |
| TASK-001 | Add `fallow` as a root `devDependency` in `/package.json` and update `/pnpm-lock.yaml`. | ✅ | 2026-06-19T13:47:19Z |
| TASK-002 | Create fallow config (`/configuration/fallow.config.jsonc`) with schema reference, monorepo-aware `entry`/`ignorePatterns`, and rules for unused files/exports/types, duplication, and health scoring. | ✅ | 2026-06-19T13:47:19Z |
| TASK-003 | Add initial suppression policy (`ignoreDependencies`, `ignoreExports`, `ignoreExportsUsedInFile`) mapped from existing workspace conventions and known generated-file patterns. | ✅ | 2026-06-19T13:47:19Z |
| TASK-004 | Document fallow config intent and operational expectations in inline comments and relevant developer docs sections that discuss code-quality tooling. | ✅ | 2026-06-19T13:47:19Z |

### Implementation Phase 2

- GOAL-002: Integrate fallow into Nx root targets while preserving existing knip and analyze-code behavior.

| Task     | Description | Completed | Date |
| -------- | ----------- | --------- | ---- |
| TASK-005 | Add root Nx targets in `/project.json` for `fallow`, `fallow-dead-code`, `fallow-dupes`, `fallow-health`, and `fallow-audit` using `nx:run-commands` with check-style defaults. | ✅ | 2026-06-19T14:08:47Z |
| TASK-006 | Add optional write-style target(s) for controlled cleanup preview/application (`fallow-fix:check` using `--dry-run`; optional explicit `fallow-fix:write` guarded for manual-only execution). | ✅ | 2026-06-19T14:08:47Z |
| TASK-007 | Integrate advisory fallow target(s) into root quality composition without removing `clean`/`knip` (for example, extend `analyze-code` or add a sibling composite target like `analyze-code-extended`). | ✅ | 2026-06-19T14:08:47Z |
| TASK-008 | Ensure cache/input definitions in `/nx.json` and/or root target declarations include fallow config and relevant source glob inputs for reproducible task hashing. | ✅ | 2026-06-19T14:08:47Z |

### Implementation Phase 3

- GOAL-003: Wire fallow into developer and CI workflows with advisory-first policy.

| Task     | Description | Completed | Date |
| -------- | ----------- | --------- | ---- |
| TASK-009 | Update `/configuration/lint-staged.config.ts` to include non-blocking/advisory fallow checks for staged TS/JS changes where practical (JSON output for tooling parity). | ✅ | 2026-06-19T14:51:49Z |
| TASK-010 | Update `/.github/workflows/analyze-code.yml` to execute fallow analysis in advisory mode and upload machine-readable artifacts (JSON/SARIF) when available. | ✅ | 2026-06-19T14:51:49Z |
| TASK-011 | Add or update CI reporting behavior so fallow findings are visible in workflow logs/artifacts without failing the job during initial adoption. | ✅ | 2026-06-19T14:51:49Z |
| TASK-012 | Add CI command scoping strategy for PRs (`fallow audit` on changed code) while keeping full-repo scans available for scheduled/manual workflows. | ✅ | 2026-06-19T14:51:49Z |

### Implementation Phase 4

- GOAL-004: Update automated deprecation cleanup workflow to leverage fallow while retaining existing automation guarantees.

| Task     | Description | Completed | Date |
| -------- | ----------- | --------- | ---- |
| TASK-013 | Update `/.github/workflows/remove-deprecations.yml` to include fallow cleanup analysis (`fallow fix --dry-run` and/or controlled apply mode) alongside existing clean/knip workflow intent. | ✅ | 2026-06-19T14:57:36Z |
| TASK-014 | Update workflow PR body text to reflect mixed knip + fallow cleanup sources (avoid stale “detected by knip only” wording). | ✅ | 2026-06-19T14:57:36Z |
| TASK-015 | Ensure signed automated PR flow and branch conventions remain unchanged after adding fallow commands. | ✅ | 2026-06-19T14:57:36Z |
| TASK-016 | Add rollback toggles or guarded flags so automated cleanup can quickly disable fallow apply behavior if false positives are discovered. | ✅ | 2026-06-19T14:57:36Z |

## 3. Alternatives

- **ALT-001**: Replace knip immediately with fallow. Rejected because requested policy is permanent parallel operation.
- **ALT-002**: Add fallow only as an ad-hoc developer command with no Nx/CI integration. Rejected because it would drift from monorepo quality conventions and reduce consistency.
- **ALT-003**: Enforce fail-fast CI from day one using `fallow audit --gate all`. Rejected because requested rollout is advisory-first until baseline confidence is established.
- **ALT-004**: Include runtime-intelligence/license coverage setup now. Rejected because scope is static-only.

## 4. Dependencies

- **DEP-001**: npm package `fallow` (CLI binaries: `fallow`, `fallow-mcp`, `fallow-lsp`).
- **DEP-002**: Existing Nx root orchestration in `/project.json` and `/nx.json`.
- **DEP-003**: Existing CI workflows in `/.github/workflows/analyze-code.yml` and `/.github/workflows/remove-deprecations.yml`.
- **DEP-004**: Existing quality toolchain (`knip`, `eslint`, `oxlint`, `typecheck`, `spell-check`) that must remain active.

## 5. Files

- **FILE-001**: `/package.json` — add `fallow` dependency and scripts if needed.
- **FILE-002**: `/pnpm-lock.yaml` — lockfile update for new dependency.
- **FILE-003**: `/configuration/fallow.config.jsonc` (or `fallow.toml`) — primary fallow configuration.
- **FILE-004**: `/project.json` — root Nx targets for fallow commands and composites.
- **FILE-005**: `/nx.json` — target defaults/inputs adjustments for fallow task caching.
- **FILE-006**: `/configuration/lint-staged.config.ts` — staged-file integration.
- **FILE-007**: `/.github/workflows/analyze-code.yml` — advisory CI integration and artifact upload.
- **FILE-008**: `/.github/workflows/remove-deprecations.yml` — automated cleanup integration and PR messaging.
- **FILE-009**: `/documentation/planning/2026-06-19T13:34:23Z-feature-fallow-code-quality-integration.plan.md` — source-of-truth plan document.

## 6. Testing

- **TEST-001**: Run root fallow Nx targets locally (`monorepo:fallow*`) and verify deterministic output on unchanged code.
- **TEST-002**: Run `pnpm exec nx run monorepo:analyze-code --configuration=check` and verify existing checks still execute with knip preserved.
- **TEST-003**: Run lint-staged against staged TS/JS samples and confirm fallow integration does not break commit workflow.
- **TEST-004**: Execute CI workflow branch run for `analyze-code` and verify advisory fallow artifacts/logs are published without hard failure.
- **TEST-005**: Execute `remove-deprecations` workflow in a dry/manual context and verify generated PR metadata reflects both knip and fallow sources.

## 7. Risks & Assumptions

- **RISK-001**: Fallow may surface high initial noise in a mature monorepo; advisory rollout mitigates immediate developer friction.
- **RISK-002**: False positives from framework conventions or dynamic loading patterns can lead to unsafe cleanup suggestions if apply mode is overused.
- **RISK-003**: Overlapping findings with knip may confuse prioritization unless outputs are clearly labeled in CI artifacts and PR text.
- **ASSUMPTION-001**: The repository will continue to run `knip` long-term, and team policy will not remove it during this implementation.
- **ASSUMPTION-002**: CI maintainers accept advisory-first visibility as a temporary adoption stage before any stricter gate decision.
- **ASSUMPTION-003**: Static-only adoption is sufficient for near-term code quality goals; runtime coverage can be considered in a later plan.

## 8. Related Specifications / Further Reading

- https://docs.fallow.tools/quickstart
- https://docs.fallow.tools/configuration/overview
- https://docs.fallow.tools/cli/audit
- https://docs.fallow.tools/analysis/auto-fix
- https://docs.fallow.tools/analysis/limitations
- https://docs.fallow.tools/integrations/ci
- /documentation/planning/2026-02-25-feature-static-analysis-tools-expansion-1.plan.md
- /documentation/planning/2026-02-26-feature-biome-oxlint-integration-1.plan.md
