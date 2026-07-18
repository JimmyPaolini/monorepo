---
name: Refactor Conformance Validator Language Services and Remove Barrel Export
description: Replace function-based JSON/Markdown/Text validators with flattened NestJS service files, remove the validator barrel export, and migrate dispatch to DI-injected services while explicitly evaluating Python validator overlap.
created: 2026-07-03T13:45:08Z
updated: 2026-07-06T01:55:32Z
status: 'Completed'
---

# Introduction

![Status: Completed](https://img.shields.io/badge/status-Completed-brightgreen)

This plan refactors the conformance validator module to use class-based service implementations for JSON, Markdown, and Text validation, generated via the `nestjs-service-file` generator and flattened under the validator module root. The plan removes the validator barrel file, migrates dispatch logic to dependency injection, updates tests for service-based behavior, and explicitly removes Python JSON/Markdown/Text validator implementations that are redundant with the TypeScript validator flow.

## 1. Requirements & Constraints

- **REQ-001**: Remove `tools/conformance/src/modules/validator/index.ts` and eliminate all imports that rely on that barrel export.
- **REQ-002**: Regenerate language validators using the `conformance:nestjs-service-file` generator as `validator-json.service.ts`, `validator-markdown.service.ts`, and `validator-text.service.ts`.
- **REQ-003**: Place generated service files directly under `tools/conformance/src/modules/validator` (flattened layout), not under `tools/conformance/src/modules/validator/validators/*`.
- **REQ-004**: Move existing JSON/Markdown/Text validation logic fully into service class methods; no standalone validator functions may remain for these three languages.
- **REQ-005**: Refactor `validator-files.service.ts` to use DI-injected language services for JSON/Markdown/Text routing.
- **REQ-006**: Preserve current validator behavior and result-shape compatibility for existing callers unless an explicit migration step is documented and validated.
- **REQ-007**: Keep TypeScript validator flow operational and compatible with existing orchestration paths.
- **REQ-008**: Remove Python JSON/Markdown/Text validator implementations because those language checks are covered by TypeScript validator services in this module.
- **REQ-009**: Refactor related TypeScript and Python test suites to match the new service-based validator architecture and removed Python JSON/Markdown/Text paths.
- **SEC-001**: Do not introduce dynamic code execution, shell evaluation, or unchecked path execution in validator services.
- **SEC-002**: Preserve current safe file-reading and validation boundaries already enforced by existing validator services.
- **CON-001**: Follow monorepo TypeScript strict-mode conventions (explicit typing, no `any`, no suppression comments).
- **CON-002**: Use Nx-based project execution for verification (`nx run conformance:*` and/or `nx affected`).
- **CON-003**: Keep changes scoped to `tools/conformance` and related planning documentation.
- **CON-004**: Maintain existing test taxonomy and naming conventions (`*.unit.test.ts`).
- **GUD-001**: Prefer minimal invasive changes to orchestration services beyond language validator wiring.
- **GUD-002**: Preserve user-facing command behavior in `validator.command.service.ts`.
- **PAT-001**: Continue NestJS provider pattern via module registration and constructor injection.
- **PAT-002**: Keep language dispatch centralized in `validator-files.service.ts`.
- **DEC-001**: Keep Python validator support only for language paths not covered by TypeScript validators; remove Python JSON/Markdown/Text paths.

## 2. Implementation Steps

### Implementation Phase 1

- GOAL-001: Scaffold and migrate JSON/Markdown/Text validators from function modules to flattened NestJS service classes.

| Task | Description | Completed | Date |
| -------- | --------------------- | --------- | ---- |
| TASK-001 | Generate `validator-json.service.ts` and `validator-json.service.unit.test.ts` in `tools/conformance/src/modules/validator` using `pnpm exec nx generate conformance:nestjs-service-file --project=conformance --module=validator --name=validator-json`. | ✅ | 2026-07-04T14:40:54Z |
| TASK-002 | Generate `validator-markdown.service.ts` and `validator-markdown.service.unit.test.ts` in `tools/conformance/src/modules/validator` using `pnpm exec nx generate conformance:nestjs-service-file --project=conformance --module=validator --name=validator-markdown`. | ✅ | 2026-07-04T14:40:54Z |
| TASK-003 | Generate `validator-text.service.ts` and `validator-text.service.unit.test.ts` in `tools/conformance/src/modules/validator` using `pnpm exec nx generate conformance:nestjs-service-file --project=conformance --module=validator --name=validator-text`. | ✅ | 2026-07-04T14:40:54Z |
| TASK-004 | Move logic from `validators/json/validator.ts` into `validator-json.service.ts` class methods with explicit types and equivalent return semantics. | ✅ | 2026-07-04T14:40:54Z |
| TASK-005 | Move logic from `validators/markdown/validator.ts` (and required node helpers) into `validator-markdown.service.ts` class methods or private class methods while preserving behavior. | ✅ | 2026-07-04T14:40:54Z |
| TASK-006 | Move logic from `validators/text/validator.ts` into `validator-text.service.ts` class methods and remove function-based entry points for JSON/Markdown/Text. | ✅ | 2026-07-04T14:40:54Z |

### Implementation Phase 2

- GOAL-002: Replace barrel/function-based integration with DI wiring and update tests to service-based behavior.

| Task | Description | Completed | Date |
| -------- | --------------------- | --------- | ---- |
| TASK-007 | Update `validator.module.ts` providers/exports to register and expose `ValidatorJsonService`, `ValidatorMarkdownService`, and `ValidatorTextService`. | ✅ | 2026-07-04T15:44:24Z |
| TASK-008 | Refactor `validator-files.service.ts` constructor and dispatch logic to use injected language services for `.json`, `.md`, and `.txt` paths. | ✅ | 2026-07-04T15:58:12Z |
| TASK-009 | Remove `tools/conformance/src/modules/validator/index.ts` and replace all barrel-based imports with direct file imports. | ✅ | 2026-07-04T15:52:09Z |
| TASK-010 | Update `validator-files.service.unit.test.ts` to mock/inject the new language services instead of function module mocks. | ✅ | 2026-07-04T15:55:01Z |
| TASK-011 | Update `validator.service.unit.test.ts` and any other tests that assert barrel re-exports or function-style language validators. | ✅ | 2026-07-04T16:02:26Z |
| TASK-012 | Refactor legacy language validator test suites in `tools/conformance/src/modules/validator/validators/{json,markdown,text}/*.unit.test.ts` into service-oriented tests under flattened service test files, then remove obsolete legacy test files. | ✅ | 2026-07-04T16:18:03Z |

### Implementation Phase 3

- GOAL-003: Remove redundant Python JSON/Markdown/Text validators and complete validation gates.

| Task | Description | Completed | Date |
| -------- | --------------------- | --------- | ---- |
| TASK-013 | Remove Python JSON/Markdown/Text validator implementation files under `tools/conformance/src/modules/validator/python/{json,markdown,text}` and adjust package init/module exports to remove those paths. | ✅ | 2026-07-05T20:24:34Z |
| TASK-014 | Update `validator-python-bridge.service.ts` and related tests so bridge/runtime logic no longer routes JSON/Markdown/Text validation through Python. | ✅ | 2026-07-04T16:25:40Z |
| TASK-015 | Update or remove Python unit tests tied to JSON/Markdown/Text validators and keep only Python tests for remaining supported paths. | ✅ | 2026-07-06T01:55:32Z |
| TASK-016 | Refactor cross-module validator tests (`validator-files.service.unit.test.ts`, `validator.service.unit.test.ts`, and `validator-python-bridge.service.unit.test.ts`) to remove assumptions about barrel exports, function-style validators, and Python JSON/Markdown/Text execution paths. | ✅ | 2026-07-06T01:55:32Z |
| TASK-017 | Run `pnpm exec nx run conformance:analyze-code --configuration=write`, then `pnpm exec nx run conformance:analyze-code --configuration=check`, then `pnpm exec nx run conformance:test` and fix any regressions. | ✅ | 2026-07-06T01:55:32Z |

## 3. Alternatives

- **ALT-001**: Keep function-based validators and only change import paths. Rejected because this does not satisfy the requirement to regenerate as `nestjs-service-file` service classes and migrate to DI.
- **ALT-002**: Keep language services in nested folders (`validators/json`, `validators/markdown`, `validators/text`). Rejected because scope requires flattened placement directly under `tools/conformance/src/modules/validator`.
- **ALT-003**: Preserve barrel export and map it to new service files. Rejected because explicit scope requires removing `index.ts` barrel usage.
- **ALT-004**: Retain Python JSON/Markdown/Text validators in parallel with TypeScript validators. Rejected because this preserves duplicate logic and increases maintenance overhead.

## 4. Dependencies

- **DEP-001**: Existing Nx generator `conformance:nestjs-service-file` in `tools/conformance/src/modules/nestjs-service-file` must remain functional for scaffold generation.
- **DEP-002**: NestJS DI container wiring in `validator.module.ts` must be updated consistently with constructor signatures in consuming services.
- **DEP-003**: Existing validation contracts in `validator.types.ts` and shared helpers in `validators/common.ts` must remain compatible or be migrated with explicit type updates.
- **DEP-004**: Python bridge integration in `validator-python-bridge.service.ts` and associated Python files must be updated to remove JSON/Markdown/Text paths cleanly.

## 5. Files

- **FILE-001**: tools/conformance/src/modules/validator/index.ts - Remove barrel file and all dependent imports.
- **FILE-002**: tools/conformance/src/modules/validator/validator-json.service.ts - New generated and populated JSON validator service.
- **FILE-003**: tools/conformance/src/modules/validator/validator-markdown.service.ts - New generated and populated Markdown validator service.
- **FILE-004**: tools/conformance/src/modules/validator/validator-text.service.ts - New generated and populated Text validator service.
- **FILE-005**: tools/conformance/src/modules/validator/validator-json.service.unit.test.ts - Unit tests for JSON validator service.
- **FILE-006**: tools/conformance/src/modules/validator/validator-markdown.service.unit.test.ts - Unit tests for Markdown validator service.
- **FILE-007**: tools/conformance/src/modules/validator/validator-text.service.unit.test.ts - Unit tests for Text validator service.
- **FILE-008**: tools/conformance/src/modules/validator/validator-files.service.ts - Refactor dispatch to DI-injected language services.
- **FILE-009**: tools/conformance/src/modules/validator/validator-files.service.unit.test.ts - Update mocks and assertions for service injection model.
- **FILE-010**: tools/conformance/src/modules/validator/validator.module.ts - Register/exports new language services.
- **FILE-011**: tools/conformance/src/modules/validator/validator.service.unit.test.ts - Remove barrel-specific assertions and align with direct imports.
- **FILE-012**: tools/conformance/src/modules/validator/validators/json/validator.ts - Source logic migration target; remove or deprecate after migration.
- **FILE-013**: tools/conformance/src/modules/validator/validators/markdown/validator.ts - Source logic migration target; remove or deprecate after migration.
- **FILE-014**: tools/conformance/src/modules/validator/validators/text/validator.ts - Source logic migration target; remove or deprecate after migration.
- **FILE-015**: tools/conformance/src/modules/validator/python/json/**/* - Remove JSON Python validator implementation and related tests.
- **FILE-016**: tools/conformance/src/modules/validator/python/markdown/**/* - Remove Markdown Python validator implementation and related tests.
- **FILE-017**: tools/conformance/src/modules/validator/python/text/**/* - Remove Text Python validator implementation and related tests.
- **FILE-018**: tools/conformance/src/modules/validator/validator-python-bridge.service.ts - Remove Python routing/bridge behavior for JSON/Markdown/Text.
- **FILE-019**: tools/conformance/src/modules/validator/validator-python-bridge.service.unit.test.ts - Update bridge tests to reflect removed Python JSON/Markdown/Text paths.
- **FILE-020**: tools/conformance/src/modules/validator/validators/json/validator.unit.test.ts - Legacy JSON validator tests to migrate/remove after service test refactor.
- **FILE-021**: tools/conformance/src/modules/validator/validators/markdown/validator.unit.test.ts - Legacy Markdown validator tests to migrate/remove after service test refactor.
- **FILE-022**: tools/conformance/src/modules/validator/validators/text/validator.unit.test.ts - Legacy Text validator tests to migrate/remove after service test refactor.
- **FILE-023**: documentation/planning/2026-07-03T13:45:08Z-refactor-typescript-validators.plan.md - Source-of-truth implementation plan for this refactor.

## 6. Testing & Validation

- **TEST-001**: Add/adjust unit tests for `ValidatorJsonService` to verify structural superset behavior and mismatch reporting parity.
- **TEST-002**: Add/adjust unit tests for `ValidatorMarkdownService` to verify AST-node conformance checks and expected failure messages.
- **TEST-003**: Add/adjust unit tests for `ValidatorTextService` to verify line-presence and ordering behavior parity.
- **TEST-004**: Update `validator-files.service.unit.test.ts` to verify extension routing invokes injected language services.
- **TEST-005**: Update `validator.service.unit.test.ts` to remove barrel assertions and ensure top-level validator orchestration remains correct.
- **TEST-006**: Migrate assertions from legacy `validators/{json,markdown,text}/validator.unit.test.ts` files into `validator-json.service.unit.test.ts`, `validator-markdown.service.unit.test.ts`, and `validator-text.service.unit.test.ts`.
- **TEST-007**: Remove or update Python unit tests under `tools/conformance/src/modules/validator/python/{json,markdown,text}/**/*` to match deleted validator implementations.
- **VAL-001**: Run `pnpm exec nx run conformance:analyze-code --configuration=write` and apply all auto-fixes.
- **VAL-002**: Run `pnpm exec nx run conformance:analyze-code --configuration=check` and ensure zero remaining lint/type/format issues.
- **VAL-003**: Run `pnpm exec nx run conformance:test` to validate TypeScript unit/integration test stability.
- **VAL-004**: Execute relevant Python validation path used by conformance project and ensure bridge behavior remains correct after JSON/Markdown/Text Python path removal.

## 7. Risks & Assumptions

- **RISK-001**: Service migration may subtly change error message text/order, causing test brittleness even if validation semantics are equivalent.
- **RISK-002**: Removing barrel exports may break implicit imports outside the validator module if not fully discovered by static search.
- **RISK-003**: Markdown validator logic migration may accidentally omit helper behavior currently distributed across nested files.
- **RISK-004**: Removing Python JSON/Markdown/Text validators may break bridge imports or package initialization if all references are not removed consistently.
- **ASSUMPTION-001**: `conformance:nestjs-service-file` generator can emit files into the existing `validator` module without template changes.
- **ASSUMPTION-002**: Existing TypeScript validator contracts are sufficiently stable to allow class-based migration without API redesign.
- **ASSUMPTION-003**: TypeScript validator services provide complete coverage for JSON/Markdown/Text conformance behavior required by this module.

## 8. Related Specifications / Further Reading

- [AGENTS.md](AGENTS.md)
- [tools/conformance/AGENTS.md](tools/conformance/AGENTS.md)
- [tools/conformance/project.json](tools/conformance/project.json)
- [nx.json](nx.json)
- [documentation/planning/2026-06-28T13-07-08Z-refactor-conformance-nestjs-command.plan.md](documentation/planning/2026-06-28T13-07-08Z-refactor-conformance-nestjs-command.plan.md)
- [documentation/planning/2026-06-26T18:40:14Z-refactor-synchronization-tool-migration.plan.md](documentation/planning/2026-06-26T18:40:14Z-refactor-synchronization-tool-migration.plan.md)
