---
name: tanstack-start-ssr
description: Build SSR applications with TanStack Start - server functions, file-based routing, and data loading patterns. Use this skill when working on the lexico web application.
license: MIT
---

# TanStack Start SSR

This skill covers building server-side rendered (SSR) applications with TanStack Start, including server functions, file-based routing, data loading, and cookie-based authentication.

## Overview

The lexico application uses TanStack Start for:

- **File-based routing** with type-safe navigation
- **Server functions** for secure backend logic
- **SSR** for fast initial page loads and SEO
- **Streaming** for progressive data loading
- **Cookie-based auth** compatible with Supabase

For comprehensive patterns and examples, see [applications/lexico/AGENTS.md](../../../applications/lexico/AGENTS.md).

## Project Structure

```text
applications/lexico/
  src/
    routes/          # File-based routes
      __root.tsx     # Root layout
      index.tsx      # Home page (/)
      search.tsx     # Search page (/search)
      word.$id.tsx   # Dynamic route (/word/:id)
      bookmarks.tsx  # Bookmarks page (/bookmarks, auth-guarded)
      library.tsx    # Library page (/library, auth-guarded)
      settings.tsx   # Settings page (/settings, auth-guarded)
      tools.tsx      # Tools page (/tools, auth-guarded)
    components/      # React components
    lib/             # Utilities and server functions
      supabase.ts         # Client-side Supabase singleton
      supabase-server.ts  # Server-side Supabase helper
      auth.ts             # Auth server functions
      search.ts           # Search server functions
      bookmarks.ts        # Bookmarks server functions
```

## File-Based Routing

### Route Files

Routes are defined by file names in `src/routes/`:

- `index.tsx` → `/`
- `search.tsx` → `/search`
- `word.$id.tsx` → `/word/:id`
- `bookmarks.tsx` → `/bookmarks`
- `library.tsx` → `/library`
- `settings.tsx` → `/settings`

### Route Configuration

Each route exports configuration:

```tsx
// src/routes/word.$id.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/word/$id")({
  // Data loading
  loader: async ({ params }) => {
    const word = await fetchWord(params.id);
    return { word };
  },

  // Error handling
  errorComponent: ({ error }) => <div>Error: {error.message}</div>,

  // Pending state
  pendingComponent: () => <div>Loading...</div>,

  // Component
  component: WordPage,
});

function WordPage() {
  const { word } = Route.useLoaderData();
  return <div>{word.latin}</div>;
}
```

### Dynamic Routes

Use `$` prefix for dynamic segments:

```tsx
// src/routes/word.$id.tsx
function WordPage() {
  const { id } = Route.useParams(); // Type-safe params
  // ...
}
```

### Search Params

Access query parameters with type safety:

```tsx
const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      q: (search.q as string) || "",
      page: Number(search.page) || 1,
    };
  },
});

function SearchPage() {
  const { q, page } = Route.useSearch(); // Type-safe search params
  // ...
}
```

## Server Functions

Server functions run only on the server and can access secrets, databases, etc.

### Creating Server Functions

```typescript
// src/lib/search.ts
import { createServerFn } from "@tanstack/react-start";
import { getSupabaseServerClient } from "~/lib/supabase-server";

export const getWord = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();

    const { data: word, error } = await supabase
      .from("words")
      .select("*")
      .eq("id", data.id)
      .single();

    if (error) throw error;
    return word;
  });
```

### Calling Server Functions

From client components:

```tsx
import { getWord } from "~/lib/search";

function WordComponent({ id }: { id: string }) {
  const [word, setWord] = useState(null);

  useEffect(() => {
    getWord({ data: { id } }).then(setWord);
  }, [id]);

  return <div>{word?.latin}</div>;
}
```

From loaders:

```tsx
export const Route = createFileRoute("/word/$id")({
  loader: async ({ params }) => {
    const word = await getWord({ data: { id: params.id } });
    return { word };
  },
});
```

### Server Function Patterns

**Authenticated requests:**

