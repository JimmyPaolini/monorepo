# Lexico: Latin Dictionary Web Application

## Architecture Overview

Lexico is a server-side rendered (SSR) Latin dictionary web application built with TanStack Start and Supabase. It provides comprehensive Latin word lookup, user authentication, bookmarks, and a personal library system.

### Technology Stack

- **Frontend**: React 19, TanStack Router (file-based routing), TanStack Start (SSR framework)
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions), TanStack Start server functions
- **Styling**: Tailwind CSS, shadcn/ui components via [@monorepo/lexico-components](../../packages/lexico-components)
- **Type Safety**: TypeScript 5.9 with strict mode, auto-generated Supabase types
- **Build**: Vite 7, Nitro SSR bundler

### Core Architecture Patterns

**Server-Side Rendering (SSR)**

All routes render on the server first, then hydrate on the client:
- Initial page load: Full HTML rendered server-side (faster first paint, SEO-friendly)
- Client-side navigation: React takes over (SPA-like experience)
- Server functions: Type-safe RPC calls from client to server

**File-Based Routing** ([src/routes/](src/routes/))

TanStack Router generates routes from file structure:

```text
routes/
├── __root.tsx              # Root layout (HTML shell, Supabase provider)
├── index.tsx               # / (home page)
├── search.tsx              # /search (dictionary search)
├── word.$id.tsx            # /word/:id (word detail page)
├── bookmarks.tsx           # /bookmarks (authenticated, user bookmarks)
├── library.tsx             # /library (authenticated, user library)
├── settings.tsx            # /settings (authenticated, user preferences)
└── tools.tsx               # /tools (utilities, public)
```

Generated route tree: [src/routeTree.gen.ts](src/routeTree.gen.ts) (auto-generated, never edit)

**Authentication Flow**

```text
User → OAuth Provider (Google, GitHub) → Supabase Auth → Server Cookie → RLS Policies
   ↓                                                           ↓              ↓
Login Button                                          Authentication    Database
   ↓                                                      State          Access
Redirect to Provider → Callback → Set Cookie → getUser() → Query Data
```

**Authentication Implementation**

1. **Client-Side** ([src/lib/supabase.ts](src/lib/supabase.ts)): Browser Supabase client for OAuth redirects
2. **Server-Side** ([src/lib/supabase-server.ts](src/lib/supabase-server.ts)): Cookie-based Supabase client for server functions
3. **Auth Functions** ([src/lib/auth.ts](src/lib/auth.ts)): `getCurrentUser()`, `signOut()` server functions
4. **Route Guards**: TanStack Router `beforeLoad` hooks check authentication state

**Cookie-Based Sessions**

Supabase stores auth sessions in HTTP-only cookies:
- **Security**: Cookies are HTTP-only (not accessible via JavaScript), secure (HTTPS only), SameSite=Lax
- **SSR Compatibility**: Server functions read cookies from request headers, set cookies in response headers
- **Auto-Refresh**: Supabase SSR library automatically refreshes expired tokens

**Row-Level Security (RLS)**

PostgreSQL RLS policies enforce data access rules:
- Public data: Words, definitions, examples (no auth required)
- Private data: Bookmarks, library entries, settings (user ID must match)
- RLS policies: [supabase/migrations/20251203000002_rls_policies.sql](supabase/migrations/20251203000002_rls_policies.sql)

### Database Schema

**Core Tables** (from migrations in [supabase/migrations/](supabase/migrations/))

**`words`**: Latin word entries
- `id` (bigint, PK): Unique word ID
- `word` (text): Latin word headword
- `part_of_speech` (text): Noun, verb, adjective, etc.
- `definitions` (jsonb): Array of English definitions
- `etymology` (text): Word origin and historical development
- `examples` (jsonb): Array of usage examples with translations

