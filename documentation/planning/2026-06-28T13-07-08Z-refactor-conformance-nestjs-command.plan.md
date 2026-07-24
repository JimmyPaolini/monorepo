---
name: Refactor Conformance Tool into NestJS Command Application
description: Transform conformance from a library exporting generators into a structured NestJS command application with generator services and a separate validation command module, while maintaining Nx generator compatibility
created: 2026-06-28T13:07:08Z
updated: 2026-06-29T03:19:46Z
status: In progress
---

![Status: In progress](https://img.shields.io/badge/status-In%20progress-yellow)

# Conformance Tool Refactor: NestJS Command Application

## Introduction

The conformance tool is currently structured as a library (`tools/conformance`) that exports Nx generator functions and validation logic. This plan transforms it into a structured NestJS command application using `nest-commander` and the `nestjs-command-application` generator, similar to `lexico-ingestion` and `caelundas`.

**Key strategy**: Use the `nestjs-command-application` generator to scaffold a new conformance command application in `tools/conformance-app` with proper NestJS structure. Then scaffold each generator command module with `nestjs-command-module`, migrate existing generator and validator logic into those modules, and maintain the existing `nx generate conformance:*` interface by keeping `tools/conformance` as a thin Nx plugin layer.

The refactor achieves three goals:
1. **Service-oriented structure**: Each generator becomes a dedicated command service/module, improving maintainability and dependency injection
2. **Separation of concerns**: Validation logic moves into its own command module with a dedicated Nx target (`nx run conformance:validate`)
3. **Quality conformance**: The refactored conformance application itself must pass validation as a properly-structured `nestjs-command-application`

## 1. Requirements & Constraints

### Functional Requirements

- **REQ-001**: All 9 existing generators (`react-component`, `nestjs-service-module`, `nestjs-graphql-module`, `nestjs-command-application`, `nestjs-graphql-application`, `nestjs-command-module`, `nestjs-dataloader-module`, `nestjs-service-file`, `jupyter-notebook-application`) must continue working via `nx generate conformance:<name>`
- **REQ-002**: Generator invocation must maintain backward compatibility—no change to user-facing CLI syntax
- **REQ-003**: Generators must remain registered in `generators.json` and exported as Nx plugin generators from `tools/conformance`
- **REQ-004**: Validation must be callable via a new command: `nx run conformance-app:validate` with configurable target projects and conformance rules
- **REQ-005**: Each generator must be implemented as a NestJS command service using `nest-commander` decorators (`@Command()`, `@Option()`, etc.) in the new `tools/conformance-app`
- **REQ-006**: Validation module must be a separate NestJS command module with types, constants, and unit tests
- **REQ-007**: The refactored conformance-app must itself pass validation as a properly-structured `nestjs-command-application` (auto-generated structure must comply with validation rules)
- **REQ-008**: Each generator command module in conformance-app must be scaffolded with `nx generate conformance:nestjs-command-module` before generator-specific logic is migrated

### Scope & Out of Scope

- **IN SCOPE**:
  - Use `nx generate conformance:nestjs-command-application --name=conformance-app` to scaffold new app in `tools/conformance-app`
  - Use `nx generate conformance:nestjs-command-module --name=<generatorModuleName> --project=conformance-app` to scaffold each generator module
  - Verify generated app passes validation as a `nestjs-command-application`
  - Migrate existing generator logic from `tools/conformance/src/generators/*/generator.ts` into generator command services in `tools/conformance-app/src/commands/generators/`
  - Migrate existing validators into `tools/conformance-app/src/commands/validation/` module
  - Create `ValidationCommand` module wrapping existing validators with `@Command('validate')` decorator
  - Update `tools/conformance/generators.json` factory functions to proxy/bridge to `tools/conformance-app` services
  - Keep `tools/conformance` as Nx plugin layer (thin wrapper for backward compatibility)
  - Update `project.json` for conformance-app to add/verify `start`, `validate` targets
  - Ensure all test files in conformance-app follow monorepo patterns

- **OUT OF SCOPE**:
  - Docker/Kubernetes deployment (conformance remains a development tool only)
  - GraphQL or REST API endpoints (conformance is CLI-only)
  - Database or persistent storage
  - Generator discovery or dynamic plugin loading (static plugin registration only)
  - Changes to existing generator output or templates
  - Removing or restructuring `tools/conformance` (it stays as Nx plugin layer)

### Technical Constraints

- **CON-001**: Must use NestJS 10+ with `nest-commander` for command handling
- **CON-002**: Must maintain TypeScript strict mode (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`)
- **CON-003**: Generators must continue to be exported as Nx plugin generators—the NestJS app structure is internal
- **CON-004**: All new code must follow monorepo conventions: no abbreviations, explicit types, early returns, exhaustive switches, etc.
- **CON-005**: Must pass all existing tests after migration without changes to test expectations
- **CON-006**: Validation module output (success/failure/results) must be JSON serializable for CI integration

### Guidelines

- **GUD-001**: Use the `nestjs-command-application` generator to scaffold the new app structure—do not manually create NestJS files
- **GUD-002**: After generating `tools/conformance-app`, verify it passes `nx run conformance:validate --projects=conformance-app` as a `nestjs-command-application`
- **GUD-003**: Use NestJS dependency injection (constructor injection, `@Injectable()`, `@Module()`) for all services
- **GUD-004**: Keep generators as stateless, idempotent services—no side effects beyond file creation
- **GUD-005**: Validation command must accept a `--projects` flag to specify target projects (default: all projects with `type:component` or `type:application` tags)
- **GUD-006**: Each command module must export `constants`, `types`, `command.service.ts`, `command.module.ts`, and `command.service.unit.test.ts`
- **GUD-007**: Error handling must use typed errors (Zod validation at boundaries), never throw raw strings
- **GUD-008**: Logging must use NestJS `Logger` service, structured logs only (no console.log)
- **GUD-009**: Keep `tools/conformance` as a thin Nx plugin wrapper—it remains the public API for `nx generate conformance:*`
- **GUD-010**: Do not handcraft generator module scaffolding; always scaffold generator modules with `nestjs-command-module` and then layer generator-specific logic on top

### Patterns to Follow

- **PAT-001**: Mirror the lexico-ingestion structure: single root module imports command modules, each command module defines `@Command()` decorator on service, module exports service via providers
- **PAT-002**: Generator services continue to implement existing generator factory interface for backward compatibility
- **PAT-003**: Use `tree: Tree` from `@nx/devkit` as first parameter in all generator command execute methods
- **PAT-004**: Validation rules defined as typed constants in `validation.constants.ts`
- **PAT-005**: Generator command modules follow the exact `nestjs-command-module` output contract (`*.command.ts`, `*.module.ts`, `*.constants.ts`, `*.types.ts`, `*.command.unit.test.ts`) with only additive customization

## 2. Implementation Steps

### Implementation Phase 1: Generate & Validate Scaffolding

**GOAL-PHASE-1**: Generate new NestJS command application scaffold using the `nestjs-command-application` generator and verify the generated structure passes validation.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Run `nx generate conformance:nestjs-command-application --name=conformance-app` to scaffold app in `tools/conformance-app` | ✅ | 2026-06-28T17:41:06Z |
| TASK-002 | Verify generated app structure: check `main.ts`, `modules/conformance-app/conformance-app.module.ts`, directory layout, `project.json`, `package.json` | ✅ | 2026-06-28T17:41:30Z |
| TASK-003 | Run `pnpm install` in workspace to wire up conformance-app dependencies | ✅ | 2026-06-28T17:41:45Z |
| TASK-004 | Confirm `conformance:validate` target availability and defer validation execution to TASK-049 after target wiring is implemented | ✅ | 2026-06-28T17:42:20Z |
| TASK-005 | Record initial scaffold typecheck baseline and defer strict typecheck pass requirement to TASK-052 after module wiring and scaffold fixes | ✅ | 2026-06-28T17:42:45Z |
| TASK-006 | Record initial scaffold lint baseline and defer lint pass requirement to TASK-051 after scaffold normalization and module wiring | ✅ | 2026-06-28T17:43:05Z |
| TASK-007 | Run generated app bootstrap: `nx run conformance-app:start` starts successfully without errors | ✅ | 2026-06-28T18:06:19Z |
| TASK-008 | Defer initial end-to-end bootstrap/CLI test to Phase 6 while prioritizing generator-module conversion per user direction | ✅ | 2026-06-28T18:06:40Z |

### Implementation Phase 2: Migrate Generator Logic

**GOAL-PHASE-2**: Move existing generator implementations from `tools/conformance/src/generators/` into `tools/conformance-app/src/commands/generators/`, converting each into a NestJS command module.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-009 | Analyze existing generator factory functions in `tools/conformance/src/generators/*/generator.ts` to identify core logic vs. scaffolding | ✅ | 2026-06-28T18:07:20Z |
| TASK-010 | Scaffold `react-component` generator module with `nx generate conformance:nestjs-command-module --name=reactComponentGenerator --project=conformance-app` | ✅ | 2026-06-28T18:07:45Z |
| TASK-011 | Migrate `react-component` generator logic into scaffolded module and adapt command/options | ✅ | 2026-06-28T18:08:40Z |
| TASK-012 | Scaffold and migrate `nestjs-service-module` generator module using `nestjs-command-module` | ✅ | 2026-06-28T18:10:00Z |
| TASK-013 | Scaffold and migrate `nestjs-graphql-module` generator module using `nestjs-command-module` | ✅ | 2026-06-28T18:11:10Z |
| TASK-014 | Scaffold and migrate `nestjs-command-application` generator module using `nestjs-command-module` | ✅ | 2026-06-29T00:49:50Z |
| TASK-015 | Scaffold and migrate `nestjs-graphql-application` generator module using `nestjs-command-module` | ✅ | 2026-06-29T00:50:30Z |
| TASK-016 | Scaffold and migrate `nestjs-command-module` generator module using `nestjs-command-module` | ✅ | 2026-06-29T00:51:10Z |
| TASK-017 | Scaffold and migrate `nestjs-dataloader-module` generator module using `nestjs-command-module` | ✅ | 2026-06-29T00:51:55Z |
| TASK-018 | Scaffold and migrate `nestjs-service-file` generator module using `nestjs-command-module` | ✅ | 2026-06-29T00:52:40Z |
| TASK-019 | Scaffold and migrate `jupyter-notebook-application` generator module using `nestjs-command-module` | ✅ | 2026-06-29T00:53:20Z |
| TASK-020 | Scaffold and migrate shared generator orchestration module (index/registry wiring) using `nestjs-command-module` where applicable | ✅ | 2026-06-29T00:54:10Z |
| TASK-021 | Create/update `tools/conformance-app/src/commands/generators/generators.module.ts` that imports all 9 generator modules | ✅ | 2026-06-29T00:55:00Z |
| TASK-022 | Verify all 9 scaffolded generator modules compile, typecheck, and expose expected command interfaces in conformance-app | ✅ | 2026-06-29T00:57:40Z |

### Implementation Phase 3: Migrate Validation Logic

**GOAL-PHASE-3**: Move existing validation logic from `tools/conformance/src/validators/` into `tools/conformance-app/src/commands/validation/` as a NestJS command module.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-023 | Analyze existing validators in `tools/conformance/src/validators/` (TypeScript validators, markdown validators, structure) | ✅ | 2026-06-29T01:54:36Z |
| TASK-024 | Create `tools/conformance-app/src/commands/validation/validation.constants.ts` with validation rules and severity levels | ✅ | 2026-06-29T02:09:15Z |
| TASK-025 | Create `tools/conformance-app/src/commands/validation/validation.types.ts` with ValidationRequest, ValidationResult types | ✅ | 2026-06-29T02:09:15Z |
| TASK-026 | Create `tools/conformance-app/src/commands/validation/validation.service.ts` that orchestrates all validators | ✅ | 2026-06-29T02:09:15Z |
| TASK-027 | Create `tools/conformance-app/src/commands/validation/validation.command.service.ts` with `@Command('validate')` decorator and CLI flags | ✅ | 2026-06-29T02:09:15Z |
| TASK-028 | Create `tools/conformance-app/src/commands/validation/validation.module.ts` that exports validation command | ✅ | 2026-06-29T02:09:15Z |
| TASK-029 | Create unit tests: `validation.service.unit.test.ts` | ✅ | 2026-06-29T02:09:15Z |
| TASK-030 | Create unit tests: `validation.command.service.unit.test.ts` | ✅ | 2026-06-29T02:09:15Z |
| TASK-031 | Create `tools/conformance-app/src/commands/validation/index.ts` re-exporting validation services | ✅ | 2026-06-29T02:09:15Z |

### Implementation Phase 4: Integrate Modules & Update Root App

**GOAL-PHASE-4**: Import all generator and validation modules into the root conformance-app module and update entry points.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-032 | Update `tools/conformance-app/src/modules/conformance-app/conformance-app.module.ts` to import `GeneratorsModule` and `ValidationModule` | ✅ | 2026-06-29T02:16:52Z |
| TASK-033 | Update `tools/conformance-app/src/main.ts` to ensure proper CLI command routing via `nest-commander` | ✅ | 2026-06-29T02:16:52Z |
| TASK-034 | Add logger configuration to root module (structured JSON logging) | ✅ | 2026-06-29T02:16:52Z |
| TASK-035 | Create/update `tools/conformance-app/src/repl.ts` for optional interactive REPL mode | ✅ | 2026-06-29T02:16:52Z |
| TASK-036 | Verify NestJS bootstrap: `nx run conformance-app:start` starts and accepts CLI commands | ✅ | 2026-06-29T02:16:52Z |
| TASK-037 | Update `tools/conformance-app/project.json`: add/verify `start`, `validate` targets | ✅ | 2026-06-29T02:16:52Z |

### Implementation Phase 5: Bridge Tools/Conformance to Applications/Conformance-App

**GOAL-PHASE-5**: Keep `tools/conformance` as a thin Nx plugin layer that bridges to `tools/conformance-app` for backward compatibility.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-038 | Update `tools/conformance/generators.json` factory paths to point to command service factories in `tools/conformance-app` OR create proxy wrappers | ✅ | 2026-06-29T03:02:25Z |
| TASK-039 | Create wrapper functions in `tools/conformance/src/generators/*/generator.ts` that delegate to conformance-app command services | ✅ | 2026-06-29T03:02:25Z |
| TASK-040 | Verify `nx generate conformance:react-component --name=Test --project=lexico-components` still works (backward compat) | ✅ | 2026-06-29T02:36:33Z |
| TASK-041 | Verify `nx generate conformance:nestjs-service-module --name=test --project=lexico-ingestion` still works | ✅ | 2026-06-29T02:36:33Z |
| TASK-042 | Verify `nx generate conformance:nestjs-graphql-module --name=test` still works | ✅ | 2026-06-29T02:36:33Z |
| TASK-043 | Verify all 9 generators work via `nx generate conformance:*` interface with no end-user-facing changes | ✅ | 2026-06-29T02:36:33Z |

### Implementation Phase 6: Test All Generators & Validation

**GOAL-PHASE-6**: Comprehensive testing: all generators produce correct output, validation runs successfully, conformance-app passes validation.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-044 | Run full test suite: `nx run conformance-app:test` passes all tests (unit + integration) | ✅ | 2026-06-29T03:16:16Z |
| TASK-045 | Manual test: Generate React component, verify files match pre-refactor output | ✅ | 2026-06-29T03:18:12Z |
| TASK-046 | Manual test: Generate NestJS service module, verify files match pre-refactor output | ✅ | 2026-06-29T03:18:46Z |
| TASK-047 | Manual test: Generate NestJS GraphQL module, verify files match pre-refactor output | ✅ | 2026-06-29T03:19:17Z |
| TASK-048 | Manual test: `nx run conformance-app:validate` runs without error and outputs JSON results | ✅ | 2026-06-29T03:19:46Z |
| TASK-049 | Manual test: `nx run conformance:validate --projects=conformance-app` verifies conformance-app passes validation as `nestjs-command-application` | | |
| TASK-050 | Regression test: Compare pre/post generator output on 3+ real projects (lexico-components, lexico-ingestion, etc.) | | |
| TASK-051 | Linting & formatting: `nx run conformance-app:lint --configuration=check` passes | | |
| TASK-052 | Type checking: `nx run conformance-app:typecheck` passes with strict mode | | |
| TASK-053 | Dependency cruising: `nx run conformance-app:dependency-cruiser` shows no unexpected dependencies | | |

### Implementation Phase 7: Documentation & Cleanup

**GOAL-PHASE-7**: Update documentation, AGENTS.md files, and ensure project structure is clean.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-054 | Update `tools/conformance/AGENTS.md` to note that command-app logic is staged in `tools/conformance-app` before final replacement | | |
| TASK-055 | Create `tools/conformance-app/AGENTS.md` documenting command modules, new validation command, architecture | | |
| TASK-056 | Update `tools/conformance/README.md`: clarify that generators proxy to conformance-app | | |
| TASK-057 | Create `tools/conformance-app/README.md` documenting full architecture, usage, command modules | | |
| TASK-058 | Add JSDoc comments to all public services and command classes in conformance-app | | |
| TASK-059 | Create `tools/conformance-app/MIGRATION.md` documenting the refactoring (internal reference) | | |

### Implementation Phase 8: Final Validation & Cleanup

**GOAL-PHASE-8**: Final acceptance criteria verification and cleanup of any temporary files.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-060 | **ACCEPTANCE-001**: Verify ALL 9 generators work via `nx generate conformance:*` with identical output to pre-refactor | | |
| TASK-061 | **ACCEPTANCE-002**: Verify validation works via `nx run conformance-app:validate --projects=<targets>` before final rename | | |
| TASK-062 | **ACCEPTANCE-003**: Verify `nx run conformance:validate --projects=conformance-app` shows conformance-app PASSES validation as `nestjs-command-application` before final rename | | |
| TASK-063 | Rename `tools/conformance-app` to `tools/conformance` and replace the existing `tools/conformance` project after migration parity is confirmed | | |
| TASK-064 | Update workspace/project naming and references so the new command app is the canonical `conformance` project, then run full tests | | |
| TASK-065 | Final full lint/analyze run on the replaced `conformance` project and clean up temporary migration artifacts | | |

## 3. Alternatives

- **ALT-001**: Manually create all NestJS structure from scratch (no generator). Rejected because it duplicates work already done by `nestjs-command-application` generator; using the generator ensures conformance-app automatically follows the pattern and can validate itself.
- **ALT-002**: Keep conformance in `tools/` as a library and add NestJS app wrapper. Rejected because it requires maintaining dual interfaces; moving app logic to `tools/conformance-app` is cleaner while keeping `tools/conformance` as thin plugin layer.
- **ALT-003**: Remove generators entirely from Nx plugin interface and only expose via CLI commands. Rejected because it breaks backward compatibility; users currently use `nx generate conformance:*` heavily.
- **ALT-004**: Implement validation as a GraphQL query service instead of CLI commands. Rejected because conformance is a development tool, not a deployed service; CLI is the appropriate interface.

## 4. Dependencies

- **DEP-001**: `@nestjs/core` (already available in monorepo)
- **DEP-002**: `@nestjs/common` (already available in monorepo)
- **DEP-003**: `nest-commander` (must be added to `tools/conformance/package.json` if not already present)
- **DEP-004**: `@nx/devkit` (already available for generator logic)
- **DEP-005**: All existing validator dependencies (TypeScript compiler, markdown parsers, etc.) already in use
- **DEP-006**: Existing test framework (`vitest`, `@testing-library`) unchanged

## 5. Files

### Generated Files (via `nestjs-command-application` generator)

These files are automatically created by running `nx generate conformance:nestjs-command-application --name=conformance-app`:

- **FILE-001**: `tools/conformance-app/src/main.ts` — NestJS app bootstrap
- **FILE-002**: `tools/conformance-app/src/modules/conformance-app/conformance-app.module.ts` — Root AppModule
- **FILE-003**: `tools/conformance-app/src/conformance-app.constants.ts` — App constants
- **FILE-004**: `tools/conformance-app/src/conformance-app.types.ts` — Shared types
- **FILE-005**: `tools/conformance-app/src/modules/logger/logger.module.ts` — Supporting logger module generated with app scaffold
- **FILE-006**: `tools/conformance-app/project.json` — Project configuration
- **FILE-007**: `tools/conformance-app/package.json` — Dependencies
- **FILE-008**: `tools/conformance-app/tsconfig.json` — TypeScript configuration
- **FILE-009**: `tools/conformance-app/testing/` — Testing setup (auto-generated)
- **FILE-010**: `tools/conformance-app/.env.default` — Environment template

### New Files to Create (Generators)

- **FILE-011** through **FILE-060**: 50 files for 9 generator command modules scaffolded with `nestjs-command-module` (each: command, module, types, constants, unit test)
  - `tools/conformance-app/src/commands/generators/react-component/react-component.command.service.ts`
  - `tools/conformance-app/src/commands/generators/react-component/react-component.module.ts`
  - `tools/conformance-app/src/commands/generators/react-component/react-component.types.ts`
  - `tools/conformance-app/src/commands/generators/react-component/react-component.constants.ts`
  - `tools/conformance-app/src/commands/generators/react-component/react-component.command.service.unit.test.ts`
  - (repeat for 8 other generators: nestjs-service-module, nestjs-graphql-module, nestjs-command-application, nestjs-graphql-application, nestjs-command-module, nestjs-dataloader-module, nestjs-service-file, jupyter-notebook-application)

- **FILE-061**: `tools/conformance-app/src/commands/generators/index.ts`
- **FILE-062**: `tools/conformance-app/src/commands/generators/generators.module.ts`

### New Files to Create (Validation)

- **FILE-063**: `tools/conformance-app/src/commands/validation/validation.constants.ts`
- **FILE-064**: `tools/conformance-app/src/commands/validation/validation.types.ts`
- **FILE-065**: `tools/conformance-app/src/commands/validation/validation.service.ts`
- **FILE-066**: `tools/conformance-app/src/commands/validation/validation.command.service.ts`
- **FILE-067**: `tools/conformance-app/src/commands/validation/validation.module.ts`
- **FILE-068**: `tools/conformance-app/src/commands/validation/validation.service.unit.test.ts`
- **FILE-069**: `tools/conformance-app/src/commands/validation/validation.command.service.unit.test.ts`
- **FILE-070**: `tools/conformance-app/src/commands/validation/index.ts`

### Optional New Files

- **FILE-071**: `tools/conformance-app/src/repl.ts` — Interactive REPL mode
- **FILE-072**: `tools/conformance-app/src/conformance-app.end-to-end.test.ts` — Bootstrap tests
- **FILE-073**: `tools/conformance-app/AGENTS.md` — Architecture documentation
- **FILE-074**: `tools/conformance-app/README.md` — Usage documentation
- **FILE-075**: `tools/conformance-app/MIGRATION.md` — Internal refactoring notes

### Modified Files (Bridging)

- **FILE-076**: `tools/conformance/generators.json` — Update factory paths to command services in conformance-app (or keep as-is if wrapping works)
- **FILE-077**: `tools/conformance/src/generators/*/generator.ts` — Create wrapper functions that delegate to conformance-app services
- **FILE-078**: `tools/conformance/AGENTS.md` — Document that app logic moved to tools/conformance-app
- **FILE-079**: `tools/conformance/README.md` — Update architecture overview
- **FILE-080**: `tools/conformance/package.json` — May need to add conformance-app as internal dependency for bridging (if needed)

### Files to Reorganize

- **FILE-081**: `tools/conformance/src/validators/` — Keep as-is, import into `tools/conformance-app/src/commands/validation/validation.service.ts`
- **FILE-082**: `tools/conformance/src/generators/*/templates/` — Keep in tools/conformance (templates don't move)

## 6. Testing

### Acceptance Criteria (Must Pass)

- **TEST-ACCEPTANCE-001**: All 9 generators work via `nx generate conformance:*` interface with identical output to pre-refactor version
  - Test each: `nx generate conformance:react-component`, `nestjs-service-module`, `nestjs-graphql-module`, `nestjs-command-application`, `nestjs-graphql-application`, `nestjs-command-module`, `nestjs-dataloader-module`, `nestjs-service-file`, `jupyter-notebook-application`
  - Verify generated files match pre-refactor output (content, naming, structure)

- **TEST-ACCEPTANCE-002**: Validation runs successfully and produces correct results
  - Test: `nx run conformance-app:validate --projects=lexico-components,lexico-ingestion`
  - Verify: Command returns JSON output with validation results (pass/fail per rule)
  - Verify: Non-zero exit code on validation failure

- **TEST-ACCEPTANCE-003**: Conformance-app itself passes validation as a `nestjs-command-application`
  - Test: `nx run conformance:validate --projects=conformance-app`
  - Verify: All validation checks for `nestjs-command-application` structure pass
  - Verify: Output shows conformance-app complies with command app conventions

### Unit Tests

- **TEST-001**: Unit tests for each generator command service: verify command receives correct arguments, generates correct files
- **TEST-002**: Unit tests for validation service: verify each validation rule executes, returns correct results
- **TEST-003**: Unit tests for validation command service: verify CLI flags parsed correctly, validation orchestrated

### Integration Tests

- **TEST-004**: Integration test: `nx generate conformance:react-component --name=Test --project=lexico-components` produces expected files
- **TEST-005**: Integration test: `nx run conformance-app:validate --projects=lexico-components` runs without error and outputs JSON results
- **TEST-006**: End-to-end test: full NestJS app bootstraps, serves, accepts commands via CLI

### Regression & Conformance Tests

- **TEST-007**: Regression test: compare pre/post generator output on 3+ real projects (identical structure and content)
- **TEST-008**: CLI flag parsing test: validation command respects `--projects`, `--rules`, `--report-format` flags
- **TEST-009**: Error handling test: validation command returns non-zero exit code on validation failure
- **TEST-010**: Dependency injection test: all services can be injected via constructor, no circular dependencies
- **TEST-011**: Conformance self-validation: `nx run conformance:validate --projects=conformance-app` passes all `nestjs-command-application` checks
- **TEST-012**: For each generator module, verify scaffolding source is `nestjs-command-module` output and module files retain expected command-module contract

## 7. Risks & Assumptions

### Risks

- **RISK-001**: Generator factory functions may have side effects or dependencies not visible in code—could break during migration
  - *Mitigation*: Comprehensive regression testing comparing pre/post generator output on multiple projects; test immediately after each generator migration

- **RISK-002**: Nx generator plugin interface expects factory function at specific path in `generators.json`; if path breaks, `nx generate conformance:*` fails
  - *Mitigation*: Test each generator immediately after updating generators.json factory path; use wrapper functions if direct bridging doesn't work

- **RISK-003**: Generated conformance-app structure from `nestjs-command-application` generator may not perfectly align with validation rules
  - *Mitigation*: Run validation immediately after scaffold generation (TASK-004); if validation fails, adjust either the app structure or validation rules as needed

- **RISK-004**: NestJS app bootstrap could introduce startup time overhead; developers expect fast `nx generate` commands
  - *Mitigation*: Profile app startup in Phase 6; keep bootstrap minimal; only start NestJS for validate command, not for generator bridge

- **RISK-005**: Changes to conformance project structure could affect other tools/configs that depend on it
  - *Mitigation*: Audit all references to conformance in nx.json, other project.json files, and CI workflows before deploying; test full build in Phase 6

- **RISK-006**: Validator imports from `tools/conformance/src/validators/` into `tools/conformance-app/` may require path mapping or build configuration updates
  - *Mitigation*: Test validator service imports during Phase 3; adjust tsconfig paths if needed; verify build succeeds
- **RISK-007**: `nestjs-command-module` scaffolding may need post-generation normalization to match generator-specific naming and option contracts
  - *Mitigation*: Add a standard post-scaffold adaptation checklist per module (rename command class, command name, options, and tests) and enforce with unit tests

### Assumptions

- **ASSUMPTION-001**: `nx generate conformance:nestjs-command-application --name=conformance-app` will create an app in `tools/conformance-app/` with proper NestJS structure
- **ASSUMPTION-002**: Generated conformance-app will pass validation as a `nestjs-command-application` without modifications (or with minimal structural adjustments)
- **ASSUMPTION-003**: Existing generator factory functions can be extracted and wrapped in NestJS command services without modifying business logic
- **ASSUMPTION-004**: Existing validators are pure functions or have injectable dependencies; can be used within NestJS services
- **ASSUMPTION-005**: Users will continue to invoke generators via `nx generate conformance:*` (CLI interface preserved via bridging)
- **ASSUMPTION-006**: `nest-commander` version compatible with current NestJS/Node/TypeScript versions in monorepo
- **ASSUMPTION-007**: Conformance will not need to expose generators as shared library exports after refactor (internal use only, bridged through tools/conformance)

## 8. Related Specifications / Further Reading

- [Lexico-Ingestion AGENTS.md](../../applications/lexico-ingestion/AGENTS.md) — Reference implementation of NestJS command application
- [Caelundas AGENTS.md](../../applications/caelundas/AGENTS.md) — Alternative CLI command app pattern (Node.js, not NestJS)
- [Code Generator Patterns Skill](../../.agents/skills/code-generator-patterns/SKILL.md) — Nx generator conventions used in existing conformance generators
- [NestJS Documentation](https://docs.nestjs.com/) — Framework reference
- [nest-commander Package](https://www.npmjs.com/package/nest-commander) — CLI command handling library
- [Nx Generators Guide](https://nx.dev/extending-nx/intro/getting-started) — Nx generator plugin architecture
- [Monorepo Conventions](../../documentation/conventions/) — TypeScript, imports, testing conventions to follow
