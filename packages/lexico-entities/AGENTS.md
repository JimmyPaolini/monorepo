# Lexico Entities: Shared Database Package

## Quick Start

**Type**: Shared TypeScript library (TypeORM + NestJS integration)

**Purpose**: Centralize the Lexico PostgreSQL schema, entity exports, naming
strategy, and migration workflow.

### Run Locally

```bash
pnpm nx run lexico-entities:build
```

## Architecture Overview

### Main Exports

- `LexicoDatabaseModule` — NestJS `TypeOrmModule` wrapper for PostgreSQL
- `LexicoNamingStrategy` — shared table/column naming policy
- Dictionary entities under `src/entities/dictionary/`
- Literature entities under `src/entities/literature/`
- Shared auditable base entities in `src/entities/`

### Consumers

- `applications/lexico-ingestion` imports this package for its ingestion
  workflows.
- Future Lexico services should use the same exported entities instead of
  redefining schema types.

## Development

### Key Commands

```bash
pnpm nx run lexico-entities:build
pnpm nx run lexico-entities:lint
pnpm nx run lexico-entities:typecheck
pnpm nx run lexico-entities:analyze-code --configuration=check
pnpm nx run lexico-entities:migration:show
pnpm nx run lexico-entities:migration:run
pnpm nx run lexico-entities:migration:revert
pnpm nx run lexico-entities:migration:generate
```

### Important Constraints

- Migrations are orchestrated through the `migration` target configurations in
  `project.json`; keep documentation aligned with those named configurations.
- `LexicoDatabaseModule` currently enables `synchronize: true`, so schema and
  migration changes should be reviewed carefully.

## Key Files

- `src/index.ts` — public package exports
- `src/database/data-source.ts` — TypeORM data source
- `src/database/lexico-database.module.ts` — Nest integration
- `scripts/extract-migration-sql.ts` — migration SQL helper