**`user_bookmarks`**: User-saved words
- `id` (uuid, PK): Unique bookmark ID
- `user_id` (uuid, FK): References `auth.users(id)`
- `word_id` (bigint, FK): References `words(id)`
- `created_at` (timestamptz): Bookmark creation timestamp
- RLS: User can only access own bookmarks (`user_id = auth.uid()`)

**`user_library`**: User's personal vocabulary lists
- `id` (uuid, PK): Unique library entry ID
- `user_id` (uuid, FK): References `auth.users(id)`
- `word_id` (bigint, FK): References `words(id)`
- `notes` (text): User-written notes about the word
- `proficiency` (text): User's self-assessed proficiency (learning, familiar, mastered)
- `created_at` (timestamptz): Entry creation timestamp
- RLS: User can only access own library entries

**`user_settings`**: User preferences
- `user_id` (uuid, PK, FK): References `auth.users(id)`
- `theme` (text): UI theme preference (light, dark, system)
- `default_search_mode` (text): Latin-to-English or English-to-Latin
- `pronunciation_enabled` (boolean): Auto-play pronunciation audio
- `updated_at` (timestamptz): Last settings update

**Database Functions** (RPC)

- `search_words(query text, mode text)`: Full-text search on Latin words or English definitions
- `search_words_with_etymology(query text, mode text)`: Search including etymology field (added in [20251208000001_add_etymology_to_search.sql](supabase/migrations/20251208000001_add_etymology_to_search.sql))
- `get_word_details(word_id bigint)`: Fetch word with related data (conjugations, declensions, derived words)

**Type Generation**

Supabase schema → TypeScript types:
```bash
nx run lexico:supabase:generate-types
# Outputs: src/lib/database.types.ts
```

Types are auto-generated from local Supabase schema and used throughout the app for type-safe database queries.

### Supabase Architecture

**Local Development Environment**

Supabase CLI runs Docker containers for local development:
- **PostgreSQL**: Database server (port 54322)
- **PostgREST**: Auto-generated REST API (port 54321)
- **GoTrue**: Authentication server (port 54324)
- **Inbucket**: Email testing (port 54325)
- **Kong**: API gateway (port 8000)
- **Studio**: Web UI for database management (port 54323)

Start local stack: `nx run lexico:supabase:start`

**Configuration** ([supabase/config.toml](supabase/config.toml))

- Database settings: Pool size, max connections, statement timeout
- Auth settings: OAuth providers (Google, GitHub), JWT expiry, email templates
- API settings: Max rows, schema exposure, CORS
- Storage settings: File size limits, allowed MIME types

**Migrations Workflow**

