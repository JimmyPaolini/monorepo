# Caelundas: NestJS Command-Line Application

## Quick Start

**Type**: Node.js CLI application (NestJS + `nest-commander`)

**Purpose**: Generate astronomical calendar events from Swiss Ephemeris data.

### Run Locally

```bash
cp .env.default .env
nx run caelundas:start
```

Run `pnpm nx run caelundas:download-ephemeris` before the first execution to
populate local ephemeris data.

## Architecture Overview

### Tech Stack

- **Framework**: NestJS (modules, dependency injection, providers)
- **CLI runner**: `nest-commander` (`CommandRunner` + `@Command()` decorator)
- **Env validation**: `@nestjs/config` + `zod`
- **Logging**: `pino`-backed `LoggerService` (`Scope.TRANSIENT`)
- **Language**: Strict TypeScript
- **Ephemeris engine**: `sweph`

### Execution Flow

```text
src/main.ts
  └─ CommandFactory.run(CaelundasModule)
       └─ CaelundasCommand.run()
            ├─ InputService.parse()
            ├─ EphemerisService.calculate()
            ├─ PerfectiveService.detect()
            ├─ ProgressiveService.detect()
            └─ CalendarService.write()
```

### Key Modules

- `src/modules/caelundas/` — root command and application wiring
- `src/modules/input/` — environment parsing and defaults
- `src/modules/ephemeris/` — Swiss Ephemeris integration
- `src/modules/perfective/` — point-in-time event detection
- `src/modules/progressive/` — duration event synthesis
- `src/modules/calendar/` — output generation
- `src/modules/*-aspects`, `phases`, `retrogrades`, `eclipses`, `ingresses`,
  `twilights`, `daily-cycles`, `monthly-lunar-cycle`, `annual-solar-cycle` —
  specialized domain modules

## Development

### Key Commands

Always prefer running tasks through Nx rather than calling the underlying tools directly.

```bash
nx run caelundas:start
nx run caelundas:repl
nx run caelundas:test
nx run caelundas:test --configuration=unit
nx run caelundas:test --configuration=integration
nx run caelundas:test --configuration=end-to-end
nx run caelundas:lint
nx run caelundas:typecheck
```

Also useful:

```bash
pnpm nx run caelundas:download-ephemeris
pnpm nx run caelundas:analyze-code --configuration=check
```

### Testing

Follow the monorepo's strict three-tier testing strategy. Co-locate test files with the source they test.

| Tier | File pattern | What to test |
| ---- | ------------ | ------------ |
| Unit | `*.unit.test.ts` | Pure functions and services with mocked dependencies |
| Integration | `*.integration.test.ts` | Real I/O, persistence, and boundary behavior |
| End-to-end | `*.end-to-end.test.ts` | Full CLI execution |

### Important Constraints

- The current project configuration does **not** define `develop`, `build`,
  `docker-build`, `helm-upgrade`, `kubernetes-copy-files`, or
  `helm-uninstall` Nx targets.
- Use `scripts/download-ephemeris.ts` to prepare local ephemeris data before
  running the CLI for the first time.
- Prefer updating one event module at a time; integration coverage already
  exists for several domain modules under `src/modules/`.

## Key Files

- `src/main.ts` — CLI bootstrap
- `src/modules/caelundas/caelundas.command.ts` — root command
- `src/modules/ephemeris/ephemeris.service.ts` — ephemeris calculations
- `src/modules/calendar/calendar.service.ts` — output generation
- `scripts/download-ephemeris.ts` — local data bootstrap
