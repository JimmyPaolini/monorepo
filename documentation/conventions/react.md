# React Conventions

## React Version

All projects use **React 19** with the new JSX transform.

### No React Import Needed

```typescript
// ✅ CORRECT: No React import needed (React 19)
import { useState } from "react";

export const Counter = () => {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
};

// ❌ OLD: React import was required in React 17 and earlier
import React from "react";
```

**Why?** React 19's JSX transform automatically imports JSX runtime functions.

## Component Structure

### Organized Sections with Emoji Markers

```typescript
import { useState, useEffect } from "react";
import { type ReactElement } from "react";

// 🔖 Type
export interface UserCardProps {
  userId: string;
  className?: string;
}

// 🧩 Component
export const UserCard = (props: UserCardProps): ReactElement => {
  const { userId, className } = props;

  // 🪝 Hooks (state, effects, custom hooks)
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);

  // 🏗️ Setup (computed values, memoized callbacks)
  const displayName = user?.name ?? "Unknown User";
  const handleClick = useCallback(() => {
    console.log("User clicked", user);
  }, [user]);

  // 💪 Handler (event handlers grouped together)
  const handleRefresh = (): void => {
    setLoading(true);
    fetchUser(userId).then(setUser).finally(() => setLoading(false));
  };

  // 🏁 Early returns (loading, error states)
  if (loading) return <Spinner />;
  if (!user) return <ErrorMessage />;

  // 🎨 Render
  return (
    <Card className={className}>
      <h2>{displayName}</h2>
      <Button onClick={handleClick}>View Profile</Button>
      <Button onClick={handleRefresh}>Refresh</Button>
    </Card>
  );
};
```

### Section Ordering

1. **🔖 Type**: Props interface, types
2. **🧩 Component**: Component declaration
3. **🪝 Hooks**: useState, useEffect, custom hooks
4. **🏗️ Setup**: Computed values, memoized callbacks
5. **💪 Handler**: Event handlers
6. **🏁 Early returns**: Loading, error states
7. **🎨 Render**: JSX return

**Why?** Consistent structure makes components scannable and predictable.

## TanStack Router (lexico)

### File-Based Routing

Routes are generated from the file structure:

```text
src/routes/
├── __root.tsx              # Root layout
├── index.tsx               # / (home)
├── search.tsx              # /search
├── word.$id.tsx            # /word/:id (dynamic param)
├── bookmarks.tsx           # /bookmarks
└── library.tsx             # /library
```

Generated route tree: [src/routeTree.gen.ts](../../applications/lexico/src/routeTree.gen.ts) (auto-generated, **never edit**)

### Route Definitions

```typescript
// routes/word.$id.tsx
import { createFileRoute } from "@tanstack/react-router";

// Define route with loader and component
export const Route = createFileRoute("/word/$id")({
  // Fetch data before rendering (SSR-compatible)
  loader: async ({ params }) => {
    const word = await getWordDetails({ wordId: params.id });
    return { word };
  },
  // Component receives loader data
  component: WordDetailPage,
});

function WordDetailPage() {
  const { word } = Route.useLoaderData(); // Access loader data
  return (
    <div>
      <h1>{word.text}</h1>
      <p>{word.definition}</p>
    </div>
  );
}
```

### Route Guards (Authentication)

```typescript
// routes/bookmarks.tsx
import { createFileRoute, redirect } from "@tanstack/react-router";
import { getCurrentUser } from "../lib/auth";

export const Route = createFileRoute("/bookmarks")({
  // Check auth before loading route
  beforeLoad: async () => {
    const user = await getCurrentUser();
    if (!user) {
      throw redirect({ to: "/login" });
    }
    return { user }; // Pass user to component
  },
  component: BookmarksPage,
});

function BookmarksPage() {
  const { user } = Route.useRouteContext(); // Access beforeLoad data
  return <div>Welcome, {user.name}!</div>;
}
```

### Navigation

```typescript
import { Link, useNavigate } from "@tanstack/react-router";

// Declarative navigation
<Link to="/word/$id" params={{ id: "123" }}>
  View Word
</Link>;

// Programmatic navigation
const navigate = useNavigate();
navigate({ to: "/search", search: { q: "amor" } });
```

### Preloading

```typescript
// router.tsx
import { createRouter } from "@tanstack/react-router";

export const router = createRouter({
  routeTree,
  defaultPreload: "intent", // Preload on hover/focus
});

// Override per route
export const Route = createFileRoute("/word/$id")({
  preload: "viewport", // Preload when route enters viewport
  // OR preload: false to disable
});
```

See [tanstack-start-ssr skill](../skills/tanstack-start-ssr/SKILL.md) for SSR patterns.

## Component Library Integration

### lexico-components

All UI components come from the shared library:

```typescript
// ✅ CORRECT: Import from component library
import { Button, Card, Input, Label } from "@monorepo/lexico-components";

// ❌ WRONG: Copy component code into lexico
// Never duplicate UI components!
```

### Component Usage

```typescript
import { Button } from "@monorepo/lexico-components";

<Button variant="primary" size="lg" onClick={handleClick}>
  Save
</Button>;
```

