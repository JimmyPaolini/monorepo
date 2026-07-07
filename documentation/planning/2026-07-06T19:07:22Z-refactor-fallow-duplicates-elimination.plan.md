---
name: Eliminate Fallow-Reported Production Source Duplication Across the Monorepo
description: Refactor all production-source duplicate clone groups reported by the current fallow configuration, using existing patterns first and conformance-generated abstractions for any new shared structure.
created: 2026-07-06T19:07:22Z
updated: 2026-07-07T00:25:21Z
status: In progress
---

# Introduction

![Status: In progress](https://img.shields.io/badge/status-In%20progress-yellow)

This plan defines a full-scope refactor to eliminate all production source duplication currently reported by `fallow dupes --config configuration/fallow.config.jsonc --format=json`, including both intra-project and cross-project clone groups. The implementation prioritizes reuse of existing architectural patterns and requires conformance generators for any newly introduced abstractions.

## 1. Requirements & Constraints

- **REQ-001**: Refactor only duplication that is in scope of the current fallow configuration (`configuration/fallow.config.jsonc`), which targets production source files and excludes configured test paths.
- **REQ-002**: Resolve duplicate clone groups across all projects currently surfaced by fallow, including cross-project groups.
- **REQ-003**: Reduce fallow duplicate output to zero actionable clone groups under the current configuration.
- **REQ-004**: Prioritize existing reusable patterns before creating new abstractions.
- **REQ-005**: If new abstractions are required, generate new files using conformance generators instead of ad-hoc manual scaffolding.
- **REQ-006**: Preserve runtime behavior and existing public APIs for affected modules unless an explicit migration task is documented and validated.
- **SEC-001**: Do not weaken security, lint, or type safety gates while deduplicating code (no disable comments, no rule suppression, no strictness downgrades).
- **CON-001**: Use Nx-first task execution for validation and quality checks.
- **CON-002**: Maintain strict TypeScript conventions, import ordering, explicit return types, and no `any` usage.
- **CON-003**: Maintain monorepo branch and PR quality expectations; avoid cross-scope drift outside duplicate-removal work.
- **GUD-001**: Start with highest-impact clone groups by `line_count` and cross-project breadth, then proceed to smaller residual groups.
- **GUD-002**: Prefer extraction into existing services/utilities where architectural ownership is already clear.
- **GUD-003**: Update or add unit/integration tests for every refactored algorithm branch that changes call structure.
- **PAT-001**: Use established aspect and ephemeris service orchestration patterns in `applications/caelundas/src/modules/**`.
- **PAT-002**: Use existing logger service composition patterns before introducing shared logger abstraction.
- **QAL-001**: Final acceptance is based on both quality-gate pass and duplicate-analysis pass.

## 2. Implementation Steps

### Phase 1

- **GOAL-001**: Establish a deterministic duplicate baseline and map each reported clone group to an implementation owner and deduplication strategy.

| Task     | Description | Completed | Date |
| -------- | ----------- | --------- | ---- |
| TASK-001 | Run `pnpm exec nx run monorepo:fallow-duplicates:json` and persist the JSON output snapshot for planning traceability. | ✅ | 2026-07-06T19:29:45Z |
| TASK-002 | Build a clone-group inventory keyed by `fingerprint`, `line_count`, `instances.file`, and `instances.start_line` from the fallow JSON report. | ✅ | 2026-07-06T19:31:51Z |
| TASK-003 | Partition clone groups into strategy classes: existing-pattern extraction, shared utility extraction, service-level adapter extraction, and config-level exclusion validation (only if already configured). | ✅ | 2026-07-06T19:34:45Z |
| TASK-004 | Assign each clone group to one or more owning projects (`caelundas`, `conformance`, `synchronization`, `lexico-ingestion`, root config) and define target files/functions. | ✅ | 2026-07-06T19:38:03Z |
| TASK-005 | Freeze non-goal scope (no unrelated stylistic or feature additions) and document behavior-preservation checks for each targeted module. | ✅ | 2026-07-07T00:16:28Z |

### Phase 2

- **GOAL-002**: Remove all production-source duplicates in the `tools/conformance` and `tools/synchronization` families while preserving generator behavior and command UX.

| Task     | Description | Completed | Date |
| -------- | ----------- | --------- | ---- |
| TASK-006 | Refactor repeated command-generation flows in `tools/conformance/src/modules/*/*.command.ts` by extracting shared command-construction logic into existing or conformance-generated shared modules. | ✅ | 2026-07-07T00:16:28Z |
| TASK-007 | Replace repeated option parsing and workspace format callback blocks in conformance command modules with standardized helper APIs. | ✅ | 2026-07-07T00:16:28Z |
| TASK-008 | Refactor duplicated command sections in `tools/synchronization/src/modules/*/*.command.ts` into shared synchronization abstractions consistent with current module patterns. | ✅ | 2026-07-07T00:16:28Z |
| TASK-009 | When new reusable files are needed, generate them using `nx g conformance:nsm`, `nx g conformance:nsf`, or other applicable conformance generators, then integrate without altering command contracts. |  |  |
| TASK-010 | Update/expand module unit tests in `tools/conformance/src/modules/**/*.unit.test.ts` and `tools/synchronization/src/modules/**/*.unit.test.ts` for shared-path behavior and failure-path parity. |  |  |

### Phase 3

- **GOAL-003**: Remove all production-source duplicates in `applications/caelundas` and `applications/lexico-ingestion` clone groups, prioritizing existing patterns.

| Task     | Description | Completed | Date |
| -------- | ----------- | --------- | ---- |
| TASK-011 | Deduplicate logger service clone groups across `applications/caelundas`, `applications/lexico-ingestion`, `tools/conformance`, and `tools/synchronization` by extracting and adopting a shared logger initialization/composition pattern. |  |  |
| TASK-012 | Refactor duplicated aspect detector flows in `applications/caelundas/src/modules/major-aspects`, `minor-aspects`, and `specialty-aspects` using existing utilities in `applications/caelundas/src/modules/aspects`. |  |  |
| TASK-013 | Refactor duplicated ephemeris wrapper and loop patterns in `applications/caelundas/src/modules/ephemeris/*.service.ts` by consolidating minute-loop and guard orchestration through existing ephemeris services. |  |  |
| TASK-014 | Ensure any new abstraction file needed in application modules is generated through conformance tooling where generator coverage exists; otherwise document why direct file creation is required and keep scope minimal. |  |  |
| TASK-015 | Update unit and integration tests in `applications/caelundas/src/modules/**/*.unit.test.ts` and `applications/caelundas/testing/**` to assert unchanged domain outcomes after extraction. |  |  |

### Phase 4

- **GOAL-004**: Validate that all duplicates identified by current fallow configuration are resolved and quality gates remain fully green.

| Task     | Description | Completed | Date |
| -------- | ----------- | --------- | ---- |
| TASK-016 | Run `pnpm exec nx run monorepo:fallow-duplicates:json` and verify no remaining actionable clone groups are reported under current configuration. |  |  |
| TASK-017 | Run project-level quality for touched projects: `pnpm exec nx run <project>:analyze-code --configuration=write` then `--configuration=check`. |  |  |
| TASK-018 | Run affected quality gates: `pnpm exec nx affected --target=analyze-code --configuration=write --base=main` and `--configuration=check --base=main`. |  |  |
| TASK-019 | For each touched TypeScript project with `type-coverage`, run both `pnpm exec nx run <project>:typecheck` and `pnpm exec nx run <project>:type-coverage`. |  |  |
| TASK-020 | Capture final before/after duplicate metrics (`clone_groups`, `clone_instances`, `duplicated_lines`, `duplication_percentage`) and attach to PR description. |  |  |

## 3. Files

- **FILE-001**: configuration/fallow.config.jsonc - Source-of-truth duplicate scope and threshold behavior.
- **FILE-002**: project.json - Root target composition including `fallow-duplicates` and `analyze-code` orchestration.
- **FILE-003**: nx.json - Target defaults and caching behavior used during validation.
- **FILE-004**: tools/conformance/src/modules/**/*.command.ts - Primary command-module duplicate families.
- **FILE-005**: tools/conformance/src/modules/**/*.unit.test.ts - Validation coverage for extracted shared logic.
- **FILE-006**: tools/synchronization/src/modules/**/*.command.ts - Synchronization command duplicate families.
- **FILE-007**: tools/synchronization/src/modules/**/*.unit.test.ts - Synchronization regression tests after deduplication.
- **FILE-008**: applications/caelundas/src/modules/logger/logger.service.ts - Logger clone family participant.
- **FILE-009**: applications/lexico-ingestion/src/modules/logger/logger.service.ts - Logger clone family participant.
- **FILE-010**: tools/conformance/src/modules/logger/logger.service.ts - Logger clone family participant.
- **FILE-011**: tools/synchronization/src/modules/logger/logger.service.ts - Logger clone family participant.
- **FILE-012**: applications/caelundas/src/modules/aspects/aspects-utilities.service.ts - Existing dedupe utility anchor.
- **FILE-013**: applications/caelundas/src/modules/major-aspects/major-aspects.service.ts - Aspect detector duplicate candidate.
- **FILE-014**: applications/caelundas/src/modules/minor-aspects/minor-aspects.service.ts - Aspect detector duplicate candidate.
- **FILE-015**: applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.ts - Aspect detector duplicate candidate.
- **FILE-016**: applications/caelundas/src/modules/ephemeris/*.service.ts - Ephemeris duplicate candidate family.
- **FILE-017**: applications/caelundas/testing/aspect-test.utilities.ts - Existing test helper patterns to preserve.
- **FILE-018**: documentation/planning/2026-07-06T19:07:22Z-refactor-fallow-duplicates-elimination.plan.md - This plan document.

## 4. Dependencies

- **DEP-001**: Nx task graph and target execution (`nx run`, `nx affected`) for deterministic project validation.
- **DEP-002**: Fallow duplicate analysis CLI and configuration (`fallow dupes`, `configuration/fallow.config.jsonc`).
- **DEP-003**: Conformance generators (`nx g conformance:*`) for creating new abstraction/module files when needed.
- **DEP-004**: TypeScript strict-mode and ESLint/oxlint rules enforced by monorepo configuration.
- **DEP-005**: Existing domain services/utilities in `applications/caelundas/src/modules/aspects` and `applications/caelundas/src/modules/ephemeris`.

## 5. Testing & Validation

- **TEST-001**: Unit tests for extracted helper functions in `tools/conformance` command modules, including option parsing and file-generation callback behavior.
- **TEST-002**: Unit tests for `tools/synchronization` command modules after shared abstraction extraction.
- **TEST-003**: Unit tests for logger services to verify output level, transport configuration, and child logger behavior remain unchanged.
- **TEST-004**: Unit tests for aspect detection pathways (`major`, `minor`, `specialty`) validating phase detection parity pre/post refactor.
- **TEST-005**: Integration-level tests in `applications/caelundas` for ephemeris computation flows to verify unchanged output semantics.
- **VAL-001**: `pnpm exec nx run monorepo:fallow-duplicates:json` returns zero actionable duplicate groups in scope.
- **VAL-002**: `pnpm exec nx affected --target=analyze-code --configuration=write --base=main` passes or applies only acceptable autofixes.
- **VAL-003**: `pnpm exec nx affected --target=analyze-code --configuration=check --base=main` passes with no remaining issues.
- **VAL-004**: `pnpm exec nx affected --target=test --base=main` passes for all touched projects.
- **VAL-005**: `pnpm exec nx affected --target=typecheck --base=main` passes for all touched TypeScript projects.
- **VAL-006**: `pnpm exec nx run <touched-project>:type-coverage` passes for each touched project exposing that target.

## 6. Risks & Assumptions

- **RISK-001**: Over-aggressive abstraction may reduce module readability or hide domain intent.
- **RISK-002**: Cross-project deduplication may introduce unintended coupling if shared ownership boundaries are not explicit.
- **RISK-003**: Behavior drift risk in command modules if extracted helper order or option precedence changes.
- **RISK-004**: Hidden duplicate groups can reappear after partial refactors if extraction is inconsistent between sibling modules.
- **RISK-005**: Conformance generator coverage may not exactly match required abstraction shape for all refactor cases.
- **ASSUMPTION-001**: Current fallow configuration accurately represents the intended production-source duplicate scope.
- **ASSUMPTION-002**: Existing tests plus added targeted tests are sufficient to detect semantic regressions.
- **ASSUMPTION-003**: Required conformance generators are available and usable for new files in the affected scopes.

## 7. Alternatives

- **ALT-001**: Suppress duplicate findings with inline comments (`// fallow-ignore-next-line code-duplication`). Rejected because requirement is full resolution of configured duplicates.
- **ALT-002**: Narrow fallow configuration to reduce reported groups. Rejected because user requested resolution of all duplicates identified by the current configuration.
- **ALT-003**: Defer cross-project duplicates and handle only per-project clones. Rejected because scope explicitly includes cross-project groups.
- **ALT-004**: Create one large shared utility package for all duplicates. Rejected because this risks unnecessary coupling; preferred approach is pattern-local extraction first.

## 8. Related Specifications / Further Reading

- documentation/planning/2026-06-29T02:15:19Z-refactor-fallow-test-duplicates-triage.plan.md
- documentation/planning/2026-06-19T13:34:23Z-feature-fallow-code-quality-integration.plan.md
- documentation/skills/create-plan/SKILL.md
- configuration/fallow.config.jsonc
- AGENTS.md
