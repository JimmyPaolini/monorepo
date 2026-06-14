# {{namePascalCase}}: NestJS Command-Line Application

## Quick Start

**Type**: Node.js CLI application (NestJS + `nest-commander`)

**Purpose**: TODO describe the specific purpose of this CLI application

### Run Locally

```bash
cp .env.default .env
nx run {{nameKebabCase}}:start
```

## Architecture Overview

### Tech Stack

- **Framework**: NestJS (modules, dependency injection, providers)
- **CLI runner**: `nest-commander` (`CommandRunner` + `@Command()` decorator)
- **Env validation**: `@nestjs/config` + `zod`
- **Logging**: `pino`-backed `LoggerService` (`Scope.TRANSIENT`)
- **Language**: Strict TypeScript

## Development

### Key Commands

Always prefer running tasks through Nx rather than calling the underlying tools directly.

```bash
nx run {{nameKebabCase}}:start
nx run {{nameKebabCase}}:repl
nx run {{nameKebabCase}}:test
nx run {{nameKebabCase}}:test --configuration=unit
nx run {{nameKebabCase}}:test --configuration=integration
nx run {{nameKebabCase}}:test --configuration=end-to-end
nx run {{nameKebabCase}}:lint
nx run {{nameKebabCase}}:typecheck
```

### Testing

Follow the monorepo's strict three-tier testing strategy. Co-locate test files with the source they test.

| Tier | File pattern | What to test |
| ---- | ------------ | ------------ |
| Unit | `*.unit.test.ts` | Pure functions and services with mocked dependencies |
| Integration | `*.integration.test.ts` | Real I/O, persistence, and boundary behavior |
| End-to-end | `*.end-to-end.test.ts` | Full CLI execution |