```typescript
export const bookmarkWord = createServerFn({ method: "POST" })
  .inputValidator((data: { wordId: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();

    // Get authenticated user
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) {
      throw new Error("Unauthorized");
    }

    // Create bookmark (RLS policy enforces ownership)
    const { data: bookmark, error: bookmarkError } = await supabase
      .from("bookmarks")
      .insert({ user_id: user.id, word_id: data.wordId })
      .select()
      .single();

    if (bookmarkError) throw bookmarkError;
    return bookmark;
  });
```

**File uploads:**

```typescript
export const uploadImage = createServerFn({ method: "POST" })
  .inputValidator((data: { file: File }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();

    const { data: upload, error } = await supabase.storage
      .from("images")
      .upload(`${Date.now()}-${data.file.name}`, data.file);

    if (error) throw error;
    return upload;
  });
```

## Data Loading

### Loader Pattern

Loaders fetch data before rendering:

```tsx
export const Route = createFileRoute("/search")({
  loader: async ({ context, search }) => {
    const results = await searchWords(search.q);
    return { results };
  },
  component: SearchPage,
});

function SearchPage() {
  const { results } = Route.useLoaderData();
  return <SearchResults results={results} />;
}
```

### Parallel Loading

Load multiple resources in parallel:

```tsx
loader: async ({ params }) => {
  const [word, examples, translations] = await Promise.all([
    fetchWord(params.id),
    fetchExamples(params.id),
    fetchTranslations(params.id),
  ]);

  return { word, examples, translations };
};
```

### Error Handling

Handle loader errors:

```tsx
export const Route = createFileRoute("/word/$id")({
  loader: async ({ params }) => {
    const word = await fetchWord(params.id);
    if (!word) {
      throw new Error("Word not found");
    }
    return { word };
  },
  errorComponent: ({ error }) => (
    <div className="error">
      <h1>Error</h1>
      <p>{error.message}</p>
    </div>
  ),
});
```

### Pending States

Show loading UI while data loads:

```tsx
export const Route = createFileRoute("/search")({
  loader: async ({ search }) => {
    const results = await searchWords(search.q);
    return { results };
  },
  pendingComponent: () => (
    <div className="loading">
      <Spinner />
      <p>Searching...</p>
    </div>
  ),
});
```

## Cookie-Based Authentication

TanStack Start uses HTTP-only cookies for authentication, compatible with Supabase.

### Server-Side Supabase Client

The server client is created via `getSupabaseServerClient()` from `src/lib/supabase-server.ts`, which reads/writes auth cookies using `@tanstack/react-start/server` request helpers:

```typescript
// src/lib/supabase-server.ts
import { createServerClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import { getRequestHeader, setResponseHeader } from "@tanstack/react-start/server";

export function getSupabaseServerClient(): SupabaseClient<Database> {
  const cookieHeader = getRequestHeader("cookie") ?? "";

  return createServerClient<Database>(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_ANON_KEY"]!,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(cookieHeader).map(({ name, value }) => ({
            name,
            value: value ?? "",
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            setResponseHeader("Set-Cookie", serializeCookieHeader(name, value, options));
          });
        },
      },
    },
  );
}
```

### Authentication Flow

**Sign In:**

```typescript
// Server function in src/lib/auth.ts
import { createServerFn } from "@tanstack/react-start";
import { getSupabaseServerClient } from "~/lib/supabase-server";

export const signIn = createServerFn({ method: "POST" })
  .inputValidator((data: { provider: "google" | "github" }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();

    const { data: authData, error } = await supabase.auth.signInWithOAuth({
      provider: data.provider,
      options: {
        redirectTo: `${process.env["APP_URL"]}/auth/callback`,
      },
    });

    if (error) throw error;
    return authData;
  });
```

**Auth Callback:**

```tsx
// src/routes/auth/callback.tsx
export const Route = createFileRoute("/auth/callback")({
  loader: async ({ search }) => {
    const code = (search as { code?: string }).code;

    if (code) {
      const supabase = getSupabaseServerClient();
      await supabase.auth.exchangeCodeForSession(code);
    }

    // Redirect to home
    throw redirect({ to: "/" });
  },
});
```

**Get Current User:**

