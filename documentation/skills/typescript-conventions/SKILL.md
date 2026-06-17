---
name: typescript-conventions
description: TypeScript coding conventions for this monorepo. Use when writing or modifying TypeScript or TSX files, when TypeScript type errors appear, or when asked about strict mode, type imports, naming conventions, return types, the no-any rule, async functions, floating promises, exhaustive switches, readonly properties, or non-null assertions. Covers strict mode flags, explicit return types, type import syntax, naming conventions, error handling, and common gotchas.
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

## Readonly Class Properties

Properties that are never mutated after construction must be marked `readonly`. Enforced by ESLint `@typescript-eslint/prefer-readonly`.

```typescript
// ❌ WRONG
class UserService {
  private logger: Logger;
  constructor(logger: Logger) {
    this.logger = logger;
  }
}

// ✅ CORRECT
class UserService {
  constructor(private readonly logger: Logger) {}
}
```

## No Non-Null Assertions

Never use `!` to force-unwrap nullable values — use optional chaining or explicit guards. Enforced by ESLint `@typescript-eslint/no-non-null-assertion`.

```typescript
// ❌ WRONG
const name = user!.name;

// ✅ CORRECT
const name = user?.name ?? "unknown";
```

## Exhaustive Switch Statements

Switch statements on union types must handle every member. Enforced by ESLint `@typescript-eslint/switch-exhaustiveness-check`.

```typescript
type Status = "active" | "inactive" | "pending";

// ❌ WRONG: missing "pending"
switch (status) {
  case "active": return enable();
  case "inactive": return disable();
}

// ✅ CORRECT
switch (status) {
  case "active": return enable();
  case "inactive": return disable();
  case "pending": return queue();
}
```

## Async Functions

All functions returning a `Promise` must use the `async` keyword. Enforced by ESLint `@typescript-eslint/promise-function-async`.

```typescript
// ❌ WRONG
function fetchUser(id: string): Promise<User> {
  return apiClient.get(`/users/${id}`);
}

// ✅ CORRECT
async function fetchUser(id: string): Promise<User> {
  return apiClient.get(`/users/${id}`);
}
```

## No Floating Promises

Every Promise must be awaited or explicitly `void`-annotated. Enforced by ESLint `@typescript-eslint/no-floating-promises`.

```typescript
// ❌ WRONG: unhandled rejection silently swallowed
sendEmail(user.email);

// ✅ CORRECT: await it
await sendEmail(user.email);

// ✅ CORRECT: intentional fire-and-forget
void sendEmail(user.email);
```

## Consistent Returns

All code paths in a function must uniformly return or not return a value. Enforced by ESLint `@typescript-eslint/consistent-return`.

```typescript
// ❌ WRONG: some paths return, one falls through
function getLabel(status: string): string | undefined {
  if (status === "active") return "Active";
  if (status === "inactive") return "Inactive";
}

// ✅ CORRECT
function getLabel(status: string): string {
  if (status === "active") return "Active";
  if (status === "inactive") return "Inactive";
  return "Unknown";
}
```

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

## Common Gotchas (Additional)

### Index Signatures

```typescript
const obj: { [key: string]: string } = { name: "Alice" };
const value = obj["email"]; // Type: string | undefined — check before use
if (value) {
  console.log(value.toUpperCase());
}
```

### Nullish Coalescing vs. Logical OR

```typescript
// ❌ WRONG: 0, "", false treated as missing
const count = userInput || 10;

// ✅ CORRECT: only null/undefined trigger fallback
const count = userInput ?? 10;
```

## Emoji Standardization

Emojis must not use Variation Selector-16 (`\uFE0F`). A pre-commit hook strips variation selectors from all staged files automatically.

- ❌ **WRONG**: `🏗` (contains hidden `\uFE0F`)
- ✅ **CORRECT**: `🏗` (plain emoji)

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

## Section Comments

Use emoji section comments to organize code into logical groups. See the [commenting skill](../commenting/SKILL.md) for the full format, emoji reference, and anti-patterns.

```typescript
// ✅ CORRECT: emoji then capitalized section name
// 🔧 Configuration

const MAX_RETRIES = 3;

// 🧪 Tests

describe("...", () => { ... });

// ❌ WRONG: dash dividers
// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
```

## Readonly Class Properties (Additional)

Class properties that are never mutated after construction must be marked `readonly`.
Enforced by ESLint `@typescript-eslint/prefer-readonly`.

```typescript
// ❌ WRONG
class UserService {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }
}

// ✅ CORRECT
class UserService {
  constructor(private readonly logger: Logger) {}
}
```

## No Non-Null Assertions (Additional)

Never use `!` to bypass null checks. Use optional chaining, nullish coalescing, or explicit guards.
Enforced by ESLint `@typescript-eslint/no-non-null-assertion`.

```typescript
// ❌ WRONG
const name = user!.name;

// ✅ CORRECT
const name = user?.name ?? "unknown";

// ✅ CORRECT: explicit guard
if (!user) throw new Error("user is required");
const name = user.name;
```

## Exhaustive Switch Statements (Additional)

Switch statements on union types must be exhaustive — every member must have a case.
Enforced by ESLint `@typescript-eslint/switch-exhaustiveness-check`.

