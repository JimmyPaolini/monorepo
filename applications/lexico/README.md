# Lexico

Server-rendered Latin dictionary application built with TanStack Start.

The current workspace version focuses on the application shell, dictionary
search route, shared component integration, and placeholder server functions
for authentication, bookmarks, personal library data, and pronunciation.

## Quick Start

```bash
pnpm nx run lexico:develop
```

## Useful Commands

```bash
pnpm nx run lexico:develop
pnpm nx run lexico:build
pnpm nx run lexico:preview
pnpm nx run lexico:start
pnpm nx run lexico:lint
pnpm nx run lexico:typecheck
pnpm nx run lexico:bundlesize
pnpm nx run lexico:analyze-code --configuration=check
```

## Route and Feature Snapshot

```text
src/routes/
├── __root.tsx
├── index.tsx
├── bookmarks.tsx
├── library.tsx
├── search.tsx
├── settings.tsx
├── tools.tsx
└── word.$id.tsx
```

## Notes

- `src/lib/search.ts`, `auth.ts`, `bookmarks.ts`, `library.ts`, and
  `pronunciation.ts` currently expose TanStack Start server functions with
  placeholder implementations.
- The checked-in Nx project does **not** define Supabase-specific targets such
  as `lexico:supabase:start`, `lexico:supabase:database-reset`, or
  `lexico:supabase:generate-types`.
- Shared UI should come from
  [`@monorepo/lexico-components`](../../packages/lexico-components).

For architecture and implementation notes, see [AGENTS.md](AGENTS.md).
