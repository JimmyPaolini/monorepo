---
name: supabase-development
description: Work with Supabase in the lexico project - migrations, RLS policies, Edge Functions, and type generation. Use this skill when modifying the lexico database or authentication.
license: MIT
---

# Supabase Development

This skill covers working with Supabase in the lexico project, including database migrations, Row Level Security (RLS) policies, Edge Functions, and TypeScript type generation.

## Overview

The lexico application uses Supabase for:

- **PostgreSQL database** with RLS policies
- **Authentication** via multiple OAuth providers
- **Edge Functions** for server-side logic
- **Storage** for user-generated content

For comprehensive architecture and patterns, see [applications/lexico/AGENTS.md](../../../applications/lexico/AGENTS.md).

## Development Workflow

### Local Environment

```bash
# Start local Supabase (Docker-based)
nx run lexico:supabase:start

# Stop local environment
nx run lexico:supabase:stop

# Reset database (destructive)
nx run lexico:supabase:reset
```

The local environment runs on:

- **PostgreSQL**: localhost:54322
- **API**: http://localhost:54321
- **Studio**: http://localhost:54323

### Type Generation

After any schema changes, regenerate TypeScript types:

```bash
# Generate types from schema
nx run lexico:supabase:generate-types
```

This creates/updates `applications/lexico/src/lib/database.types.ts` with:

- Table definitions
- RPC function signatures
- Enum types
- View definitions

**IMPORTANT**: Always regenerate types after schema changes or your build will fail type checking.

### After Schema Changes (Checklist)

```bash
nx run lexico:supabase:database-diff
nx run lexico:supabase:generate-types
nx run lexico:test:integration
```

See [testing-strategy](../testing-strategy/SKILL.md) for test naming and target patterns.

## Database Migrations

### Creating Migrations

```bash
# Make changes in Supabase Studio (http://localhost:54323)
# Then generate a migration file

nx run lexico:supabase:database-diff --name="add_bookmarks_table"
```

This creates a new migration file in `applications/lexico/supabase/migrations/` with the schema diff.

### Migration Files

Migrations are timestamped SQL files:

```text
supabase/migrations/
  20240101120000_initial_schema.sql
  20240115093000_add_bookmarks_table.sql
  20240120154500_add_rls_policies.sql
```

### Applying Migrations

Migrations are applied automatically when:

- Starting local environment (`nx run lexico:supabase:start`)
- Deploying to production (via Supabase CLI)

### Migration Best Practices

1. **One logical change per migration** - easier to review and rollback
2. **Include both up and down migrations** when possible
3. **Test locally first** before deploying to production
4. **Use transactions** for multi-statement migrations
5. **Add comments** explaining complex changes

Example migration:

```sql
-- Add bookmarks table for user favorites
CREATE TABLE bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX bookmarks_user_id_idx ON bookmarks(user_id);

-- Enable RLS
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Users can only see their own bookmarks
CREATE POLICY "Users can view own bookmarks"
  ON bookmarks FOR SELECT
  USING (auth.uid() = user_id);
```

## Row Level Security (RLS)

### RLS Policy Patterns

The lexico database enforces RLS on all user-facing tables. Common patterns:

**User-owned resources:**

```sql
CREATE POLICY "Users can manage own bookmarks"
  ON bookmarks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Public read, authenticated write:**

```sql
CREATE POLICY "Public can read words"
  ON words FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can add words"
  ON words FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

**Admin-only access:**

```sql
CREATE POLICY "Admins can manage users"
  ON user_profiles FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');
```

### Testing RLS Policies

Test policies in Supabase Studio SQL Editor with different user contexts:

```sql
-- Set user context
SET LOCAL role TO authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub": "user-uuid-here"}';

-- Test query
SELECT * FROM bookmarks; -- Should only return user's bookmarks
```

## Authentication Flow

### OAuth Configuration

lexico supports multiple OAuth providers configured in Supabase:

- Google OAuth
- GitHub OAuth
- Twitter OAuth

Configuration is in Supabase project settings → Authentication → Providers.

### Session Management

Authentication uses cookie-based sessions for SSR compatibility:

1. User authenticates via OAuth provider
2. Supabase returns session tokens
3. TanStack Start server sets secure HTTP-only cookies
4. Subsequent requests include cookies for server-side auth
5. RLS policies enforce data access based on `auth.uid()`

