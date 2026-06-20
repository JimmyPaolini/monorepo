---
name: Lexico Entities Entity Definition Testing Plan
description: Add comprehensive src-level unit and integration tests for all lexico-entities entity definitions using TypeORM metadata and database-backed schema validation.
created: 2026-06-19T13:55:37Z
updated: 2026-06-19T15:18:19Z
status: 'In progress'
---

# Introduction

![Status: In progress](https://img.shields.io/badge/status-In%20progress-yellow)

This plan defines a complete, machine-executable approach for testing every entity definition in lexico-entities. The implementation is limited to files under packages/lexico-entities/src and introduces two test layers: unit tests that validate decorator and metadata contracts for all entities, and integration tests that validate those definitions against a real PostgreSQL-backed TypeORM DataSource.

## 1. Requirements & Constraints

- **REQ-001**: Implement tests only in packages/lexico-entities/src. No non-src file modifications are in scope unless test execution is blocked.
- **REQ-002**: Add both unit tests (*.unit.test.ts) and integration tests (*.integration.test.ts) following monorepo naming conventions.
- **REQ-003**: Achieve comprehensive coverage for every entity exported through LEXICO_DATABASE_ENTITIES in packages/lexico-entities/src/modules/database/data-source.ts.
- **REQ-004**: Validate entity-definition contracts, including table metadata, primary keys, column options, relation mappings, indexes, uniqueness constraints, and inheritance discriminators where applicable.
- **REQ-005**: Validate schema compatibility by initializing a PostgreSQL TypeORM DataSource and synchronizing metadata during integration tests.
- **SEC-001**: Integration tests must use non-production database credentials and must not connect to production endpoints.
- **SEC-002**: Integration tests must isolate test data and ensure schema cleanup after each test run.
- **QLT-001**: Use explicit assertions that fail when an entity is added to LEXICO_DATABASE_ENTITIES without corresponding test expectations.
- **QLT-002**: Preserve strict TypeScript typing with no any and no non-null assertions in new tests.
- **CON-001**: The plan must avoid project.json changes unless missing/invalid test execution wiring blocks src test implementation.
- **CON-002**: Existing migration-command path inconsistencies in packages/lexico-entities/project.json are out of scope unless they directly block these tests.
- **GUD-001**: Reuse centralized entity registration from LEXICO_DATABASE_ENTITIES as the source of truth.
- **GUD-002**: Follow existing Nest/TypeORM testing patterns in the monorepo while keeping tests focused on entity definition behavior.
- **PAT-001**: Use metadata introspection for unit validation and real DataSource lifecycle for integration validation.
- **PAT-002**: Use guard assertions that compare expected entity name coverage to actual LEXICO_DATABASE_ENTITIES contents.

## 2. Implementation Steps

### Implementation Phase 1

- GOAL-001: Implement exhaustive unit-level entity-definition contract tests for all entities in lexico-entities.

| Task | Description | Completed | Date |
| -------- | --------------------- | --------- | ---- |
| TASK-001 | Create packages/lexico-entities/src/modules/entities/entities-definition.unit.test.ts with a canonical ENTITY_EXPECTATIONS map keyed by entity class name covering every entry in LEXICO_DATABASE_ENTITIES. | ✅ | 2026-06-19T14:10:07Z |
| TASK-002 | Add a coverage guard test in entities-definition.unit.test.ts that asserts Object.keys(ENTITY_EXPECTATIONS) exactly matches LEXICO_DATABASE_ENTITIES.map(entityClass => entityClass.name).sort(). | ✅ | 2026-06-19T14:11:59Z |
| TASK-003 | Add metadata tests in entities-definition.unit.test.ts using TypeORM metadata APIs (getMetadataArgsStorage or DataSource metadata) to verify for each entity: table name, primary key strategy, nullable constraints, enum column definitions, and index/unique metadata. | ✅ | 2026-06-19T14:20:04Z |
| TASK-004 | Add relation contract tests in entities-definition.unit.test.ts validating relation kind (one-to-many, many-to-one, one-to-one, many-to-many), inverse side, and onDelete/onUpdate behavior for all relation-bearing entities. | ✅ | 2026-06-19T14:40:10Z |
| TASK-005 | Add inheritance/discriminator tests in entities-definition.unit.test.ts for entities using TableInheritance or child-entity patterns (for example form and inflection hierarchies) to verify discriminator column names and values. | ✅ | 2026-06-19T14:45:32Z |
| TASK-006 | Add shared helper functions in packages/lexico-entities/src/modules/entities/testing/entity-definition-assertions.ts to keep per-entity assertions deterministic, typed, and reusable without introducing external dependencies. | ✅ | 2026-06-19T14:07:12Z |

### Implementation Phase 2

- GOAL-002: Implement exhaustive integration tests that validate entity metadata against a real PostgreSQL schema lifecycle.

| Task | Description | Completed | Date |
| -------- | --------------------- | --------- | ---- |
| TASK-007 | Create packages/lexico-entities/src/modules/entities/entities-definition.integration.test.ts that builds a dedicated TypeORM DataSource using LEXICO_DATABASE_ENTITIES and test-only PostgreSQL connection parameters loaded from environment variables. | ✅ | 2026-06-19T15:18:19Z |
| TASK-008 | Add integration setup/teardown in entities-definition.integration.test.ts: initialize DataSource before all tests, synchronize schema, and destroy DataSource after all tests with explicit error handling and cleanup. | ✅ | 2026-06-19T15:18:19Z |
| TASK-009 | Add schema existence tests in entities-definition.integration.test.ts asserting that every entity in LEXICO_DATABASE_ENTITIES produces an expected table in the connected test schema. | ✅ | 2026-06-19T15:18:19Z |
| TASK-010 | Add constraint validation tests in entities-definition.integration.test.ts asserting indexes and unique constraints exist for representative columns per entity expectation set, including junction and relation tables. | ✅ | 2026-06-19T15:18:19Z |
| TASK-011 | Add integration coverage guard in entities-definition.integration.test.ts asserting all entities are accounted for in integration expectation definitions (same key set rule as unit tests). | ✅ | 2026-06-19T15:18:19Z |
| TASK-012 | If integration tests cannot be executed through existing inferred targets, add minimal src-local runner bootstrap file at packages/lexico-entities/src/modules/entities/testing/integration-test-data-source.ts and defer project.json target edits to follow-up unless strictly blocking execution. | ✅ | 2026-06-19T15:18:19Z |

### Implementation Phase 3

- GOAL-003: Validate the new tests end-to-end and document execution boundaries for src-only scope.

| Task | Description | Completed | Date |
| -------- | --------------------- | --------- | ---- |
| TASK-013 | Execute unit tests for lexico-entities via Nx test unit target (or inferred equivalent) and fix failing assertions until stable. |  |  |
| TASK-014 | Execute integration tests for lexico-entities against local test PostgreSQL and confirm deterministic pass/fail behavior without cross-test contamination. |  |  |
| TASK-015 | Run lexico-entities analyze-code write/check workflow and resolve lint/typecheck issues introduced by new src tests. | ✅ | 2026-06-19T15:06:15Z |
| TASK-016 | Record any blocked item requiring non-src changes (for example project target wiring) as a follow-up issue rather than expanding scope silently. |  |  |

## 3. Alternatives

- **ALT-001**: Unit tests only (metadata introspection without integration schema checks). Not chosen because it cannot prove generated schema compatibility or relational constraint realization.
- **ALT-002**: Integration tests only (database-level assertions without granular metadata unit checks). Not chosen because root-cause diagnosis becomes slower and regressions in decorator-level intent are harder to localize.
- **ALT-003**: Per-entity isolated test files. Not chosen because maintenance overhead is high; a centralized expectation matrix with guard assertions better enforces complete coverage when new entities are added.
- **ALT-004**: Introduce Testcontainers-based PostgreSQL integration harness. Deferred because the current scope is src-only and container orchestration likely requires non-src dependency/config updates.

## 4. Dependencies

- **DEP-001**: TypeORM entity metadata APIs and DataSource lifecycle utilities already present in lexico-entities runtime dependencies.
- **DEP-002**: Existing entity registry constant LEXICO_DATABASE_ENTITIES in packages/lexico-entities/src/modules/database/data-source.ts.
- **DEP-003**: Existing PostgreSQL test environment availability in local/CI execution context for integration tests.
- **DEP-004**: Nx test execution path (explicit target or inferred target) for packages/lexico-entities.

## 5. Files

- **FILE-001**: packages/lexico-entities/src/modules/entities/entities-definition.unit.test.ts — new exhaustive unit metadata contract suite.
- **FILE-002**: packages/lexico-entities/src/modules/entities/entities-definition.integration.test.ts — new exhaustive PostgreSQL-backed integration schema suite.
- **FILE-003**: packages/lexico-entities/src/modules/entities/testing/entity-definition-assertions.ts — reusable typed assertion helpers for entity contracts.
- **FILE-004**: packages/lexico-entities/src/modules/entities/testing/integration-test-data-source.ts — optional integration DataSource factory if needed to keep test setup deterministic within src scope.

## 6. Testing

- **TEST-001**: Unit test validates that every entity in LEXICO_DATABASE_ENTITIES has a matching expectation entry and metadata assertions.
- **TEST-002**: Unit test validates column-level constraints (nullable/default/enum/type/primary generation) for every entity.
- **TEST-003**: Unit test validates index and unique decorator metadata for every indexed entity.
- **TEST-004**: Unit test validates inheritance and discriminator mappings for hierarchy-based entities.
- **TEST-005**: Integration test initializes a real PostgreSQL DataSource and synchronizes all entities without metadata errors.
- **TEST-006**: Integration test verifies table creation for all entities and junction tables expected from relation mappings.
- **TEST-007**: Integration test verifies selected unique/index constraints are materialized in the database schema.
- **TEST-008**: Integration test verifies cleanup and teardown completeness (no hanging connections, repeatable runs).

## 7. Risks & Assumptions

- **RISK-001**: Integration tests may fail in environments without an available PostgreSQL test database.
- **RISK-002**: Comprehensive assertions can become brittle if entity metadata intentionally changes without synchronized updates to expectation matrices.
- **RISK-003**: Existing inferred Nx test behavior for lexico-entities may not expose separate unit/integration execution patterns.
- **RISK-004**: Schema synchronization for all entities may increase integration test runtime.
- **ASSUMPTION-001**: LEXICO_DATABASE_ENTITIES is the authoritative and complete list of entities that must be covered.
- **ASSUMPTION-002**: src-only implementation is sufficient to add and execute tests in current workspace tooling.
- **ASSUMPTION-003**: Existing local/CI environment supports non-production PostgreSQL credentials for test execution.
- **ASSUMPTION-004**: Migration path inconsistency in project.json does not block entity-definition test execution; if it does, it becomes explicit follow-up work.

## 8. Related Specifications / Further Reading

- AGENTS workspace instructions: AGENTS.md
- Monorepo testing guidance: documentation/code-quality/testing-strategy.md
- Existing adjacent plan: documentation/planning/2026-06-15T00:00:00Z-refactor-monorepo-lint-remediation.plan.md
- lexico-entities project config: packages/lexico-entities/project.json
- Canonical entity registry: packages/lexico-entities/src/modules/database/data-source.ts
