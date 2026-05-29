# lexico-ingestion

Command-line NestJS application for ingesting Wiktionary Latin entries into PostgreSQL.

## Setup

```bash
pnpm install
cp applications/lexico-ingestion/.env.default applications/lexico-ingestion/.env
```

## Local PostgreSQL

```bash
docker compose -f applications/lexico-ingestion/docker-compose.yml up -d
```

## Run

```bash
npx nx run lexico-ingestion:start
```

## Test

```bash
npx nx run lexico-ingestion:test
```
