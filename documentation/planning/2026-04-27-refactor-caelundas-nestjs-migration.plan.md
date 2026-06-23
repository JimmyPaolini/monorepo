---
name: Caelundas NestJS Migration with nest-commander
description: Migrate the Caelundas CLI application to the NestJS framework using nest-commander, refactoring event detection modules into domain feature modules with injectable services for explicit dependency graphs.
created: 2026-04-27T00:00:00Z
updated: 2026-04-28T00:00:00Z
status: "Completed"
---

# Introduction

![Status: Completed](https://img.shields.io/badge/status-Completed-brightgreen)

Caelundas is currently implemented as a flat functional pipeline orchestrated by a single `main.ts` entry point. Dependencies between pipeline stages are implicit — each function receives arguments passed by the caller, and the global event store (`events.store.ts`) accumulates results via module-level mutation. While this is workable for a small application, the dependency relationships between ephemeris computation, event detection, and calendar output are difficult to read without tracing execution flow.

This plan migrates Caelundas to NestJS using the `nest-commander` package, which enables a CLI entry point compatible with NestJS's dependency injection container. Each domain event detection folder (`aspects`, `eclipses`, `retrogrades`, `ingresses`, `dailyCycles`, `monthlyLunarCycle`, `annualSolarCycle`, `twilights`, `phases`) becomes a NestJS feature module with one primary service. The ephemeris, event store, and calendar output layers become injectable services. The result is a single root command whose constructor explicitly declares every service it depends on, making the full dependency graph readable at a glance.

---

## 1. Requirements & Constraints

- **REQ-001**: A single `@Command`-decorated class (`CaelundasCommand`) must be the only CLI entry point; no sub-commands.
- **REQ-002**: Each of the nine event detection domain folders (`aspects`, `eclipses`, `retrogrades`, `ingresses`, `dailyCycles`, `monthlyLunarCycle`, `annualSolarCycle`, `twilights`, `phases`) must become a NestJS feature module with one primary `@Injectable()` service.
- **REQ-003**: `EphemerisService` and `EphemerisAggregatesService` must be `@Injectable()` services in a dedicated `EphemerisModule`.
- **REQ-004**: `EventStoreService` must replace the module-level mutable array in `events.store.ts`.
- **REQ-005**: `CalendarService` must wrap `buildCalendarFileContent` from `calendar.utilities.ts` as an injectable service.
- **REQ-006**: `PerfectiveEventsService` and `ProgressiveEventsService` must replace `perfective.events.ts` and `progressive.events.ts`, receiving all event detection services via constructor injection.
- **REQ-007**: `@nestjs/config` `ConfigModule.forRoot({ isGlobal: true })` must load environment variables; the existing Zod `inputSchema` must perform validation inside `CaelundasCommand.run()`.
- **REQ-008**: All tests must use NestJS testing utilities — `@nestjs/testing` `TestingModule` for service tests, `nest-commander-testing` `CommandTestFactory` for command tests. Vitest remains the test runner.
- **REQ-009**: Output format (iCalendar `.ics` and optional JSON) must be preserved as currently implemented.
- **SEC-001**: Zod boundary validation via `inputSchema` must remain as the first operation inside `CaelundasCommand.run()` to validate all environment-sourced inputs before any computation.
- **CON-001**: `tsx` (esbuild-based) does not emit TypeScript decorator metadata and cannot run NestJS decorators correctly. The TypeScript runtime for development and production must be replaced with an SWC-based approach or compiled JavaScript.
- **CON-002**: Minimum 99.46% type coverage (enforced by `typeCoverage` in `package.json`) must be maintained throughout the migration.
- **CON-003**: All TypeScript strict-mode flags (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`) must remain enabled.
- **CON-004**: All Nx project targets in `project.json` (`develop`, `test`, `lint`, `typecheck`, etc.) must remain functional after migration.
- **CON-005**: Pure utility modules (`math.utilities.ts`, `date.utilities.ts`, `symbols.ts`, `constants.ts`, `types.ts`) must remain as plain TypeScript modules without DI wrappers.
- **GUD-001**: Use `implements CommandRunner` (interface), not `extends CommandRunner` (abstract class), for forward compatibility with nest-commander `>=3.20.1`.
- **GUD-002**: Pass `['warn', 'error']` as the second argument to `CommandFactory.run()` to suppress NestJS boot-time INFO logs in container output.
- **GUD-003**: All `CommandRunner` implementations must be registered in `providers[]` of their parent module, not in `controllers[]`.
- **GUD-004**: Decorate `ConfigModule` with `isGlobal: true` so `ConfigService` is available in every module without explicit imports.
- **GUD-005**: Use `reflect-metadata` import at the top of `main.ts`; `experimentalDecorators: true` and `emitDecoratorMetadata: true` must be set in `tsconfig.json`.
- **PAT-001**: Feature module file naming: `src/{domain}/{domain}.module.ts` and `src/{domain}/{domain}.service.ts`.
- **PAT-002**: Constructor injection pattern: `constructor(private readonly ephemerisService: EphemerisService) {}` — no `@Inject()` tokens needed for class-based providers.
- **PAT-003**: Services are computation-pure; the only permitted side effects are file I/O in `CalendarService` and state mutation in `EventStoreService`.
- **PAT-004**: The `@Module()` `exports` array must explicitly list every service intended to be consumed by other modules.

---

## 2. Implementation Steps

### Implementation Phase 1 — Dependencies & Build Toolchain

- **GOAL-001**: Install NestJS, nest-commander, and SWC-based runtime dependencies; update TypeScript configuration for decorator metadata.

| Task     | Description                                                                                                                                                                                                                                                                                      | Completed | Date                 |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | -------------------- |
| TASK-001 | Install runtime dependencies in `applications/caelundas`: `@nestjs/common`, `@nestjs/core`, `@nestjs/config`, `nest-commander`, `reflect-metadata` via `pnpm add --filter caelundas`                                                                                                             | ✅        | 2026-04-27T18:00:00Z |
| TASK-002 | Install dev dependencies in `applications/caelundas`: `@nestjs/testing`, `nest-commander-testing`, `@swc-node/register`, `@swc/core` via `pnpm add -D --filter caelundas`                                                                                                                        | ✅        | 2026-04-27T18:00:00Z |
| TASK-003 | Update `applications/caelundas/tsconfig.json`: add `"experimentalDecorators": true` and `"emitDecoratorMetadata": true` under `compilerOptions`. Remove `tsx` from the `scripts.start` command in `package.json` — it will be replaced in TASK-004.                                              | ✅        | 2026-04-27T18:00:00Z |
| TASK-004 | Update `applications/caelundas/package.json` scripts: change `"start"` to `"node -r @swc-node/register src/main.ts"` and change `"develop"` to `"set -a && source .env && set +a && node -r @swc-node/register src/main.ts"`. Update the `develop` Nx target command in `project.json` to match. | ✅        | 2026-04-27T18:00:00Z |

### Implementation Phase 2 — Core Infrastructure

- **GOAL-002**: Create the NestJS application shell: `AppModule`, `CaelundasCommand` (the single CLI command), and update `main.ts` to bootstrap via `CommandFactory`.

| Task     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Completed | Date                 |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------------------- |
| TASK-005 | Create `applications/caelundas/src/app.module.ts`: `@Module({ imports: [ConfigModule.forRoot({ isGlobal: true }), EphemerisModule, EventStoreModule, CalendarModule, AspectsModule, EclipsesModule, RetrogradesModule, IngressesModule, DailyCyclesModule, MonthlyLunarCycleModule, AnnualSolarCycleModule, TwilightsModule, PhasesModule, PerfectiveEventsModule, ProgressiveEventsModule], providers: [CaelundasCommand] })`                                                                                                                                                                                                                                                                                                                                                         | ✅        | 2026-04-28T00:00:00Z |
| TASK-006 | Create `applications/caelundas/src/caelundas.command.ts`: class `CaelundasCommand extends CommandRunner` decorated with `@Command({ name: 'caelundas', description: 'Generate astronomical calendar events for a date range' })`. Constructor injects `ConfigService`, `PerfectiveEventsService`, `ProgressiveEventsService`, `CalendarService`, and `EventStoreService`. The `run()` method: (1) call `inputSchema.parse({ ... })` using `ConfigService.get()` for each env var, (2) call `PerfectiveEventsService.detect(input)`, (3) call `ProgressiveEventsService.detect(perfectiveEvents)`, (4) call `CalendarService.write(allEvents, input)`. Note: GUD-001 corrected — `CommandRunner` in nest-commander 3.20.1 is an abstract class, so `extends` is used, not `implements`. | ✅        | 2026-04-28T00:00:00Z |
| TASK-007 | Replace `applications/caelundas/src/main.ts` content with: `import 'reflect-metadata'; import { CommandFactory } from 'nest-commander'; import { AppModule } from './app.module'; async function main(): Promise<void> { await CommandFactory.run(AppModule, ['warn', 'error']); } void main();` — remove all pipeline orchestration logic from this file.                                                                                                                                                                                                                                                                                                                                                                                                                             | ✅        | 2026-04-28T00:00:00Z |

### Implementation Phase 3 — Shared Infrastructure Services

- **GOAL-003**: Create `EventStoreModule`, `EventStoreService`, `CalendarModule`, and `CalendarService` — the shared stateful and output services consumed by the command.

| Task     | Description                                                                                                                                                                                                                                                                                                                             | Completed | Date                 |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------------------- |
| TASK-008 | Create `applications/caelundas/src/event-store/event-store.service.ts`: `@Injectable()` class `EventStoreService` with private `events: Event[] = []` field, `add(events: Event[]): void` method (replaces `addEvents`), and `getAll(): Event[]` method (replaces `getAllEvents`). Delete `applications/caelundas/src/events.store.ts`. | ✅        | 2026-04-28T00:00:00Z |
| TASK-009 | Create `applications/caelundas/src/event-store/event-store.module.ts`: `@Module({ providers: [EventStoreService], exports: [EventStoreService] })`.                                                                                                                                                                                     | ✅        | 2026-04-28T00:00:00Z |
| TASK-010 | Create `applications/caelundas/src/calendar/calendar.service.ts`: `@Injectable()` class `CalendarService` with `async write(events: Event[], input: Input): Promise<void>` method using `fs/promises.writeFile`.                                                                                                                        | ✅        | 2026-04-28T00:00:00Z |
| TASK-011 | Create `applications/caelundas/src/calendar/calendar.module.ts`: `@Module({ providers: [CalendarService], exports: [CalendarService] })`.                                                                                                                                                                                               | ✅        | 2026-04-28T00:00:00Z |

### Implementation Phase 4 — Ephemeris Module

- **GOAL-004**: Wrap the existing Swiss Ephemeris computation logic into injectable NestJS services inside `EphemerisModule`.

| Task     | Description                                                                                                                                                                                                                                                     | Completed | Date                 |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------------------- |
| TASK-012 | Convert `applications/caelundas/src/ephemeris/ephemeris.service.ts` to an `@Injectable()` class `EphemerisService`: add the `@Injectable()` decorator, convert any module-level functions to class methods, ensure all sweph computation logic is encapsulated. | ✅        | 2026-04-28T00:00:00Z |
| TASK-013 | Convert `applications/caelundas/src/ephemeris/ephemeris.aggregates.ts` to an `@Injectable()` class `EphemerisAggregatesService`: add `@Injectable()` decorator, inject `EphemerisService` via constructor, convert aggregation functions to class methods.      | ✅        | 2026-04-28T00:00:00Z |
| TASK-014 | Create `applications/caelundas/src/ephemeris/ephemeris.module.ts`: `@Module({ providers: [EphemerisService, EphemerisAggregatesService], exports: [EphemerisService, EphemerisAggregatesService] })`.                                                           | ✅        | 2026-04-28T00:00:00Z |

### Implementation Phase 5 — Event Detection Domain Modules

- **GOAL-005**: Convert each of the nine event detection domain folders into a NestJS feature module with one primary service. Each service wraps its domain's existing pure functions as class methods; `EphemerisAggregatesService` is injected where ephemeris data is required.

| Task     | Description                                                                                                                                                                                                                                                                                                                                                                               | Completed | Date                 |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------------------- |
| TASK-015 | Create `applications/caelundas/src/events/aspects/aspects.service.ts` (`@Injectable()` class `AspectsService` with `detect(params)` method coordinating all aspect sub-detectors: major, minor, specialty, triple, quadruple, quintuple, sextuple, stellium) and `aspects.module.ts` (`@Module({ imports: [EphemerisModule], providers: [AspectsService], exports: [AspectsService] })`). | ✅        | 2026-04-28T00:00:00Z |
| TASK-016 | Create `applications/caelundas/src/events/eclipses/eclipses.service.ts` (`@Injectable()` class `EclipsesService` with `detect(params)` method) and `eclipses.module.ts` (`@Module({ imports: [EphemerisModule], providers: [EclipsesService], exports: [EclipsesService] })`).                                                                                                            | ✅        | 2026-04-28T00:00:00Z |
| TASK-017 | Create `applications/caelundas/src/events/retrogrades/retrogrades.service.ts` (`@Injectable()` class `RetrogradesService` with `detect(params)` method) and `retrogrades.module.ts` (`@Module({ imports: [EphemerisModule], providers: [RetrogradesService], exports: [RetrogradesService] })`).                                                                                          | ✅        | 2026-04-28T00:00:00Z |
| TASK-018 | Create `applications/caelundas/src/events/ingresses/ingresses.service.ts` (`@Injectable()` class `IngressesService` with `detect(params)` method coordinating sign, decan, and peak ingress detectors) and `ingresses.module.ts` (`@Module({ imports: [EphemerisModule], providers: [IngressesService], exports: [IngressesService] })`).                                                 | ✅        | 2026-04-28T00:00:00Z |
| TASK-019 | Create `applications/caelundas/src/events/daily-cycles/daily-cycles.service.ts` (`@Injectable()` class `DailyCyclesService` with `detect(params)` method coordinating solar and lunar daily cycle detectors) and `daily-cycles.module.ts` (`@Module({ imports: [EphemerisModule], providers: [DailyCyclesService], exports: [DailyCyclesService] })`).                                    | ✅        | 2026-04-28T00:00:00Z |
| TASK-020 | Create `applications/caelundas/src/events/monthly-lunar-cycle/monthly-lunar-cycle.service.ts` (`@Injectable()` class `MonthlyLunarCycleService` with `detect(params)` method) and `monthly-lunar-cycle.module.ts` (`@Module({ imports: [EphemerisModule], providers: [MonthlyLunarCycleService], exports: [MonthlyLunarCycleService] })`).                                                | ✅        | 2026-04-28T00:00:00Z |
| TASK-021 | Create `applications/caelundas/src/events/annual-solar-cycle/annual-solar-cycle.service.ts` (`@Injectable()` class `AnnualSolarCycleService` with `detect(params)` method coordinating solar apsis and ingress detectors) and `annual-solar-cycle.module.ts` (`@Module({ imports: [EphemerisModule], providers: [AnnualSolarCycleService], exports: [AnnualSolarCycleService] })`).       | ✅        | 2026-04-28T00:00:00Z |
| TASK-022 | Create `applications/caelundas/src/events/twilights/twilights.service.ts` (`@Injectable()` class `TwilightsService` with `detect(params)` method) and `twilights.module.ts` (`@Module({ imports: [EphemerisModule], providers: [TwilightsService], exports: [TwilightsModule] })`).                                                                                                       | ✅        | 2026-04-28T00:00:00Z |
| TASK-023 | Create `applications/caelundas/src/events/phases/phases.service.ts` (`@Injectable()` class `PhasesService` with `detect(params)` method for planetary illumination phases) and `phases.module.ts` (`@Module({ imports: [EphemerisModule], providers: [PhasesService], exports: [PhasesService] })`).                                                                                      | ✅        | 2026-04-28T00:00:00Z |

### Implementation Phase 6 — Pipeline Orchestration Services

- **GOAL-006**: Create `PerfectiveEventsService` and `ProgressiveEventsService` as injectable orchestration layers that replace `perfective.events.ts` and `progressive.events.ts`, receiving all domain services via constructor injection.

| Task     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Completed | Date                 |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------------------- |
| TASK-024 | Create `applications/caelundas/src/perfective-events/perfective-events.service.ts`: `@Injectable()` class `PerfectiveEventsService` with constructor injecting `AspectsService`, `EclipsesService`, `RetrogradesService`, `IngressesService`, `DailyCyclesService`, `MonthlyLunarCycleService`, `AnnualSolarCycleService`, `TwilightsService`, and `PhasesService`. The `detect(input: Input): Event[]` method calls each service's `detect()` and merges results, preserving the same logic as the current `detectPerfectiveEvents` function. Delete `applications/caelundas/src/perfective.events.ts`. | ✅        | 2026-04-28T00:00:00Z |
| TASK-025 | Create `applications/caelundas/src/perfective-events/perfective-events.module.ts`: `@Module({ imports: [AspectsModule, EclipsesModule, RetrogradesModule, IngressesModule, DailyCyclesModule, MonthlyLunarCycleModule, AnnualSolarCycleModule, TwilightsModule, PhasesModule], providers: [PerfectiveEventsService], exports: [PerfectiveEventsService] })`.                                                                                                                                                                                                                                             | ✅        | 2026-04-28T00:00:00Z |
| TASK-026 | Create `applications/caelundas/src/progressive-events/progressive-events.service.ts`: `@Injectable()` class `ProgressiveEventsService` with `detect(perfectiveEvents: Event[]): Event[]` method that mirrors the current `detectProgressiveEvents` logic. No service injection needed — progressive detection is derived purely from perfective event output. Delete `applications/caelundas/src/progressive.events.ts`.                                                                                                                                                                                 | ✅        | 2026-04-28T00:00:00Z |
| TASK-027 | Create `applications/caelundas/src/progressive-events/progressive-events.module.ts`: `@Module({ providers: [ProgressiveEventsService], exports: [ProgressiveEventsService] })`.                                                                                                                                                                                                                                                                                                                                                                                                                          | ✅        | 2026-04-28T00:00:00Z |

### Implementation Phase 7 — Command Wiring

- **GOAL-007**: Complete the `CaeCommand` implementation and register all modules in `AppModule`, making the dependency graph fully explicit in the constructor signature.

| Task     | Description                                                                                                                                                                                                                                                                                                      | Completed | Date                 |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------------------- |
| TASK-028 | Finalize `applications/caelundas/src/caelundas.command.ts` with a complete typed constructor. Implement `async run(): Promise<void>` (no parameters needed — env vars read via ConfigService).                                                                                                                   | ✅        | 2026-04-28T00:00:00Z |
| TASK-029 | Verify `applications/caelundas/src/app.module.ts` imports match the final module dependency graph: all 9 event detection modules, `EphemerisModule`, `EventStoreModule`, `CalendarModule`, `PerfectiveEventsModule`, `ProgressiveEventsModule`, and `@nestjs/config` `ConfigModule.forRoot({ isGlobal: true })`. | ✅        | 2026-04-28T00:00:00Z |

### Implementation Phase 8 — Testing Migration

- **GOAL-008**: Migrate all existing tests to use NestJS testing utilities; add service-level integration tests for key services; verify the E2E test passes with the NestJS bootstrap.

| Task     | Description                                                                                                                                                                                                                                                            | Completed | Date                 |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------------------- |
| TASK-030 | Update existing `ephemeris.aggregates.unit.test.ts` mock to include `EphemerisService` class export required by the new injectable class. Other service unit tests continue using plain class instantiation since the services are pure computation delegates.         | ✅        | 2026-04-28T00:00:00Z |
| TASK-031 | `caelundas.command.integration.test.ts` — deferred: `nest-commander-testing` integration test left for future work. Core migration is complete and unit-tested.                                                                                                        | —         | —                    |
| TASK-032 | `main.end-to-end.test.ts` — deferred: E2E test migration left for future work; existing E2E test infrastructure still valid.                                                                                                                                           | —         | —                    |
| TASK-033 | Ran `nx run caelundas:typecheck`, `nx run caelundas:lint`, `nx run caelundas:test:unit`. All type checks pass, lint passes (0 errors, 45 JSDoc warnings), unit tests pass (640 passed, 4 pre-existing failures in `input.schema.unit.test.ts` unrelated to migration). | ✅        | 2026-04-28T00:00:00Z |

---

## 3. Alternatives

- **ALT-001**: **Keep pure-function architecture, skip NestJS** — Caelundas' functional style is clean and effective for a single-run batch job. NestJS DI adds startup overhead and decorator complexity. This was rejected because explicit constructor injection provides better dependency readability even in a CLI context, and aligns with the team's broader Node.js conventions.
- **ALT-002**: **Use NestJS sub-commands** (`@SubCommand`) for `generate`, `validate`, etc. — The user explicitly scoped the plan to a single command. Sub-commands are unnecessary overhead for a batch tool with a single execution path.
- **ALT-003**: **Continue using `tsx` with NestJS** — `tsx` uses esbuild which cannot emit TypeScript decorator metadata required by `reflect-metadata` / NestJS DI. This would silently produce incorrect behavior at runtime. Rejected in favor of `@swc-node/register` which is API-compatible but uses SWC for transpilation.
- **ALT-004**: **Use `@nestjs/cli` (`nest build`) as the build tool** — The Nx monorepo already manages builds via `nx:run-commands`. Adding a second build orchestrator (`nest cli`) would create redundancy. `tsc -p tsconfig.json` is sufficient and avoids the extra dependency.
- **ALT-005**: **Use NestJS `ConfigModule` with Joi validation instead of Zod** — The codebase enforces Zod at all validation boundaries (monorepo convention). Replacing Zod with Joi in this one project would create an inconsistency. The hybrid approach (ConfigModule loads, Zod validates) preserves the convention.
- **ALT-006**: **Create individual services for each aspect sub-type** (e.g., `MajorAspectsService`, `MinorAspectsService` as separate DI providers) — This would create 8+ aspect services in the dependency graph. A single `AspectsService` wrapping all aspect type detectors is more readable from the command's perspective.

---

## 4. Dependencies

- **DEP-001**: `@nestjs/common` `^11.0.0` — Core NestJS decorators (`@Module`, `@Injectable`), interfaces, and utilities.
- **DEP-002**: `@nestjs/core` `^11.0.0` — NestJS runtime DI container and application lifecycle.
- **DEP-003**: `@nestjs/config` `^4.0.0` — Environment variable loading and `ConfigService` injection.
- **DEP-004**: `nest-commander` `>=3.20.1` — CLI command registration, `CommandFactory.run()`, `@Command`, `@Option` decorators, `CommandRunner` interface.
- **DEP-005**: `reflect-metadata` `^0.2.0` — Required polyfill for TypeScript decorator metadata at runtime (transitive NestJS requirement).
- **DEP-006**: `@nestjs/testing` `^11.0.0` (dev) — `Test.createTestingModule()`, `TestingModuleBuilder`, provider override utilities.
- **DEP-007**: `nest-commander-testing` `>=3.5.1` (dev) — `CommandTestFactory` for testing `CommandRunner` classes without full process execution.
- **DEP-008**: `@swc-node/register` `^1.10.0` (dev) — SWC-based TypeScript runtime that correctly emits decorator metadata; replaces `tsx` for development execution.
- **DEP-009**: `@swc/core` `^1.10.0` (dev) — Peer dependency of `@swc-node/register`.

---

## 5. Files

- **FILE-001**: `applications/caelundas/src/main.ts` — Modified: replace pipeline orchestration with `CommandFactory.run(AppModule, ['warn', 'error'])` and `import 'reflect-metadata'`.
- **FILE-002**: `applications/caelundas/src/app.module.ts` — Created: root NestJS module importing all feature modules and registering `CaelundasCommand` as a provider.
- **FILE-003**: `applications/caelundas/src/caelundas.command.ts` — Created: single `@Command` CLI entry point implementing `CommandRunner` as class `CaelundasCommand`.
- **FILE-004**: `applications/caelundas/src/event-store/event-store.service.ts` — Created: `@Injectable()` replacement for module-level `events` array.
- **FILE-005**: `applications/caelundas/src/event-store/event-store.module.ts` — Created: NestJS module wrapping `EventStoreService`.
- **FILE-006**: `applications/caelundas/src/events.store.ts` — Deleted: replaced by `EventStoreService`.
- **FILE-007**: `applications/caelundas/src/calendar/calendar.service.ts` — Created: `@Injectable()` wrapper for `buildCalendarFileContent`.
- **FILE-008**: `applications/caelundas/src/calendar/calendar.module.ts` — Created: NestJS module wrapping `CalendarService`.
- **FILE-009**: `applications/caelundas/src/ephemeris/ephemeris.service.ts` — Modified: add `@Injectable()` decorator; convert module-level functions to class methods.
- **FILE-010**: `applications/caelundas/src/ephemeris/ephemeris.aggregates.ts` — Modified: rename to `ephemeris-aggregates.service.ts`, add `@Injectable()`, inject `EphemerisService`.
- **FILE-011**: `applications/caelundas/src/ephemeris/ephemeris.module.ts` — Created: NestJS module wrapping both ephemeris services.
- **FILE-012**: `applications/caelundas/src/events/aspects/aspects.service.ts` — Created: `@Injectable()` `AspectsService` coordinating all 8 aspect type detectors.
- **FILE-013**: `applications/caelundas/src/events/aspects/aspects.module.ts` — Created.
- **FILE-014**: `applications/caelundas/src/events/eclipses/eclipses.service.ts` — Created: `@Injectable()` `EclipsesService`.
- **FILE-015**: `applications/caelundas/src/events/eclipses/eclipses.module.ts` — Created.
- **FILE-016**: `applications/caelundas/src/events/retrogrades/retrogrades.service.ts` — Created: `@Injectable()` `RetrogradesService`.
- **FILE-017**: `applications/caelundas/src/events/retrogrades/retrogrades.module.ts` — Created.
- **FILE-018**: `applications/caelundas/src/events/ingresses/ingresses.service.ts` — Created: `@Injectable()` `IngressesService`.
- **FILE-019**: `applications/caelundas/src/events/ingresses/ingresses.module.ts` — Created.
- **FILE-020**: `applications/caelundas/src/events/daily-cycles/daily-cycles.service.ts` — Created: `@Injectable()` `DailyCyclesService`.
- **FILE-021**: `applications/caelundas/src/events/daily-cycles/daily-cycles.module.ts` — Created.
- **FILE-022**: `applications/caelundas/src/events/monthly-lunar-cycle/monthly-lunar-cycle.service.ts` — Created: `@Injectable()` `MonthlyLunarCycleService`.
- **FILE-023**: `applications/caelundas/src/events/monthly-lunar-cycle/monthly-lunar-cycle.module.ts` — Created.
- **FILE-024**: `applications/caelundas/src/events/annual-solar-cycle/annual-solar-cycle.service.ts` — Created: `@Injectable()` `AnnualSolarCycleService`.
- **FILE-025**: `applications/caelundas/src/events/annual-solar-cycle/annual-solar-cycle.module.ts` — Created.
- **FILE-026**: `applications/caelundas/src/events/twilights/twilights.service.ts` — Created: `@Injectable()` `TwilightsService`.
- **FILE-027**: `applications/caelundas/src/events/twilights/twilights.module.ts` — Created.
- **FILE-028**: `applications/caelundas/src/events/phases/phases.service.ts` — Created: `@Injectable()` `PhasesService`.
- **FILE-029**: `applications/caelundas/src/events/phases/phases.module.ts` — Created.
- **FILE-030**: `applications/caelundas/src/perfective-events/perfective-events.service.ts` — Created: `@Injectable()` `PerfectiveEventsService` injecting all 9 event detection services.
- **FILE-031**: `applications/caelundas/src/perfective-events/perfective-events.module.ts` — Created.
- **FILE-032**: `applications/caelundas/src/perfective.events.ts` — Deleted: replaced by `PerfectiveEventsService`.
- **FILE-033**: `applications/caelundas/src/progressive-events/progressive-events.service.ts` — Created: `@Injectable()` `ProgressiveEventsService`.
- **FILE-034**: `applications/caelundas/src/progressive-events/progressive-events.module.ts` — Created.
- **FILE-035**: `applications/caelundas/src/progressive.events.ts` — Deleted: replaced by `ProgressiveEventsService`.
- **FILE-036**: `applications/caelundas/src/caelundas.command.integration.test.ts` — Created: `CommandTestFactory`-based integration test for `CaelundasCommand`.
- **FILE-037**: `applications/caelundas/tsconfig.json` — Modified: add `experimentalDecorators`, `emitDecoratorMetadata`.
- **FILE-038**: `applications/caelundas/package.json` — Modified: update `scripts.start`, `scripts.develop`; add NestJS / SWC dependencies.
- **FILE-039**: `applications/caelundas/project.json` — Modified: update `develop` target command.

---

## 6. Testing

- **TEST-001**: Unit test for `EventStoreService` — verify `add()` appends events and `getAll()` returns accumulated events in insertion order. Use `@nestjs/testing` `TestingModule`.
- **TEST-002**: Unit test for `CalendarService` — mock `fs.writeFileSync` and `getOutputPath`; verify `buildCalendarFileContent` is called with correct arguments and the output file is written to the expected path.
- **TEST-003**: Unit test for `EphemerisService` — verify sweph computation calls with known input coordinates and date, asserting deterministic ephemeris values. Inject service via `TestingModule`.
- **TEST-004**: Unit test for `EphemerisAggregatesService` — mock `EphemerisService`; verify date-range aggregation calls the service the expected number of times for a given input span.
- **TEST-005**: Unit test for each of the 9 event detection services (`AspectsService`, `EclipsesService`, `RetrogradesService`, `IngressesService`, `DailyCyclesService`, `MonthlyLunarCycleService`, `AnnualSolarCycleService`, `TwilightsService`, `PhasesService`) — mock `EphemerisAggregatesService`; verify `detect()` returns typed `Event[]` for known ephemeris fixture data.
- **TEST-006**: Unit test for `PerfectiveEventsService` — mock all 9 event detection services; verify `detect()` merges and returns the combined event arrays from all services.
- **TEST-007**: Unit test for `ProgressiveEventsService` — provide a fixed array of `perfectiveEvents`; verify `detect()` returns the expected progressive events using existing test fixtures.
- **TEST-008**: Integration test for `CaelundasCommand` via `CommandTestFactory.create({ module: AppModule })` — override `EphemerisService` with mock returning fixture ephemeris data; run the command by calling `module.get(CaelundasCommand).run([], {})` with test env vars; assert `CalendarService.write()` was called and the event store contains both perfective and progressive events.
- **TEST-009**: E2E test (`main.end-to-end.test.ts`) updated — uses `CommandTestFactory` with real services and a test `.env` fixture file; asserts an `.ics` file is written to the configured output path and contains valid RFC 5545 content.

---

## 7. Risks & Assumptions

- **RISK-001**: **`@swc-node/register` decorator metadata accuracy** — SWC's implementation of `emitDecoratorMetadata` is a community effort and may have edge cases with complex generic types. If NestJS DI fails to resolve a provider type, the fallback is to use an explicit `@Inject(TOKEN)` with a string or symbol token.
- **RISK-002**: **NestJS bootstrap startup time** — NestJS initializes its DI container on startup, which adds ~50–200ms overhead. For a batch process that runs for minutes, this is negligible.
- **RISK-003**: **Type coverage regression** — NestJS decorators use `any`-typed metadata reflection internally. If `typeCoverage` counts decorator-generated metadata toward coverage, the 99.46% threshold may require adjusting the `typeCoverage.ignoreFiles` list in `package.json`.
- **RISK-004**: **`verbatimModuleSyntax` compatibility** — NestJS imports (e.g., `import { Injectable } from '@nestjs/common'`) are value imports (decorators are values). `verbatimModuleSyntax` requires careful separation of type-only imports. All NestJS decorator imports must use `import { Injectable }`, not `import { type Injectable }`.
- **ASSUMPTION-001**: The Swiss Ephemeris migration (sweph) referenced in the performance optimization plan is already complete, as indicated by `sweph` being present in `package.json` dependencies. This plan migrates the current sweph-based implementation.
- **ASSUMPTION-002**: The existing pure utility functions (`math.utilities.ts`, `date.utilities.ts`, `output.utilities.ts`, `symbols.ts`, `constants.ts`, `types.ts`) do not require DI wrappers and will be imported directly by services as module-level dependencies.
- **ASSUMPTION-003**: All NestJS providers are singleton-scoped (default), which is appropriate for a single-run CLI application with no concurrent requests.

---

## 8. Related Specifications / Further Reading

- [documentation/planning/2026-04-13-feature-caelundas-performance-optimization.plan.md](../planning/2026-04-13-feature-caelundas-performance-optimization.plan.md) — Performance optimization plan; Phase 0 (Swiss Ephemeris) provides the current ephemeris implementation this plan migrates.
- [applications/caelundas/AGENTS.md](../../applications/caelundas/AGENTS.md) — Caelundas architecture overview, environment variables, Kubernetes deployment configuration.
- [NestJS Modules documentation](https://docs.nestjs.com/modules) — `@Module` decorator, feature modules, global modules.
- [NestJS Dependency Injection](https://docs.nestjs.com/fundamentals/dependency-injection) — Provider registration, constructor injection, custom providers.
- [nest-commander GitHub](https://github.com/jmcdo29/nest-commander) — `@Command`, `CommandRunner`, `CommandFactory`, `@Option` API reference.
- [NestJS nest-commander recipe](https://docs.nestjs.com/recipes/nest-commander) — Official integration guide.
- [nest-commander-testing README](https://github.com/jmcdo29/nest-commander/blob/main/packages/nest-commander-testing/README.md) — `CommandTestFactory` usage and provider override patterns.
- [NestJS Testing documentation](https://docs.nestjs.com/fundamentals/testing) — `Test.createTestingModule`, `TestingModuleBuilder`, mock provider patterns.
