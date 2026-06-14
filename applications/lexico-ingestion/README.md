# LexicoIngestion

NestJS command-line application scaffold generated with `conformance:nestjs-command-application`.

NestJS command-line application for importing Latin dictionary and literature
sources into PostgreSQL.

The application depends on `@monorepo/lexico-entities` for its TypeORM models
and exposes separate commands for dictionary ingestion, literature downloads,
manual imports, and data clearing.

## Start

```bash
nx run lexico-ingestion:start
```

## Test

```bash
nx run lexico-ingestion:test
```

## Quick Start

```bash
cp .env.default .env
pnpm nx run lexico-ingestion:start
```

## Useful Commands

```bash
pnpm nx run lexico-ingestion:start
pnpm nx run lexico-ingestion:repl
pnpm nx run lexico-ingestion:dictionary
pnpm nx run lexico-ingestion:wiktionary
pnpm nx run lexico-ingestion:literature
pnpm nx run lexico-ingestion:library
pnpm nx run lexico-ingestion:manual
pnpm nx run lexico-ingestion:clear
pnpm nx run lexico-ingestion:test --configuration=unit
pnpm nx run lexico-ingestion:test --configuration=integration
pnpm nx run lexico-ingestion:test --configuration=end-to-end
pnpm nx run lexico-ingestion:lint
pnpm nx run lexico-ingestion:typecheck
```

## Source-Specific Commands

- `corpus-scriptorum-ecclesiasticorum-latinorum`
- `epigraphik-datenbank-clauss-slaby`
- `latin-library`
- `perseus`

## Notes

- `pnpm nx run lexico-ingestion:build` is currently a no-op placeholder that
  documents the project as a development tool.
- PostgreSQL connection settings come from `.env.default`.
- Literature and dictionary ingestion share the entity definitions exported by
  `@monorepo/lexico-entities`.

For architecture and command details, see [AGENTS.md](AGENTS.md).
