# Lexico Entities

Shared TypeORM entities and database helpers for Lexico projects.

This package exports the Lexico database module, naming strategy, dictionary
entities, literature entities, and shared base classes used by
`applications/lexico-ingestion`.

## Quick Start

```bash
pnpm nx run lexico-entities:build
```

## Useful Commands

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

## Package Surface

- `src/database/lexico-database.module.ts` — `TypeOrmModule` configuration for
  PostgreSQL
- `src/database/lexico-naming-strategy.ts` — naming strategy for tables and
  columns
- `src/entities/dictionary/` — dictionary lexemes, inflections, forms,
  pronunciations, translations, and join entities
- `src/entities/literature/` — authors, texts, lines, and tokens
- `src/entities/*.entity.ts` — shared auditable base entities

## Notes

- Environment defaults live in `.env.default`.
- The migration target wraps the TypeORM CLI with preconfigured data-source
  paths and helper extraction steps.

For architecture notes, see [AGENTS.md](AGENTS.md).