1. **Make Schema Changes**: Edit database via Supabase Studio (http://localhost:54323)
2. **Generate Migration**: `nx run lexico:supabase:database-diff` (creates SQL file in [supabase/migrations/](supabase/migrations/))
3. **Review Migration**: Manually review generated SQL, edit if needed
4. **Generate Types**: `nx run lexico:supabase:generate-types` (updates [src/lib/database.types.ts](src/lib/database.types.ts))
5. **Test Migration**: `nx run lexico:supabase:database-reset` (applies all migrations from scratch)
6. **Commit Migration**: Add migration file to git

**Migration Naming Convention**

`YYYYMMDDHHMMSS_description.sql` (e.g., `20251203000001_user_settings.sql`)

Supabase CLI generates timestamp automatically: `supabase db diff --use-migra-py`

**Seed Data** ([supabase/seed.sql](supabase/seed.sql))

Populate development database with test data:
- Sample words with definitions, etymology, examples
- Test user accounts (via `auth.users` table inserts)
- User bookmarks and library entries for testing

Seed data is applied after migrations when running `nx run lexico:supabase:database-reset`

### TanStack Start Patterns

**Server Functions** ([src/lib/](src/lib/))

Type-safe RPC calls from client to server:

```typescript
// Define server function (src/lib/search.ts)
export const searchWords = createServerFn({ method: "GET" })
  .validator((input) => searchSchema.parse(input))
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { data: results } = await supabase.rpc('search_words', {
      query: data.query,
      mode: data.mode
    });
    return results;
  });

// Call from client component (src/routes/search.tsx)
const results = await searchWords({ query: 'amor', mode: 'latin' });
```

**Server Function Patterns**

- **Authentication**: Use `getSupabaseServerClient()` to access current user session
- **Validation**: Use Zod schemas for input validation (throws 400 error on invalid input)
- **Error Handling**: Throw typed errors for client error handling
- **Caching**: Server functions can be cached (set `cache: true` in function options)

**Route Loaders** ([src/routes/](src/routes/))

Fetch data before route renders (SSR-compatible):

```typescript
// src/routes/word.$id.tsx
export const Route = createFileRoute('/word/$id')({
  loader: async ({ params }) => {
    const word = await getWordDetails({ wordId: params.id });
    return { word };
  },
  component: WordDetailPage,
});
```

**Route Guards** (Authentication)

Protect routes requiring authentication:

```typescript
// src/routes/bookmarks.tsx
export const Route = createFileRoute('/bookmarks')({
  beforeLoad: async () => {
    const user = await getCurrentUser();
    if (!user) {
      throw redirect({ to: '/login' });
    }
    return { user };
  },
  component: BookmarksPage,
});
```

**Preloading Strategies**

- `defaultPreload: 'intent'`: Preload on hover/focus (set in [src/router.tsx](src/router.tsx))
- Route-specific: Override per route with `preload: 'viewport'` or `preload: false`

### Component Library Integration

**lexico-components** ([../../packages/lexico-components](../../packages/lexico-components))

Shared React components built with shadcn/ui:
- UI primitives: Button, Input, Card, Dialog, Dropdown
- Form components: Label, Checkbox, RadioGroup, Select
- Layout components: Container, Flex, Grid
- Theme system: CSS variables, dark mode support

**Import Pattern**

```typescript
import { Button, Card, Input } from '@monorepo/lexico-components';
```

**Never Duplicate Components**: Always import from lexico-components, never copy UI code into lexico

**Theming**

Tailwind CSS with CSS variables defined in [src/index.css](src/index.css):
- Light/dark mode via `data-theme` attribute
- Color tokens: `--primary`, `--secondary`, `--accent`, `--muted`
- Component-specific tokens: `--card-bg`, `--input-border`

### Features & Business Logic

**Search Functionality** ([src/lib/search.ts](src/lib/search.ts))

Two search modes:
- **Latin → English**: Search Latin headwords, return definitions
- **English → Latin**: Search English definitions/etymology, return Latin words
- **Full-text search**: PostgreSQL `ts_vector` indexes on `word`, `definitions`, `etymology`

**Bookmarks** ([src/lib/bookmarks.ts](src/lib/bookmarks.ts))

Save words for quick reference:
- Add bookmark: Insert into `user_bookmarks` (RLS enforces user ID match)
- Remove bookmark: Delete from `user_bookmarks`
- List bookmarks: Join `user_bookmarks` with `words` table

**Library** ([src/lib/library.ts](src/lib/library.ts))

Personal vocabulary management:
- Add to library: Insert into `user_library` with notes and proficiency level
- Update entry: Edit notes or proficiency
- Remove from library: Delete from `user_library`
- List library: Join `user_library` with `words` table, filter/sort by proficiency

**Pronunciation** ([src/lib/pronunciation.ts](src/lib/pronunciation.ts))

Text-to-speech for Latin words:
- **Service**: AWS Polly (Latin voice)
- **Caching**: Audio files stored in Supabase Storage
- **Fallback**: Browser Web Speech API if AWS unavailable

**User Settings** ([src/lib/forms.ts](src/lib/forms.ts))

Persistent user preferences:
- Theme (light/dark/system)
- Default search mode
- Pronunciation auto-play
- Stored in `user_settings` table (one row per user)

## Development Workflows

### Local Development Setup

**Prerequisites**
- Docker (for Supabase local stack)
- pnpm (for package management)
- Supabase CLI (`brew install supabase/tap/supabase` on macOS)

**Initial Setup**

```bash
cd applications/lexico

# 1. Install dependencies
pnpm install

# 2. Start Supabase local environment
nx run lexico:supabase:start
# Wait for all services to start (~30s)

# 3. Apply migrations and seed data
nx run lexico:supabase:database-reset

# 4. Generate TypeScript types from schema
nx run lexico:supabase:generate-types

# 5. Configure environment variables
cp .env.default .env
# Edit .env with local Supabase credentials (printed by supabase start)

# 6. Start development server
nx run lexico:develop
# Open http://localhost:3000
```

**Environment Variables** ([.env](..env))

```bash
# Supabase (from `supabase start` output)
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=<anon-key-from-supabase-start>

# AWS Polly (optional, for pronunciation)
AWS_POLLY_ACCESS_KEY_ID=<aws-access-key>
AWS_POLLY_SECRET_ACCESS_KEY=<aws-secret-key>
AWS_POLLY_REGION=us-east-1
```

**Development Server**

```bash
nx run lexico:develop    # Start with hot reload (port 3000)
```

Features:
- Hot reload: File changes trigger immediate rebuild
- Server function updates: Automatically restart server
- Type checking: Errors shown in terminal and browser
- Route debugging: TanStack Router devtools at `/__devtools`

### Database Workflows

**Making Schema Changes**

1. **Edit Schema**: Use Supabase Studio (http://localhost:54323) or write SQL directly
2. **Generate Migration**: `nx run lexico:supabase:database-diff`
3. **Review Generated SQL**: Check [supabase/migrations/](supabase/migrations/) for new file
4. **Edit Migration** (if needed): Add comments, adjust constraints, add indexes
5. **Test Migration**: `nx run lexico:supabase:database-reset` (applies from scratch)
6. **Update Types**: `nx run lexico:supabase:generate-types`
7. **Test Application**: Verify TypeScript errors resolved, queries work correctly

**Migration Best Practices**

- One migration per logical change (e.g., "add user settings table", "add etymology column")
- Always include RLS policies for new tables with user data
- Add indexes for foreign keys and frequently queried columns
- Use `IF NOT EXISTS` for idempotent create statements (safe to re-run)
- Test migrations on clean database before committing

**Viewing Database**

- **Supabase Studio**: http://localhost:54323 (visual editor, table browser)
- **psql**: `supabase db shell` (PostgreSQL CLI)
- **Connection String**: `postgresql://postgres:postgres@localhost:54322/postgres`

### Testing Strategy

**Type Checking**

```bash
nx run lexico:typecheck    # Full TypeScript compilation check (no output files)
```

Strict mode enabled: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`

**Type Coverage**

```bash
nx run lexico:type-coverage    # Check percentage of typed code (target: 99.36%)
```

**Bundle Size Analysis**

```bash
nx run lexico:build            # Build production bundle
nx run lexico:bundlesize       # Check size limits with size-limit
```

Limits defined in [package.json](package.json):
- Client JS (main bundle): 180 KB gzipped
- Client CSS: 20 KB gzipped

**Manual Testing Checklist**

- [ ] Authentication: Sign in with Google, GitHub, sign out
- [ ] Search: Latin → English, English → Latin, empty query handling
- [ ] Bookmarks: Add, remove, view list
- [ ] Library: Add word, edit notes, change proficiency, remove
- [ ] Settings: Change theme, toggle pronunciation, change default search mode
- [ ] Pronunciation: Click play button, auto-play on word detail page
- [ ] Responsive: Test on mobile viewports (375px, 768px, 1024px)
- [ ] Accessibility: Keyboard navigation, screen reader announces

### Deployment

**Production Supabase Setup**

1. **Create Supabase Project**: https://app.supabase.com (select region, tier)
2. **Link CLI to Project**: `supabase link --project-ref <project-ref>`
3. **Push Migrations**: `supabase db push` (applies local migrations to production)
4. **Configure OAuth**:
   - Google: Add OAuth client ID/secret in Supabase dashboard
   - GitHub: Add OAuth app client ID/secret in Supabase dashboard
5. **Set Environment Variables**: Production `SUPABASE_URL` and `SUPABASE_ANON_KEY`

**Build & Deploy Application**

```bash
# 1. Build production bundle
nx run lexico:build
# Outputs: dist/applications/lexico/

# 2. Verify bundle size
nx run lexico:bundlesize

# 3. Deploy to hosting platform
# (e.g., Vercel, Netlify, Cloudflare Pages, fly.io)
```

**Deployment Platforms**

- **Vercel**: Zero-config deployment (detects Vite + TanStack Start)
- **Netlify**: Add `nitro` preset in [vite.config.mts](vite.config.mts)
- **Cloudflare Pages**: Use Cloudflare Workers preset
- **Self-hosted**: Deploy `.output/server/index.mjs` with Node.js

**Environment Variables in Production**

Set in hosting platform dashboard:
- `SUPABASE_URL`: Production Supabase project URL
- `SUPABASE_ANON_KEY`: Public anonymous key (safe to expose)
- `AWS_POLLY_*`: AWS credentials (if using pronunciation)
- `NODE_ENV=production`: Enable production optimizations

### Performance Optimization

**SSR Optimizations**

- **Streaming**: TanStack Start streams HTML as it's generated (faster TTFB)
- **Selective Hydration**: Only interactive components hydrate on client
- **Route-based Code Splitting**: Each route loaded on demand
- **Preloading**: Hover/focus triggers route preload (instant navigation)

**Database Query Optimization**

- **Indexes**: Add indexes on frequently queried columns (e.g., `user_id`, `word_id`)
- **Joins**: Use Supabase query builder to minimize round trips
- **Pagination**: Use `range(start, end)` for large result sets
- **RPC Functions**: Complex queries should use database functions for performance

**Bundle Size Optimization**

- **Tree Shaking**: Vite removes unused code automatically
- **Code Splitting**: Dynamic imports for large dependencies (e.g., `lodash`)
- **CSS Purging**: Tailwind removes unused classes in production
- **Image Optimization**: Use WebP format, responsive images with `srcset`

**Caching Strategies**

- **Server Functions**: Cache results with `cache: true` option
- **Route Loaders**: TanStack Router caches loader data by route
- **Supabase**: Use `single()` instead of `data[0]` to clarify single-row queries
- **Browser Cache**: Set `Cache-Control` headers for static assets

## Troubleshooting

**Supabase Local Stack Won't Start**

- **Symptom**: `supabase start` fails with Docker errors
- **Cause**: Docker not running, or port conflicts
- **Solution**:
  1. Verify Docker is running: `docker ps`
  2. Check port availability: `lsof -i :54321` (should be empty)
  3. Stop conflicting services or change ports in [supabase/config.toml](supabase/config.toml)
  4. Reset Supabase: `supabase stop --no-backup && supabase start`

**Type Generation Fails**

- **Symptom**: `nx run lexico:supabase:generate-types` errors
- **Cause**: Local Supabase not running, or schema has errors
- **Solution**:
  1. Verify Supabase is running: `supabase status`
  2. Check database for errors: `supabase db shell`, run `\dt` to list tables
  3. Reset database: `nx run lexico:supabase:database-reset`
  4. Regenerate types: `nx run lexico:supabase:generate-types`

**Authentication Redirects to Wrong URL**

- **Symptom**: OAuth callback fails, user not logged in
- **Cause**: Site URL mismatch in Supabase settings
- **Solution**:
  1. Local: Verify `supabase/config.toml` has `site_url = "http://localhost:3000"`
  2. Production: Set Site URL in Supabase dashboard → Authentication → URL Configuration

**RLS Policies Block Legitimate Queries**

- **Symptom**: Database queries return empty results despite data existing
- **Cause**: RLS policy not matching current user context
- **Solution**:
  1. Verify authentication: Check if `getCurrentUser()` returns user object
  2. Test without RLS: `supabase db shell`, run `SET request.jwt.claim.sub = '<user-id>';` then query
  3. Review policy: Check migration file for correct `auth.uid()` usage

**Server Function Type Errors**

- **Symptom**: TypeScript errors when calling server functions from client
- **Cause**: Type mismatch between server function definition and call site
- **Solution**:
  1. Verify server function exports: Must be exported from `.ts` file in `src/lib/`
  2. Check input validator: Zod schema must match call site arguments
  3. Restart dev server: Type changes require server restart

**Build Fails with Module Not Found**

- **Symptom**: `nx run lexico:build` errors with missing module
- **Cause**: Import path incorrect, or file not included in build
- **Solution**:
  1. Verify import path: Use `@monorepo/lexico-components` for shared components
  2. Check `vite.config.mts`: Ensure path aliases configured correctly
  3. Clear cache: `nx reset && pnpm install`

## Code Patterns & Conventions

**Server Function Organization**

- One server function per file or group related functions
- File location: `src/lib/<feature>.ts` (e.g., `search.ts`, `bookmarks.ts`, `library.ts`)
- Export server functions, not internal helpers

**Route File Structure**

```typescript
// src/routes/example.tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/example')({
  // 1. Loader (server-side data fetching)
  loader: async () => {
    const data = await fetchData();
    return { data };
  },

  // 2. Route guards (authentication, authorization)
  beforeLoad: async () => {
    const user = await getCurrentUser();
    if (!user) throw redirect({ to: '/login' });
    return { user };
  },

  // 3. Component (UI rendering)
  component: ExamplePage,
});

