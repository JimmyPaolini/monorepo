# LexicoIngestion: NestJS Command-Line Application

## Quick Start

**Type**: Node.js CLI application (NestJS + `nest-commander`)

**Purpose**: Import Latin dictionary data and literature sources into the Lexico PostgreSQL schema.

### Run Locally

```bash
cp .env.default .env
nx run lexico-ingestion:start
```

## Architecture Overview

### Tech Stack

- **Framework**: NestJS (modules, dependency injection, providers)
- **CLI runner**: `nest-commander` (`CommandRunner` + `@Command()` decorator)
- **Env validation**: `@nestjs/config` + `zod`
- **Logging**: `pino`-backed `LoggerService` (`Scope.TRANSIENT`)
- **Language**: Strict TypeScript
- **Persistence**: TypeORM via `@monorepo/lexico-entities`

### Command Surface

- `start` — main ingestion flow
- `dictionary`, `wiktionary`, `manual`, `clear` — dictionary workflows
- `literature`, `library`, `latin-library`, `perseus`,
  `corpus-scriptorum-ecclesiasticorum-latinorum`,
  `epigraphik-datenbank-clauss-slaby` — literature and source workflows
- `repl` — interactive Nest REPL

## Development

### Key Commands

Always prefer running tasks through Nx rather than calling the underlying tools directly.

```bash
nx run lexico-ingestion:start
nx run lexico-ingestion:repl
nx run lexico-ingestion:test
nx run lexico-ingestion:test --configuration=unit
nx run lexico-ingestion:test --configuration=integration
nx run lexico-ingestion:test --configuration=end-to-end
nx run lexico-ingestion:lint
nx run lexico-ingestion:typecheck
```

Also useful:

```bash
pnpm nx run lexico-ingestion:dictionary
pnpm nx run lexico-ingestion:wiktionary
pnpm nx run lexico-ingestion:literature
pnpm nx run lexico-ingestion:manual
pnpm nx run lexico-ingestion:clear
pnpm nx run lexico-ingestion:analyze-code --configuration=check
```

### Testing

Follow the monorepo's strict three-tier testing strategy. Co-locate test files with the source they test.

| Tier | File pattern | What to test |
| ---- | ------------ | ------------ |
| Unit | `*.unit.test.ts` | Pure functions and services with mocked dependencies |
| Integration | `*.integration.test.ts` | Real I/O, persistence, and boundary behavior |
| End-to-end | `*.end-to-end.test.ts` | Full CLI execution |

### Important Constraints

- The project does **not** expose a `develop` target; use `start` or `repl`.
- The `build` target intentionally prints a message instead of creating a
  production artifact.
- Keep schema-facing changes aligned with `@monorepo/lexico-entities` and its
  migration workflow.

## Key Files

- `src/main.ts` — CLI bootstrap
- `src/repl.ts` — interactive REPL entrypoint
- `src/modules/` — ingestion modules by source and domain
- `testing/` — shared test fixtures
