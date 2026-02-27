# Lexico: Latin Dictionary Web Application

## Quick Start

**Type**: SSR web app (TanStack Start + Supabase)

**Purpose**: Latin word lookup with authentication, bookmarks, and personal library

### Run Locally

```bash
nx run lexico:supabase:start
nx run lexico:develop
```

### After Schema Changes

```bash
nx run lexico:supabase:database-diff
nx run lexico:supabase:generate-types
```

See [supabase-development skill](../../documentation/skills/supabase-development/SKILL.md) for full workflow.

## Architecture Overview

### Tech Stack

- **Frontend**: React 19, TanStack Router (file-based routing)
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **SSR**: TanStack Start server functions
- **Styling**: Tailwind CSS, shadcn/ui via [@monorepo/lexico-components](../../packages/lexico-components)

### File-Based Routes

```text
routes/
├── __root.tsx              # Root layout (HTML shell, providers)
├── index.tsx               # /
├── search.tsx              # /search
├── word.$id.tsx            # /word/:id
├── bookmarks.tsx           # /bookmarks (auth)
├── library.tsx             # /library (auth)
└── settings.tsx            # /settings (auth)
```

Generated route tree: [src/routeTree.gen.ts](src/routeTree.gen.ts) (auto-generated, never edit)

### Authentication Flow

```text
User → OAuth Provider → Supabase Auth → Server Cookie → RLS Policies
```

- **Client**: [src/lib/supabase.ts](src/lib/supabase.ts) (OAuth redirects)
- **Server**: [src/lib/supabase-server.ts](src/lib/supabase-server.ts) (cookie client)
- **Auth helpers**: [src/lib/auth.ts](src/lib/auth.ts)
- **Route guards**: TanStack Router `beforeLoad`

See [tanstack-start-ssr skill](../../documentation/skills/tanstack-start-ssr/SKILL.md) for SSR patterns.

## Data Model

- Supabase migrations: [supabase/migrations/](supabase/migrations/)
- Generated types: [src/lib/database.types.ts](src/lib/database.types.ts)
- RLS policies: [supabase/migrations/20251203000002_rls_policies.sql](supabase/migrations/20251203000002_rls_policies.sql)

## Component Library Integration

Always import shared UI from `@monorepo/lexico-components` and never duplicate UI code.

```tsx
import { Button, Card, Input } from "@monorepo/lexico-components";
```

See [React Conventions](../../documentation/conventions/react.md) and [lexico-components AGENTS](../../packages/lexico-components/AGENTS.md).

## Testing

See [Testing Strategy](../../documentation/code-quality/testing-strategy.md) for unit/integration/E2E patterns.

## Troubleshooting

See [Common Gotchas](../../documentation/troubleshooting/gotchas.md) for Supabase, TypeScript, and Docker issues.

## Key Files

- [src/routes/](src/routes/): File-based routes
- [src/lib/auth.ts](src/lib/auth.ts): Auth helpers
- [src/lib/supabase.ts](src/lib/supabase.ts): Client Supabase setup
- [src/lib/supabase-server.ts](src/lib/supabase-server.ts): Server Supabase setup
- [src/lib/database.types.ts](src/lib/database.types.ts): Generated DB types
- [supabase/config.toml](supabase/config.toml): Local Supabase configuration
