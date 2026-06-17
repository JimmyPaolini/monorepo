---
name: imports-conventions
description: Import organization conventions for TypeScript in this monorepo. Use when writing or reviewing imports, when ESLint reports import order errors, when asked about monorepo path aliases, type-only imports, file extensions in imports, or named vs default exports. Covers auto-sorted import order, NodeNext .js extensions, relative parent import avoidance, and the monorepo namespace.
license: MIT
---

# Imports Conventions

Import organization is auto-enforced by ESLint `perfectionist/sort-imports`. Always run `nx run <project>:lint --fix` to auto-sort.

## Auto-Sorted Import Order

Imports are grouped and sorted in this order:

1. **Node builtins** (with `node:` prefix)
2. **External packages** (from `node_modules`)
3. **Internal paths** (`@monorepo/*`)
4. **Parent imports** (`../`)
5. **Sibling imports** (`./`)
6. **Index imports** (`./index`)
7. **Type imports** (always last, separate group)

**Blank lines** separate each group.

### ✅ Correct Import Order

```typescript
// 1. Node builtins
import { readFile } from "node:fs/promises";
import path from "node:path";

// 2. External packages
import { format } from "date-fns";
import { z } from "zod";

// 3. Internal paths (@monorepo/*)
import { Button, Card } from "@monorepo/lexico-components";

// 4. Parent imports
import { getUserProfile } from "../api/user.js";

// 5. Sibling imports
import { UserCard } from "./user-card.js";

// 6. Type imports (separate group)
import { type User } from "../types/user.js";
import { type ApiResponse } from "./types.js";
```

### ❌ Incorrect Import Order

```typescript
// WRONG: mixed order, no grouping, missing .js extensions
import { Button } from "@monorepo/lexico-components";
import { format } from "date-fns";
import { type User } from "./types.js";
import { readFile } from "node:fs/promises";
import { getUserProfile } from "../api/user.js";
```

## File Extensions

Always include `.js` extensions for relative imports. The workspace uses **NodeNext** module resolution which requires explicit extensions.

```typescript
// ✅ CORRECT
import { getUserProfile } from "../api/user.js";
import { UserCard } from "./user-card.js";

// ❌ WRONG: missing .js extension
import { getUserProfile } from "../api/user";
import { UserCard } from "./user-card";
```

## No Parent Directory Imports

Avoid `../` imports. Use `@monorepo/*` path mappings instead. Enforced by ESLint `import/no-relative-parent-imports` (warning).

```typescript
// ✅ CORRECT
import { getUserProfile } from "@monorepo/lexico-entities";

// ❌ AVOID
import { getUserProfile } from "../../packages/lexico-entities/src/user.js";
```

## @monorepo/* Path Mappings

Monorepo packages use the `@monorepo/*` namespace defined in `configuration/tsconfig.base.json`:

| Path alias | Resolves to |
| ---------- | ----------- |
| `@monorepo/lexico-components` | `packages/lexico-components/src/index.ts` |
| `@monorepo/lexico-entities` | `packages/lexico-entities/src/index.ts` |

**Benefits**: Refactor-safe, clear external vs. internal distinction, full IntelliSense.

## Type-Only Imports

Use the `type` keyword for type-only imports. Enforced by TypeScript `verbatimModuleSyntax: true` and ESLint `@typescript-eslint/consistent-type-imports`.

```typescript
// ✅ CORRECT: Explicit type imports
import { getUser } from "./api.js";
import { type User, type Profile } from "./types.js";

// ✅ ALSO CORRECT: Inline type keyword
import { getUser, type User } from "./api.js";

// ❌ WRONG: Value import of a type (bundles unnecessary code)
import { User, Profile } from "./types.js";
```

**Why?** Type imports are removed at compile time — zero runtime overhead, clearer intent, better tree-shaking.

## Named vs. Default Exports

Prefer **named exports** over default exports:

```typescript
// ✅ CORRECT: Named exports
export function formatDate(date: Date): string { ... }
export function formatCurrency(amount: number): string { ... }

// Import
import { formatDate, formatCurrency } from "./utils.js";

// ❌ AVOID: Default export
export default function formatDate(date: Date): string { ... }
```

**Why?** Named exports are easier to rename, tree-shake, and auto-import.
