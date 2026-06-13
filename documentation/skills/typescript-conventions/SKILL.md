---
name: typescript-conventions
description: TypeScript coding conventions for this monorepo. Use when writing or modifying TypeScript or TSX files, when TypeScript type errors appear, or when asked about strict mode, type imports, naming conventions, return types, or the no-any rule. Covers strict mode flags, explicit return types, type import syntax, naming conventions, and error handling patterns.
license: MIT
---

# TypeScript Conventions

All TypeScript projects in this monorepo use a shared strict configuration. Follow these patterns when writing or reviewing `.ts` and `.tsx` files.

## Strict Mode Configuration

All projects inherit from [configuration/tsconfig.base.json](../../../configuration/tsconfig.base.json):

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "verbatimModuleSyntax": true
  }
}
```

## Key Strict Flags

### `noUncheckedIndexedAccess`

Array and object index access returns `T | undefined`. Always check before use:

```typescript
// ❌ WRONG
const first = items[0];
console.log(first.toUpperCase()); // Object is possibly 'undefined'

// ✅ CORRECT: Optional chaining
console.log(items[0]?.toUpperCase());

// ✅ CORRECT: Nullish coalescing
const first = items[0] ?? "default";

// ✅ CORRECT: Guard check
const first = items[0];
if (first) {
  console.log(first.toUpperCase());
}
```

### `exactOptionalPropertyTypes`

Never assign `undefined` to an optional property — simply omit it:

```typescript
interface User {
  name: string;
  email?: string;
}

// ❌ WRONG
const user: User = { name: "Alice", email: undefined };

// ✅ CORRECT
const user: User = { name: "Alice" };
```

### `verbatimModuleSyntax`

Type-only imports must use the `type` keyword. Enforced by ESLint `@typescript-eslint/consistent-type-imports`.

```typescript
// ❌ WRONG: Ambiguous import
import { User } from "./types";

// ✅ CORRECT: Explicit type import
import { type User } from "./types";

// ✅ CORRECT: Mixed import
import { getUser, type User } from "./api";
```

## Explicit Return Types

All functions must declare return types. Enforced by ESLint `@typescript-eslint/explicit-function-return-type`.

```typescript
// ❌ WRONG: Inferred return type
function getUser(id: string) {
  return { id, name: "Alice" };
}

// ✅ CORRECT
function getUser(id: string): User {
  return { id, name: "Alice" };
}

// ✅ CORRECT: Async
async function fetchUser(id: string): Promise<User> {
  return fetch(`/api/users/${id}`).then((response) => response.json());
}
```

## No `any` Types

Never use `any` — use `unknown` or proper typing instead:

```typescript
// ❌ WRONG
function parse(data: any): any {
  return JSON.parse(data);
}

// ✅ CORRECT: unknown for uncertain types
function parse(data: string): unknown {
  return JSON.parse(data);
}

// ✅ CORRECT: Type guard to narrow unknown
function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "name" in value
  );
}
```

## No Abbreviations

Never use abbreviations or acronyms in identifiers. Use full, descriptive names:

```typescript
// ❌ WRONG
function handleReq(req: Request, res: Response): void { ... }
const err = new Error("failed");

// ✅ CORRECT
function handleRequest(request: Request, response: Response): void { ... }
const error = new Error("failed");
```

**Exceptions**: `args` (reserved word collision with `arguments`), `str` (collision with `string`).

## Naming Conventions

| Pattern | Used for |
| ------- | -------- |
| `PascalCase` | Types, interfaces, classes, React components, enums |
| `camelCase` | Variables, functions, object properties, parameters |
| `UPPER_CASE` | Enum member values, true module-level constants |

```typescript
// ❌ WRONG: Variable is not a true constant
const USER_NAME = "Alice";

// ✅ CORRECT: Configuration constant
const MAX_RETRY_ATTEMPTS = 3;

// ✅ CORRECT: Enum values
enum HttpStatus {
  OK = 200,
  NOT_FOUND = 404,
}
```

## Type Import Organization

Type imports are sorted last in each import group. Enforced by ESLint `perfectionist/sort-imports`.

```typescript
// ✅ CORRECT
import { getUser } from "./api.js";
import { formatDate } from "./utils.js";
import { type User, type Profile } from "./types.js";
```

See [imports.md](../../conventions/imports.md) for the full import ordering rules.

## Error Handling

Always use `unknown` in catch clauses — never `any`:

```typescript
// ❌ WRONG
try {
  await fetchData();
} catch (error: any) {
  console.error(error.message);
}

// ✅ CORRECT
try {
  await fetchData();
} catch (error: unknown) {
  if (error instanceof Error) {
    console.error(error.message);
  }
}
```

See [error-handling skill](../error-handling-patterns/SKILL.md) for Zod validation and retry patterns.

## Common Gotchas

### Index signatures return `string | undefined`

```typescript
const obj: { [key: string]: string } = { name: "Alice" };
const value = obj["email"]; // Type: string | undefined — check before use
```

### Nullish coalescing vs. logical OR

```typescript
// ❌ Treats 0 and "" as missing
const count = userInput || 10;

// ✅ Only treats null/undefined as missing
const count = userInput ?? 10;
```

### File extensions in imports

NodeNext module resolution requires `.js` extensions on relative imports even for `.ts` source files:

```typescript
// ❌ WRONG
import { getUser } from "./api";

// ✅ CORRECT
import { getUser } from "./api.js";
```

## Verification

After writing TypeScript, run the validation suite to catch issues early:

```bash
# Auto-fix format and lint
pnpm exec nx run <project>:analyze-code --configuration=write

# Verify no remaining issues
pnpm exec nx run <project>:analyze-code --configuration=check
```

See the [validate-code skill](../validate-code/SKILL.md) for the full validation workflow.

## Resources

- [configuration/tsconfig.base.json](../../../configuration/tsconfig.base.json) — Shared strict TypeScript config
- [error-handling skill](../error-handling-patterns/SKILL.md) — Typed error patterns, Zod validation
- [validate-code skill](../validate-code/SKILL.md) — Run the full quality suite after changes