// Component defined below route definition
function ExamplePage() {
  const { data } = Route.useLoaderData();
  return <div>{data}</div>;
}
```

**Database Query Patterns**

```typescript
// Good: Type-safe with auto-generated types
const { data, error } = await supabase
  .from('words')
  .select('id, word, definitions')
  .eq('id', wordId)
  .single();

// Good: RPC function for complex queries
const { data } = await supabase.rpc('search_words', {
  query: searchTerm,
  mode: 'latin'
});

// Avoid: Raw SQL (bypasses type safety)
const { data } = await supabase.rpc('raw_sql', { sql: 'SELECT * FROM words' });
```

**Error Handling**

```typescript
// Server functions: Throw errors for client to catch
export const doSomething = createServerFn({ method: 'POST' })
  .handler(async ({ data }) => {
    const result = await riskyOperation();
    if (!result) {
      throw new Error('Operation failed');
    }
    return result;
  });

// Client components: Catch and display errors
try {
  await doSomething({ input });
} catch (error) {
  console.error('Error:', error);
  // Show error toast or message
}
```

**Form Handling**

- Use Zod schemas for validation ([src/lib/forms.ts](src/lib/forms.ts))
- Server functions validate input with `.validator()`
- Client components show validation errors inline

## Related Documentation

- [Main AGENTS.md](../../AGENTS.md): Monorepo architecture, Nx workflows, TypeScript conventions
- [lexico-components AGENTS.md](../../packages/lexico-components/AGENTS.md): Component library patterns, shadcn integration
- [TanStack Start Documentation](https://tanstack.com/router/latest/docs/framework/react/start/overview): Framework reference
- [Supabase Documentation](https://supabase.com/docs): Database, auth, storage, edge functions
- [Tailwind CSS Documentation](https://tailwindcss.com/docs): Utility classes, configuration
