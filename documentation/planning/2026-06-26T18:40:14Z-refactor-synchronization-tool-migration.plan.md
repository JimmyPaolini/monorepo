---
name: Refactor Sync Scripts into Synchronization Tool
description: Migrate root sync scripts into a new NestJS command tool under tools/synchronization, with one command module per sync workflow and updated Nx/CI/lint-staged consumers.
created: 2026-06-26T18:40:14Z
updated: 2026-06-26T21:15:00Z
status: 'Complete'
---

# Introduction

![Status: In progress](https://img.shields.io/badge/status-In%20progress-yellow)

This plan defines a full refactor of selected `sync-*` scripts from `scripts/` into a new Nx project `tools/synchronization` generated via `conformance:nestjs-command-application`. Each in-scope sync workflow will become its own `conformance:nestjs-command-module`, with helper decomposition performed using `conformance:nestjs-service-file` where needed. The plan also updates generator capabilities, Nx targets, lint-staged wiring, and CI consumers so synchronization remains enforceable after the migration.

## 1. Requirements & Constraints

- **REQ-001**: Create `tools/synchronization` as a NestJS command application scaffolded by `conformance:nestjs-command-application`.
- **REQ-002**: Extend conformance generators so command applications can be generated under both `tools/` and `packages/` (in addition to existing behavior).
- **REQ-003**: Convert each in-scope root sync workflow into its own `nestjs-command-module` inside `tools/synchronization/src/modules/`.
- **REQ-004**: Keep `sync-conventional-config` as a single command module; extract helper logic into generated `nestjs-service-file` service files as needed.
- **REQ-005**: Move synchronization Nx targets from root `project.json` (`monorepo:sync-*`) to `tools/synchronization/project.json`.
- **REQ-006**: Update all consumers (lint-staged, CI workflows, scripts/docs references) to invoke the new synchronization project targets.
- **REQ-007**: Keep behavior parity for `check` and `write` modes, including non-zero exits on drift and existing formatting follow-up behavior.
- **REQ-008**: Out of scope: `.devcontainer/scripts/sync-vscode-extensions.ts` and `.devcontainer/scripts/sync-vscode-settings.ts`.
- **SEC-001**: Do not introduce suppression-based fixes (`eslint-disable`, `@ts-ignore`, `@ts-expect-error`) during migration.
- **CON-001**: Follow monorepo strict TypeScript and Nest command conventions (explicit types, structured modules, logger context, deterministic exits).
- **CON-002**: Preserve workspace validation flows by keeping synchronization checks runnable from pre-commit and CI.
- **GUD-001**: Prefer generator-driven scaffolding (`nx g conformance:*`) over manual file creation for the new app/modules/services.
- **GUD-002**: Prefer reusing existing parsing/sync helper logic by moving code into services instead of rewriting algorithms.
- **PAT-001**: Maintain `check|write` command semantics currently used by sync scripts.
- **PAT-002**: Keep one module per workflow: `sync-agent-skills`, `sync-conformance-generators`, `sync-conventional-config`, `sync-devcontainer-configuration`, `sync-pull-request-template`.

## 2. Implementation Steps

### Implementation Phase 1 — Generator and Conformance Foundation

- GOAL-001: Enable command application generation in `tools/` and `packages/`, and ensure conformance checks recognize generated instances outside `applications/`.

| Task ✅  2026-06-26T20:35:26Z  | Description | Completed | Date |
| -------- | ----------- | --------- | ---- |
| TASK-001 | Update `tools/conformance/src/generators/nestjs-command-application/generator.ts` to accept a destination root (`applications` \| `tools` \| `packages`) and generate to the selected directory. | ✅ | 2026-06-26T18:51:13Z |
| TASK-002 | Update command-application schema/prompt surfaces (generator options + any prompt text) to expose destination root selection with deterministic defaults. | ✅ | 2026-06-26T18:54:49Z |
| TASK-003 | Update `tools/conformance/src/constants.ts` and `tools/conformance/src/conformance.test.ts` so template-conformance discovery includes generated command-app instances under `tools/` and `packages/`. | ✅ | 2026-06-26T19:19:02Z |
| TASK-004 | Run `pnpm exec nx run conformance:test` to validate generator/template conformance after destination-root expansion. | ✅ | 2026-06-26T19:19:37Z |

### Implementation Phase 2 — Create Synchronization Tool and Command Modules

- GOAL-002: Scaffold `tools/synchronization` and generate one command module per in-scope sync workflow.

| Task ✅  2026-06-26T20:35:26Z  | Description | Completed | Date |
| -------- | ----------- | --------- | ---- |
| TASK-005 | Generate project with `pnpm exec nx g conformance:nestjs-command-application --name synchronization` (using updated destination-root support targeting `tools/`). | ✅ | 2026-06-26T19:39:15Z |
| TASK-006 | Generate modules in `tools/synchronization` via `conformance:nestjs-command-module` for: `agent-skills`, `conformance-generators`, `conventional-config`, `devcontainer-configuration`, `pull-request-template`. | ✅ | 2026-06-26T19:41:14Z |
| TASK-007 | For `conventional-config` module only, generate additional service files with `conformance:nestjs-service-file` for I/O, constants, validators, and helpers, then migrate logic from existing split script files. | ✅ | 2026-06-26T20:35:39Z |
| TASK-008 | Port command implementations from `scripts/sync-*.ts` to module command classes, preserving command arguments (`check\|write`), output messages, and exit codes. | ✅ | 2026-06-26T20:39:11Z |
| TASK-009 | Port exported file-list constants currently consumed by lint-staged into a stable, importable location in `tools/synchronization` and preserve exact list content semantics. | ✅ | 2026-06-26T20:37:25Z |

### Implementation Phase 3 — Nx Targets and Consumer Migration

- GOAL-003: Replace root sync targets with synchronization project targets and update all invocation points.

| Task ✅  2026-06-26T20:35:26Z  | Description | Completed | Date |
| -------- | ----------- | --------- | ---- |
| TASK-010 | Add synchronization targets to `tools/synchronization/project.json` for each workflow with `check` and `write` configurations matching current behavior. | ✅ | 2026-06-26T21:10:03Z |
| TASK-011 | Remove or deprecate in-scope `monorepo:sync-*` targets from root `project.json` and relocate their `inputs`, descriptions, and commands to the new project targets. | ✅ | 2026-06-26T21:10:03Z |
| TASK-012 | Update `configuration/lint-staged.config.ts` imports and commands to reference `synchronization:*:check` targets and new file-list constant exports. | ✅ | 2026-06-26T21:10:03Z |
| TASK-013 | Update `.github/workflows/validate-conventions.yml` and any other CI workflow references to call `synchronization:*:check` targets. | ✅ | 2026-06-26T21:10:03Z |
| TASK-014 | Update documentation and prompt/skill references that invoke old `monorepo:sync-*` tasks so examples and automation point to the new target locations. | ✅ | 2026-06-26T21:10:03Z |

### Implementation Phase 4 — Cleanup, Parity Verification, and Validation

- GOAL-004: Remove superseded script entrypoints, confirm behavior parity, and pass full quality checks.

| Task ✅  2026-06-26T20:35:26Z  | Description | Completed | Date |
| -------- | ----------- | --------- | ---- |
| TASK-015 | Delete or archive in-scope legacy script entrypoints under `scripts/` after all consumers are migrated and verified. | ✅ | 2026-06-26T21:15:00Z |
| TASK-016 | Run parity checks by executing each migrated target in `check` mode and validating expected drift detection/errors on controlled fixture changes where applicable. | ✅ | 2026-06-26T21:15:00Z |
| TASK-017 | Run migration validation suite: `pnpm exec nx run-many --target=lint --projects=synchronization,conformance,monorepo --configuration=check` and `pnpm exec nx run-many --target=typecheck --projects=synchronization,conformance,monorepo`. | ✅ | 2026-06-26T21:15:00Z |
| TASK-018 | Run required workspace validation: `pnpm exec nx affected --target=analyze-code --configuration=write --base=main` then `pnpm exec nx affected --target=analyze-code --configuration=check --base=main`. | ✅ | 2026-06-26T21:15:00Z |

## 3. Alternatives

- **ALT-001**: Keep all sync scripts in `scripts/` and only wrap them with a NestJS shell command. Rejected because this does not deliver module-level ownership or meaningful migration into a tool project.
- **ALT-002**: Generate synchronization app under `applications/` then move it to `tools/`. Rejected due to unnecessary churn and higher path/update risk once generator destination support is explicitly requested.
- **ALT-003**: Split `sync-conventional-config` into multiple command modules. Rejected by explicit user decision to keep a single module with helper service files.
- **ALT-004**: Leave `monorepo:sync-*` targets as canonical and add duplicate synchronization targets. Rejected because user requested moving targets into the tool project and updating all consumers.

## 4. Dependencies

- **DEP-001**: `tools/conformance` generator updates must land before creating `tools/synchronization` via generator.
- **DEP-002**: `tools/synchronization` module scaffolding depends on `framework:nest-commander` tag correctness in generated project metadata.
- **DEP-003**: `configuration/lint-staged.config.ts` migration depends on stable exported constant paths from synchronization modules.
- **DEP-004**: CI workflow updates depend on finalized target names in `tools/synchronization/project.json`.

## 5. Files

- **FILE-001**: `tools/conformance/src/generators/nestjs-command-application/generator.ts` — add destination-root support.
- **FILE-002**: `tools/conformance/src/generators/nestjs-command-application/*` schema/template files — update prompts/options for destination root.
- **FILE-003**: `tools/conformance/src/constants.ts` — broaden conformance pattern coverage for generated command apps.
- **FILE-004**: `tools/conformance/src/conformance.test.ts` — include non-application generated instances in template conformance checks.
- **FILE-005**: `tools/synchronization/project.json` — new command target definitions and check/write configurations.
- **FILE-006**: `tools/synchronization/src/modules/**` — generated modules and migrated command logic for in-scope sync workflows.
- **FILE-007**: `tools/synchronization/src/modules/conventional-config/**` — service-file decomposition for helper logic.
- **FILE-008**: `project.json` (root monorepo project) — remove/migrate in-scope `sync-*` targets.
- **FILE-009**: `configuration/lint-staged.config.ts` — update imports and Nx commands to new synchronization targets/constants.
- **FILE-010**: `.github/workflows/validate-conventions.yml` (and other workflow references) — update sync task invocations.
- **FILE-011**: `documentation/**` and `.github/prompts/**` references to old sync target names — update to synchronization target names.
- **FILE-012**: `scripts/sync-agent-skills.ts`, `scripts/sync-conformance-generators.ts`, `scripts/sync-conventional-config*.ts`, `scripts/sync-devcontainer-configuration.ts`, `scripts/sync-pull-request-template.ts` — remove or relocate after migration.

## 6. Testing

- **TEST-001**: Generator regression: run `pnpm exec nx run conformance:test` to confirm generator template conformance still passes with new destination support.
- **TEST-002**: Project-level checks: run `pnpm exec nx run synchronization:lint:check` and `pnpm exec nx run synchronization:typecheck`.
- **TEST-003**: Target parity: execute each `synchronization:*:check` target and verify non-zero exit on intentional drift.
- **TEST-004**: Lint-staged integration: run lint-staged against staged files matching synchronization constant globs and confirm `synchronization:*:check` commands trigger.
- **TEST-005**: CI integration: run or dry-run updated workflow jobs that previously called `monorepo:sync-*` and verify green execution with new targets.
- **TEST-006**: Full validation gate: run `pnpm exec nx affected --target=analyze-code --configuration=write --base=main` and `... --configuration=check --base=main`.

## 7. Risks & Assumptions

- **RISK-001**: Missing a consumer of `monorepo:sync-*` can silently break convention enforcement in pre-commit or CI.
- **RISK-002**: Generator destination-root expansion may break existing assumptions in conformance tests if patterns are incomplete.
- **RISK-003**: Refactoring script logic into Nest command/services may alter stdout formatting or exit behavior expected by automation.
- **RISK-004**: Moving exported file-list constants can break lint-staged imports if path changes are not coordinated.
- **ASSUMPTION-001**: The new synchronization project will retain equivalent command names/configurations to minimize migration complexity.
- **ASSUMPTION-002**: Out-of-scope devcontainer sync scripts remain operational and unchanged in this effort.
- **ASSUMPTION-003**: No external package upgrades are required for this migration beyond existing workspace dependencies.

## 8. Related Specifications / Further Reading

- `AGENTS.md`
- `tools/conformance/src/generators/nestjs-command-application/generator.ts`
- `tools/conformance/src/generators/nestjs-command-module/generator.ts`
- `project.json` (root monorepo targets)
- `configuration/lint-staged.config.ts`
- `.github/workflows/validate-conventions.yml`
- `documentation/planning/2026-06-15T00:00:00Z-refactor-monorepo-lint-remediation.plan.md`