```typescript
// Server function in src/lib/auth.ts
export const getCurrentUser = createServerFn({ method: "GET" }).handler(
  async () => {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  },
);
```

### Protected Routes

Require authentication in loaders:

```tsx
export const Route = createFileRoute("/dashboard")({
  loader: async () => {
    const user = await getCurrentUser();

    if (!user) {
      throw redirect({ to: "/login" });
    }

    const data = await fetchDashboardData();
    return { user, data };
  },
});
```

## SSR Best Practices

### 1. Minimize Client JavaScript

Use server functions instead of client-side API calls:

❌ **Don't:**

```tsx
// Exposes API keys, requires client-side bundle
function Component() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch("/api/data", {
      headers: { "X-API-Key": process.env.API_KEY },
    })
      .then((r) => r.json())
      .then(setData);
  }, []);
}
```

✅ **Do:**

```tsx
// Server function keeps secrets secure
const getData = createServerFn({ method: "GET" }).handler(async () => {
  const response = await fetch("https://api.example.com/data", {
    headers: { "X-API-Key": process.env.API_KEY },
  });
  return response.json();
});

export const Route = createFileRoute("/page")({
  loader: async () => {
    const data = await getData();
    return { data };
  },
});
```

### 2. Use Streaming for Long Operations

Stream data as it becomes available:

```tsx
export const Route = createFileRoute("/dashboard")({
  loader: async () => {
    // Fast data loads immediately
    const user = await getCurrentUser();

    return {
      user,
      // Slow data streams in
      analytics: defer(fetchAnalytics()),
    };
  },
});

function Dashboard() {
  const { user, analytics } = Route.useLoaderData();

  return (
    <div>
      <h1>Welcome {user.name}</h1>

      <Suspense fallback={<Spinner />}>
        <Await promise={analytics}>
          {(data) => <AnalyticsChart data={data} />}
        </Await>
      </Suspense>
    </div>
  );
}
```

### 3. Optimize Images

Use responsive images:

```tsx
<img
  src="/images/hero.jpg"
  srcSet="/images/hero-400.jpg 400w, /images/hero-800.jpg 800w"
  sizes="(max-width: 600px) 400px, 800px"
  alt="Hero"
  loading="lazy"
/>
```

### 4. Prefetch Critical Routes

Prefetch data for navigation targets:

```tsx
import { Link } from "@tanstack/react-router";

<Link
  to="/word/$id"
  params={{ id: "amor" }}
  preload="intent" // Prefetch on hover
>
  View Word
</Link>;
```

## Common Patterns

### Form Handling

```tsx
const submitForm = createServerFn({ method: "POST" })
  .inputValidator((data: { name: string; email: string }) => data)
  .handler(async ({ data }) => {
    // Validate
    if (!data.email.includes("@")) {
      throw new Error("Invalid email");
    }

    // Save to database
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("contacts").insert(data);

    if (error) throw error;
    return { success: true };
  });

function ContactForm() {
  const [result, setResult] = useState<{ success: boolean }>();

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const result = await submitForm({
          data: {
            name: formData.get("name") as string,
            email: formData.get("email") as string,
          },
        });
        setResult(result);
      }}
    >
      <input
        name="name"
        required
      />
      <input
        name="email"
        type="email"
        required
      />
      <button type="submit">Submit</button>

      {result?.success && <p>Submitted!</p>}
    </form>
  );
}
```

## Related Documentation

- [applications/lexico/AGENTS.md](../../../applications/lexico/AGENTS.md) - Lexico architecture
- [TanStack Start Docs](https://tanstack.com/start) - Official documentation
- [applications/lexico/README.md](../../../applications/lexico/README.md) - Current Lexico feature snapshot

## Troubleshooting

**Server function not found:**

- Ensure function is exported from server/functions/
- Check import path is correct
- Restart dev server

**Cookies not persisting:**

- Verify the server function or route is wired into the current app shell
- Check cookie domain matches the app domain if you add auth later
- Ensure secure flag usage matches the current environment

**Type errors in loaders:**

- Check loader return type matches component expectations
- Verify validator schema matches handler parameters
- Keep route contracts aligned with the placeholder server functions in `src/lib/`
