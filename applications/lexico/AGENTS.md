# Lexico: TanStack Start SSR Application

## Quick Start

**Type**: SSR web application (React 19 + TanStack Start)

**Purpose**: Provide a Latin dictionary user interface backed by TanStack Start
routes and shared UI components.

### Run Locally

```bash
pnpm nx run lexico:develop
```

## Architecture Overview

### Tech Stack

- **Framework**: TanStack Start + TanStack Router
- **UI**: `@monorepo/lexico-components`
- **Styling**: Tailwind CSS 4
- **Language**: Strict TypeScript

### Current Application Surface

- `src/routes/search.tsx` — dictionary search UI
- `src/routes/word.$id.tsx` — entry detail route
- `src/routes/bookmarks.tsx`, `library.tsx`, `settings.tsx`, `tools.tsx` —
  supporting routes and placeholders
- `src/lib/search.ts` — search server functions
- `src/lib/auth.ts`, `bookmarks.ts`, `library.ts`, `pronunciation.ts` —
  placeholder server-function contracts for future backend integration

## Development

### Key Commands

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

### Important Constraints

- The current project configuration does **not** include any Supabase Nx
  targets.
- Documentation or code changes should describe the checked-in placeholder
  server functions accurately; do not document production auth, bookmarks, or
  pronunciation behavior as implemented when the handlers still return stubs.
- Keep all shared UI in `@monorepo/lexico-components` instead of duplicating
  components locally.

## Key Files

- `src/router.tsx` — router entrypoint
- `src/routeTree.gen.ts` — generated route tree
- `src/routes/` — file-based routes
- `src/lib/search.ts` — search contract
- `src/lib/auth.ts` — auth contract
- `src/lib/bookmarks.ts` — bookmark contract
- `src/lib/library.ts` — personal library contract
- `src/lib/pronunciation.ts` — pronunciation contract