See [applications/lexico/AGENTS.md](../../applications/lexico/AGENTS.md) for detailed authentication flow diagrams.

### Client-Side Auth

```typescript
import { createBrowserClient } from "@/lib/supabase.client";

const supabase = createBrowserClient();

// Sign in
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
});

// Sign out
await supabase.auth.signOut();
```

### Server-Side Auth

```typescript
import { createServerClient } from "@/lib/supabase.server";

export const getUser = async () => {
  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return user;
};
```

## Edge Functions

Edge Functions run on Supabase's global network. Use for:

- Webhooks
- Scheduled tasks
- Complex server-side logic
- External API integrations

### Creating Edge Functions

```bash
# Create new Edge Function
supabase functions new my-function

# Serve locally
supabase functions serve my-function

# Deploy to production
supabase functions deploy my-function
```

Edge Functions are TypeScript files in `supabase/functions/`:

```text
supabase/functions/
  my-function/
    index.ts
```

### Edge Function Example

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
  );

  // Get user from Authorization header
  const authHeader = req.headers.get("Authorization")!;
  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
  } = await supabase.auth.getUser(token);

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Function logic here
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

## Database Schema

### Key Tables

The lexico database includes:

- **users**: User profiles and preferences
- **bookmarks**: User-saved words
- **word_library**: Custom word collections
- **search_history**: User search tracking

See database migrations in `applications/lexico/supabase/migrations/` for complete schema.

### RPC Functions

Stored procedures for complex queries:

```sql
CREATE OR REPLACE FUNCTION search_words(
  query text,
  limit_count int DEFAULT 20
)
RETURNS TABLE (word_id text, rank numeric)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT id, ts_rank(search_vector, plainto_tsquery('latin', query))
  FROM words
  WHERE search_vector @@ plainto_tsquery('latin', query)
  ORDER BY rank DESC
  LIMIT limit_count;
END;
$$;
```

Call from TypeScript:

```typescript
const { data, error } = await supabase.rpc("search_words", {
  query: "amor",
  limit_count: 20,
});
```

## Environment Variables

### Local Development

Supabase local environment uses these variables (auto-configured):

```bash
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=<local-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<local-service-key>
```

### Production

Production credentials are in Supabase project settings:

```bash
SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_ANON_KEY=<production-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<production-service-key>
```

**NEVER commit service role keys to version control.**

## Common Tasks

### Seed Database

Create seed data in `supabase/seed.sql`:

```sql
-- Insert test data
INSERT INTO words (id, latin, english) VALUES
  ('amor', 'amor', 'love'),
  ('vita', 'vita', 'life');
```

Apply seeds:

```bash
nx run lexico:supabase:reset  # Includes seeding
```

### Backup Database

```bash
# Export schema and data
supabase db dump -f backup.sql

# Schema only
supabase db dump --schema-only -f schema.sql
```

### Debug RLS Policies

Enable RLS logging in SQL:

```sql
ALTER DATABASE postgres SET log_statement = 'all';
```

View logs in Supabase Studio → Logs → Database.

## Troubleshooting

**Type generation fails:**

- Ensure local Supabase is running
- Check for SQL syntax errors in migrations
- Verify all tables have primary keys

**RLS policy blocks queries:**

- Check `auth.uid()` in SQL editor
- Verify user is authenticated
- Review policy USING/WITH CHECK clauses

**Migration conflicts:**

- Reset local database: `nx run lexico:supabase:reset`
- Check for duplicate migration timestamps
- Ensure migrations are idempotent

## Related Documentation

- [applications/lexico/AGENTS.md](../../applications/lexico/AGENTS.md) - Lexico architecture
- [applications/lexico/README.md](../../applications/lexico/README.md) - Getting started
- [Supabase Docs](https://supabase.com/docs) - Official documentation

## Best Practices

1. **Always enable RLS** on user-facing tables
2. **Test policies thoroughly** with different user contexts
3. **Use TypeScript types** for type safety
4. **Regenerate types** after every schema change
5. **Write migrations incrementally** for easier review
6. **Use transactions** for multi-statement operations
7. **Index foreign keys** for better query performance
8. **Document RLS policies** with SQL comments