```typescript
type Status = "active" | "inactive" | "pending";

// ❌ WRONG: missing "pending" case
switch (status) {
  case "active":
    return enable();
  case "inactive":
    return disable();
}

// ✅ CORRECT: all cases handled
switch (status) {
  case "active":
    return enable();
  case "inactive":
    return disable();
  case "pending":
    return queue();
}
```

## Async Functions (Additional)

Functions that return `Promise` must use the `async` keyword.
Enforced by ESLint `@typescript-eslint/promise-function-async`.

```typescript
// ❌ WRONG: returns Promise without async
function fetchUser(id: string): Promise<User> {
  return fetch(`/api/users/${id}`).then((response) => response.json() as Promise<User>);
}

// ✅ CORRECT
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  return response.json() as Promise<User>;
}
```

## Handle All Promises

Every Promise must be awaited or explicitly handled. Do not let promises float unhandled.
Enforced by ESLint `@typescript-eslint/no-floating-promises`.

```typescript
// ❌ WRONG: fire-and-forget (unhandled rejection)
sendEmail(user.email);

// ✅ CORRECT: await or void-annotate intentional fire-and-forget
await sendEmail(user.email);

// ✅ CORRECT: explicit void for truly intentional fire-and-forget
void sendEmail(user.email);
```

## Consistent Returns (Additional)

Functions must either always return a value or never return a value — no mixed paths.
Enforced by ESLint `@typescript-eslint/consistent-return`.

```typescript
// ❌ WRONG: some paths return, others don't
function getLabel(status: string): string | undefined {
  if (status === "active") return "Active";
  if (status === "inactive") return "Inactive";
  // implicit undefined return
}

// ✅ CORRECT: all paths return
function getLabel(status: string): string {
  if (status === "active") return "Active";
  if (status === "inactive") return "Inactive";
  return "Unknown";
}
```

## Control Flow Best Practices

### Always Use Curly Braces

All control flow statements (`if`, `else`, `for`, `while`) must use curly braces.
Enforced by ESLint `curly: "all"`.

```typescript
// ❌ WRONG
if (condition) doSomething();

// ✅ CORRECT
if (condition) {
  doSomething();
}
```

### No Else After Return (Early Returns)

When the `if` block returns, omit the `else` — use early returns instead.
Enforced by ESLint `no-else-return`.

```typescript
// ❌ WRONG
function getStatus(isActive: boolean): string {
  if (isActive) {
    return "active";
  } else {
    return "inactive";
  }
}

// ✅ CORRECT: early return, no else
function getStatus(isActive: boolean): string {
  if (isActive) {
    return "active";
  }
  return "inactive";
}
```

### Object Shorthand

Always use property shorthand when the key and value names match.
Enforced by ESLint `object-shorthand: "always"`.

```typescript
// ❌ WRONG
const name = "Alice";
const user = { name: name, age: age };

// ✅ CORRECT
const user = { name, age };
```

### Template Literals Over Concatenation

Use template literals instead of string concatenation.
Enforced by ESLint `prefer-template`.

```typescript
// ❌ WRONG
const message = "Hello, " + name + "!";

// ✅ CORRECT
const message = `Hello, ${name}!`;
```

## Function Parameter Limits

Functions may have at most **3 parameters**. If more are needed, group related parameters into
an options object. Constructors may have up to 12 parameters (for dependency injection).
Enforced by ESLint `better-max-params/better-max-params`.

```typescript
// ❌ WRONG: too many parameters
function createUser(
  name: string,
  email: string,
  role: string,
  age: number,
): User { ... }

// ✅ CORRECT: options object
interface CreateUserOptions {
  age: number;
  email: string;
  name: string;
  role: string;
}

function createUser(options: CreateUserOptions): User { ... }
```

## JSDoc on Public APIs

Public functions, methods, classes, interfaces, types, and enums must have JSDoc comments.
Only include JSDoc when it adds non-obvious context — do not restate the signature.
Enforced by ESLint `jsdoc/require-jsdoc` and `tsdoc/syntax`.

```typescript
// ❌ WRONG: missing JSDoc on public function
export function calculateOrbit(body: CelestialBody): OrbitalPath { ... }

// ❌ WRONG: JSDoc that just restates the signature
/**
 * Calculates the orbit.
 * @param body - The celestial body.
 * @returns The orbital path.
 */
export function calculateOrbit(body: CelestialBody): OrbitalPath { ... }

// ✅ CORRECT: JSDoc adds non-obvious context
/**
 * Calculates the J2000.0 osculating orbital elements for a solar-system body.
 * Uses the JPL DE441 ephemeris — results are only valid between 1800–2050.
 */
export function calculateOrbit(body: CelestialBody): OrbitalPath { ... }
```

## Code Complexity Limits

Keep functions and files within these thresholds to maintain readability.
See the [simplify-code skill](../simplify-code/SKILL.md) for refactoring guidance.

| Limit | Threshold | ESLint Rule |
| ----- | --------- | ----------- |
| Lines per function | 64 | `max-lines-per-function` |
| Statements per function | 16 | `max-statements` |
| Cyclomatic complexity | 8 | `complexity` |
| Nesting depth | 4 | `max-depth` |
| Lines per file | 512 | `max-lines` |
| Parameters per function | 3 | `better-max-params` |
| Classes per file | 1 | `max-classes-per-file` |

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