**Never modify** files in `packages/lexico-components/src/components/ui/` (shadcn-generated). Compose custom components in `packages/lexico-components/src/components/` instead.

See [lexico-components AGENTS.md](../../packages/lexico-components/AGENTS.md) for component library patterns.

## Styling with Tailwind CSS

### Utility-First CSS

```typescript
// ✅ CORRECT: Tailwind utility classes
<div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-md">
  <Avatar src={user.avatar} alt={user.name} />
  <div className="flex-1">
    <h2 className="text-lg font-semibold">{user.name}</h2>
    <p className="text-sm text-gray-500">{user.email}</p>
  </div>
</div>

// ❌ AVOID: Inline styles (not themeable, no hover/responsive)
<div style={{ display: "flex", padding: "1rem" }}>
```

### Theme Tokens

Use CSS variables for themed colors:

```typescript
// ✅ CORRECT: Theme-aware classes
<button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Primary Button
</button>

<div className="bg-background text-foreground border border-border">
  Themed container
</div>

// ❌ AVOID: Hardcoded colors (breaks dark mode)
<button className="bg-blue-600 text-white">Button</button>
```

### Conditional Classes

Use `cn()` utility for merging classes:

```typescript
import { cn } from "@monorepo/lexico-components";

interface ButtonProps {
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Button = ({ variant = "primary", size = "md", className }: ButtonProps) => {
  return (
    <button
      className={cn(
        // Base styles
        "rounded font-medium transition-colors",
        // Variant styles
        {
          "bg-primary text-primary-foreground hover:bg-primary/90": variant === "primary",
          "bg-secondary text-secondary-foreground hover:bg-secondary/90":
            variant === "secondary",
        },
        // Size styles
        {
          "px-2 py-1 text-sm": size === "sm",
          "px-4 py-2": size === "md",
          "px-6 py-3 text-lg": size === "lg",
        },
        // Custom classes (override defaults)
        className,
      )}
    >
      Click me
    </button>
  );
};
```

### Responsive Design

```typescript
// Mobile-first responsive classes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 1 column on mobile, 2 on tablet, 3 on desktop */}
</div>

// Responsive text
<h1 className="text-2xl md:text-4xl lg:text-6xl">
  Responsive Heading
</h1>
```

## State Management

### Local State (useState)

For component-specific state:

```typescript
const [count, setCount] = useState(0);
const [isOpen, setIsOpen] = useState(false);
```

### Server State (TanStack Router Loaders)

For data fetched from APIs:

```typescript
export const Route = createFileRoute("/users")({
  loader: async () => {
    const users = await fetchUsers(); // Server function
    return { users };
  },
});

function UsersPage() {
  const { users } = Route.useLoaderData(); // Server state
}
```

### Form State (Controlled Components)

```typescript
const [formData, setFormData] = useState({ name: "", email: "" });

<Input
  value={formData.name}
  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
/>;
```

## Performance Optimization

### Memoization

Use `useMemo` for expensive computations:

```typescript
const sortedUsers = useMemo(() => {
  return users.sort((a, b) => a.name.localeCompare(b.name));
}, [users]);
```

Use `useCallback` for stable function references (avoid re-renders):

```typescript
const handleSubmit = useCallback(
  (data: FormData) => {
    submitForm(data);
  },
  [submitForm],
);
```

### React.memo

Prevent re-renders of expensive components:

```typescript
export const ExpensiveComponent = React.memo(
  ({ data }: { data: LargeDataset }) => {
    // Expensive rendering logic
    return <div>{/* ... */}</div>;
  },
);
```

## Testing React Components

Component tests use Vitest + React Testing Library:

```typescript
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { UserCard } from "./user-card";

describe("UserCard", () => {
  it("renders user name", () => {
    render(<UserCard userId="123" />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });
});
```

## Common Patterns

### Conditional Rendering

```typescript
// ✅ Short-circuit with &&
{isLoggedIn && <UserMenu />}

// ✅ Ternary for if-else
{isLoading ? <Spinner /> : <Content />}

// ✅ Nullish coalescing for defaults
{user?.name ?? "Guest"}
```

### List Rendering

```typescript
// ✅ CORRECT: Key prop for stable identity
{
  users.map((user) => <UserCard key={user.id} user={user} />);
}

// ❌ WRONG: Index as key (unstable)
{
  users.map((user, index) => <UserCard key={index} user={user} />);
}
```

### Event Handlers

```typescript
// ✅ Arrow function in handler
<button onClick={() => handleClick(user.id)}>Click</button>

// ✅ Inline function definition (for simple logic)
<button onClick={(e) => {
  e.preventDefault();
  handleClick();
}}>Click</button>

// ❌ AVOID: Binding in render (creates new function every render)
<button onClick={handleClick.bind(null, user.id)}>Click</button>
```

## Resources

- [React 19 Documentation](https://react.dev/)
- [TanStack Router Docs](https://tanstack.com/router/latest)
- [TanStack Start SSR Skill](../skills/tanstack-start-ssr/SKILL.md)
- [lexico-components AGENTS.md](../../packages/lexico-components/AGENTS.md)
- [Tailwind CSS](https://tailwindcss.com/)
