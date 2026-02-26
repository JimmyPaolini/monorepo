# Import Organization

## Auto-Sorted Import Order

ESLint plugin `eslint-plugin-import` automatically sorts imports in this order:

1. **Node builtins** (with `node:` prefix)
2. **External packages** (from `node_modules`)
3. **Internal paths** (monorepo packages with `@monorepo/*`)
4. **Parent imports** (`../`)
5. **Sibling imports** (`./`)
6. **Type imports** (always last, separate group)

**Blank lines** separate each group.

**Enforced by**: ESLint rule `import/order`

## Examples

### ✅ Correct Import Order

```typescript
// 1. Node builtins
import { readFile } from "node:fs/promises";
import path from "node:path";

// 2. External packages
import { format } from "date-fns";
import { z } from "zod";
import React from "react";

// 3. Internal paths (@monorepo/*)
import { Button, Card } from "@monorepo/lexico-components";

// 4. Parent imports
import { getUserProfile } from "../api/user";
import { formatCurrency } from "../utils/format";

// 5. Sibling imports
import { UserCard } from "./user-card";
import { config } from "./config";

// 6. Type imports (separate group)
import { type User } from "../types/user";
import { type ApiResponse } from "./types";
```

### ❌ Incorrect Import Order

```typescript
// WRONG: Mixed order, no grouping
import { Button } from "@monorepo/lexico-components";
import { format } from "date-fns";
import { type User } from "./types";
import { readFile } from "node:fs/promises";
import { getUserProfile } from "../api/user";
```

Auto-fix with:

```bash
nx run <project>:lint --fix
```

## TypeScript Path Mappings

Monorepo packages use the `@monorepo/*` namespace defined in [tsconfig.base.json](../../tsconfig.base.json):

```json
{
  "compilerOptions": {
    "paths": {
      "@monorepo/lexico-components": ["packages/lexico-components/src/index.ts"]
    }
  }
}
```

### Benefits

- **Refactor-safe**: Changing file structure doesn't break imports
- **Clear distinction**: External vs. internal packages
- **IDE autocomplete**: Full IntelliSense for monorepo packages
- **Consistent imports**: Same pattern across all projects

### Usage

```typescript
// ✅ CORRECT: Use path alias
import { Button, Card, Input } from "@monorepo/lexico-components";

// ❌ WRONG: Relative path to other project
import { Button } from "../../../packages/lexico-components/src/components/ui/button";
```

## Type-Only Imports

Use `type` keyword for type-only imports:

```typescript
// ✅ CORRECT: Explicit type imports
import { getUser } from "./api";
import { type User, type Profile } from "./types";

// ❌ WRONG: Value import of types (bundles unnecessary code)
import { User, Profile } from "./types";

// ❌ WRONG: Mixed value and type imports
import { getUser, User } from "./api";
```

**Why?**

- **Bundle size**: Type imports are removed at compile time (zero runtime overhead)
- **Clarity**: Clear distinction between runtime code and compile-time types
- **Build optimization**: Bundlers can eliminate type-only modules

**Enforced by**:

- TypeScript: `verbatimModuleSyntax: true` (requires explicit `type` keyword)
- ESLint: `@typescript-eslint/consistent-type-imports`

### Mixed Imports

When importing both values and types from the same module:

```typescript
// ✅ CORRECT: Separate type and value imports
import { getUser } from "./api";
import { type User } from "./api";

// ✅ ALSO CORRECT: Inline type keyword
import { getUser, type User } from "./api";
```

Both styles are acceptable. Choose consistency within a file.

## Named vs. Default Exports

**Prefer named exports** over default exports:

```typescript
// ✅ CORRECT: Named exports
// utils.ts
export function formatDate(date: Date): string {
  // ...
}
export function formatCurrency(amount: number): string {
  // ...
}

// Import
import { formatDate, formatCurrency } from "./utils";

// ❌ AVOID: Default export
// utils.ts
export default function formatDate(date: Date): string {
  // ...
}

// Import (name is arbitrary)
import formatDate from "./utils"; // Could be named anything
```

**Why?**

- **Refactoring**: Renaming is safer with named exports
- **Tree-shaking**: Bundlers can eliminate unused named exports
- **IDE support**: Better autocomplete and refactoring tools
- **Consistency**: Same name in export and import

**Exception**: React components in lexico may use default exports for TanStack Router compatibility:

```typescript
// routes/index.tsx (TanStack Router convention)
export default function HomePage() {
  // ...
}
```

## Side-Effect Imports

Imports with side effects (execute code on import) should be explicit:

```typescript
// ✅ CORRECT: Clearly a side effect import
import "./styles.css"; // CSS import
import "./polyfills"; // Polyfill registration
```

**Avoid side effects in regular modules**. Modules should export values/types, not execute code on import.

## Circular Dependencies

Avoid circular imports (A imports B, B imports A):

```typescript
// ❌ WRONG: Circular dependency
// user.ts
import { type Post } from "./post";
export interface User {
  posts: Post[];
}

// post.ts
import { type User } from "./user";
export interface Post {
  author: User;
}
```

**Solution 1**: Extract shared types to a separate file:

```typescript
// types.ts
export interface User {
  posts: Post[];
}
export interface Post {
  author: User;
}

// user.ts
import { type User } from "./types";
export function getUser(): User {
  // ...
}

// post.ts
import { type Post } from "./types";
export function getPost(): Post {
  // ...
}
```

**Solution 2**: Use import types (TypeScript 3.8+):

```typescript
// post.ts
import { type User } from "./user";
export interface Post {
  author: User;
}

// user.ts
import type * as PostModule from "./post";
export interface User {
  posts: PostModule.Post[];
}
```

**Detection**: Use Dependency Cruiser to detect circular dependencies:

```bash
nx run monorepo:dependency-analysis
```

## Import Grouping Best Practices

### Group Related Imports

```typescript
// ✅ CORRECT: Grouped by purpose
import { useState, useEffect, useCallback } from "react"; // React hooks
import { useRouter, useParams } from "@tanstack/react-router"; // Router hooks

import { Button, Card, Input, Label } from "@monorepo/lexico-components"; // UI components

import { getUser, updateUser, deleteUser } from "./api"; // API functions
import { type User, type Profile } from "./types"; // Types
```

### Avoid Wildcard Imports

```typescript
// ❌ AVOID: Wildcard import (imports everything)
import * as utils from "./utils";

// ✅ CORRECT: Named imports (tree-shakeable)
import { formatDate, formatCurrency } from "./utils";
```

**Exception**: Namespace imports for types or constants:

```typescript
// ✅ ACCEPTABLE: Namespace for types
import type * as Types from "./types";

// Usage
const user: Types.User = { ... };

// ✅ ACCEPTABLE: Namespace for constants
import * as Constants from "./constants";

// Usage
if (status === Constants.HTTP_STATUS.OK) { ... }
```

## Auto-Fix on Save

VS Code automatically sorts imports on save:

```jsonc
// .vscode/settings.json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
  },
}
```

Manual fix:

```bash
nx run <project>:lint --fix
```

## Resources

- [TypeScript Handbook: Modules](https://www.typescriptlang.org/docs/handbook/modules.html)
- [Root tsconfig.base.json](../../tsconfig.base.json) - Path mappings
- [ESLint import/order rule](https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/order.md)
- [TypeScript Conventions](typescript.md) - Type import patterns
