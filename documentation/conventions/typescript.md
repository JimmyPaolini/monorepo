# TypeScript Conventions

## Strict Mode Configuration

All projects inherit strict TypeScript settings from [tsconfig.base.json](../../tsconfig.base.json):

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

### Key Strict Flags

#### `noUncheckedIndexedAccess`

Array and object access requires null checks:

```typescript
// ❌ WRONG: Assumes index exists
const items = ["a", "b", "c"];
const first = items[0]; // Type: string | undefined (compiler error if used as string)
console.log(first.toUpperCase()); // Error: Object is possibly 'undefined'

// ✅ CORRECT: Check for undefined
const items = ["a", "b", "c"];
const first = items[0];
if (first) {
  console.log(first.toUpperCase());
}

// ✅ CORRECT: Use optional chaining
console.log(items[0]?.toUpperCase());

// ✅ CORRECT: Use nullish coalescing
const first = items[0] ?? "default";
```

#### `exactOptionalPropertyTypes`

Disallows setting optional properties to `undefined`:

```typescript
interface User {
  name: string;
  email?: string; // Optional
}

// ❌ WRONG: Cannot explicitly set optional property to undefined
const user: User = { name: "Alice", email: undefined };

// ✅ CORRECT: Omit optional property
const user: User = { name: "Alice" };

// ✅ CORRECT: Set to actual value
const user: User = { name: "Alice", email: "alice@example.com" };
```

**Why?** Forces explicit handling of missing vs. explicitly undefined values.

#### `verbatimModuleSyntax`

Requires explicit `type` keyword for type-only imports:

```typescript
// ❌ WRONG: Ambiguous import (value or type?)
import { User } from "./types";

// ✅ CORRECT: Explicit type import
import { type User } from "./types";

// ✅ CORRECT: Value import
import { getUser } from "./api";

// ✅ CORRECT: Mixed import
import { getUser, type User } from "./api";
```

**Why?** Prevents runtime imports of types (reduces bundle size, clarifies intent).

**Enforced by**: ESLint rule `@typescript-eslint/consistent-type-imports`

## Type Standards

### Explicit Return Types

All functions must declare return types:

```typescript
// ❌ WRONG: Inferred return type
function getUser(id: string) {
  return { id, name: "Alice" };
}

// ✅ CORRECT: Explicit return type
function getUser(id: string): { id: string; name: string } {
  return { id, name: "Alice" };
}

## Emoji Standardization

To ensure consistent rendering across all editors and platforms, emojis must not use **Variation Selector-16 (`\uFE0F`)**. These selectors can cause rendering issues (appearing as question marks) in some environments.

- ❌ **WRONG**: `🏗` (contains hidden `\uFE0F`)
- ✅ **CORRECT**: `🏗` (plain emoji)

This is enforced automatically by a pre-commit hook that strips variation selectors from all staged files.

// ✅ CORRECT: Named interface
interface User {
  id: string;
  name: string;
}

function getUser(id: string): User {
  return { id, name: "Alice" };
}
```

**Why?** Improves readability, catches errors at function boundaries, enables better refactoring.

**Enforced by**: ESLint rule `@typescript-eslint/explicit-function-return-type`

### No `any` Types

Never use `any` — use `unknown` or proper typing:

```typescript
// ❌ WRONG: `any` disables type checking
function parse(data: any): any {
  return JSON.parse(data);
}

// ✅ CORRECT: Use `unknown` for uncertain types
function parse(data: string): unknown {
  return JSON.parse(data);
}

// ✅ BETTER: Use type guards to narrow
interface ApiResponse {
  status: number;
  data: unknown;
}

function isUserResponse(response: unknown): response is {
  id: string;
  name: string;
} {
  return (
    typeof response === "object" &&
    response !== null &&
    "id" in response &&
    "name" in response
  );
}

const response = await fetch("/api/user");
const data: unknown = await response.json();

if (isUserResponse(data)) {
  console.log(data.name); // Type: string
}
```

## Naming Conventions

### PascalCase

- Types and interfaces
- Classes
- React components
- Enum types

```typescript
interface UserProfile {
  // ...
}

type ApiResponse = {
  // ...
};

class DatabaseClient {
  // ...
}

enum Status {
  Active,
  Inactive,
}

// React component
const UserCard = (props: UserCardProps) => {
  // ...
};
```

### camelCase

- Variables
- Functions
- Object properties
- Parameters

```typescript
const userName = "Alice";

function getUserProfile(userId: string): UserProfile {
  // ...
}

const config = {
  apiEndpoint: "https://api.example.com",
  retryAttempts: 3,
};
```

### UPPER_CASE

- Enum members (values)
- Constants (truly immutable values)

```typescript
enum HttpStatus {
  OK = 200,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}

const MAX_RETRY_ATTEMPTS = 3;
const API_TIMEOUT_MS = 5000;
```

**Note**: Regular variables (even if `const`) use camelCase:

```typescript
// ❌ WRONG: Variable is not a true constant
const USER_NAME = "Alice"; // Should be userName

// ✅ CORRECT: Configuration constant
const MAX_RETRY_ATTEMPTS = 3;
```

## Type Import Organization

Type imports always come last in import blocks:

```typescript
// ✅ CORRECT: Type imports last
import { getUser } from "./api";
import { formatDate } from "./utils";
import { type User, type Profile } from "./types";

// ❌ WRONG: Mixed value and type imports
import { getUser, type User } from "./api";
```

**Why?** Clear visual separation between runtime code and compile-time types.

**Enforced by**: ESLint rule `perfectionist/sort-imports`

See [imports.md](imports.md) for full import organization rules.

## Error Handling

### Typed Errors

Avoid `catch (e: any)` — always use `unknown` and narrow:

```typescript
// ❌ WRONG: `any` in catch
try {
  await fetchData();
} catch (e: any) {
  console.error(e.message); // No type safety
}

// ✅ CORRECT: `unknown` with type guard
try {
  await fetchData();
} catch (e: unknown) {
  if (e instanceof Error) {
    console.error(e.message); // Type: string
  } else {
    console.error("Unknown error", e);
  }
}

// ✅ BETTER: Zod for runtime validation
import { z } from "zod";

const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
});

try {
  const response = await fetch("/api/data");
  const data = await response.json();
  if (!response.ok) {
    const error = ApiErrorSchema.parse(data);
    throw new Error(`API error ${error.code}: ${error.message}`);
  }
} catch (e: unknown) {
  if (e instanceof Error) {
    console.error(e.message);
  }
}
```

See [error-handling.md](../code-quality/error-handling.md) for full error handling patterns.

## Type Coverage

Projects track type coverage to ensure comprehensive typing:

```bash
# Generate type coverage report
nx run caelundas:type-coverage
nx run lexico:type-coverage

# View report
cat applications/caelundas/type-coverage-report.txt
```

**Target**: 100% type coverage (no implicit `any`)

## Common Gotchas

### Index Signatures

```typescript
// Problem: Index access returns `undefined`
const obj: { [key: string]: string } = { name: "Alice" };
const value = obj["email"]; // Type: string | undefined

// Solution: Check before use
const value = obj["email"];
if (value) {
  console.log(value.toUpperCase());
}
```

### Optional Chaining with Functions

```typescript
// Problem: Function might be undefined
const user = getUser();
user.getName(); // Error if user is undefined

// Solution: Optional chaining
user?.getName();

// Solution: Check before call
if (user) {
  user.getName();
}
```

### Nullish Coalescing vs. Logical OR

```typescript
// Problem: Falsy values (0, "", false) are treated as missing
const count = userInput || 10; // If userInput is 0, returns 10 (wrong!)

// Solution: Nullish coalescing only checks null/undefined
const count = userInput ?? 10; // If userInput is 0, returns 0 (correct!)
```

## Readonly Class Properties

Properties that are never mutated after construction must be marked `readonly`.
Enforced by ESLint `@typescript-eslint/prefer-readonly`.

```typescript
// ❌ WRONG: mutable property never assigned after construction
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

Never use `!` to force-unwrap nullable values. Use optional chaining or explicit guards.
Enforced by ESLint `@typescript-eslint/no-non-null-assertion`.

```typescript
// ❌ WRONG
const name = user!.name;

// ✅ CORRECT
const name = user?.name ?? "unknown";
```

## Exhaustive Switch Statements

Switch statements on union types must handle every member.
Enforced by ESLint `@typescript-eslint/switch-exhaustiveness-check`.

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

Functions that return a `Promise` must be declared `async`.
Enforced by ESLint `@typescript-eslint/promise-function-async`.

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

## Handle All Promises

Every Promise must be awaited or explicitly void-annotated.
Enforced by ESLint `@typescript-eslint/no-floating-promises`.

```typescript
// ❌ WRONG: unhandled rejection silently swallowed
sendEmail(user.email);

// ✅ CORRECT: await it
await sendEmail(user.email);

// ✅ CORRECT: intentional fire-and-forget
void sendEmail(user.email);
```

## Consistent Returns

All code paths in a function must either return a value or none of them should.
Enforced by ESLint `@typescript-eslint/consistent-return`.

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

## Control Flow Best Practices

### Always Use Curly Braces

All `if`, `else`, `for`, and `while` blocks require curly braces.
Enforced by ESLint `curly: "all"`.

```typescript
// ❌ WRONG
if (condition) doSomething();

// ✅ CORRECT
if (condition) {
  doSomething();
}
```

### Early Returns (No Else After Return)

When an `if` block returns, omit the `else`.
Enforced by ESLint `no-else-return`.

```typescript
// ❌ WRONG
if (isActive) {
  return "active";
} else {
  return "inactive";
}

// ✅ CORRECT
if (isActive) {
  return "active";
}
return "inactive";
```

### Object Shorthand

Use property shorthand when key and value names match.
Enforced by ESLint `object-shorthand: "always"`.

```typescript
// ❌ WRONG
const user = { name: name, age: age };

// ✅ CORRECT
const user = { name, age };
```

### Template Literals

Use template literals instead of string concatenation.
Enforced by ESLint `prefer-template`.

```typescript
// ❌ WRONG
const greeting = "Hello, " + name + "!";

// ✅ CORRECT
const greeting = `Hello, ${name}!`;
```

## Function Parameter Limits

Functions may have at most **3 parameters**. Group extras into an options object.
Constructors may have up to 12 parameters (for NestJS dependency injection).
Enforced by ESLint `better-max-params/better-max-params`.

```typescript
// ❌ WRONG: 4 parameters
function createUser(name: string, email: string, role: string, age: number): User { ... }

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

Public functions, methods, classes, interfaces, types, and enums require JSDoc.
Only add JSDoc when it provides context beyond the signature.
Enforced by ESLint `jsdoc/require-jsdoc` and `tsdoc/syntax`.

```typescript
// ❌ WRONG: missing JSDoc on exported function
export function parseLatinEntry(raw: string): DictionaryEntry { ... }

// ❌ WRONG: JSDoc that just restates the signature
/**
 * Parses a Latin entry.
 * @param raw - The raw string.
 * @returns The entry.
 */
export function parseLatinEntry(raw: string): DictionaryEntry { ... }

// ✅ CORRECT: JSDoc explains non-obvious behavior
/**
 * Parses a Lewis & Short dictionary entry from its raw XML representation.
 * Entries with multiple headwords are split into separate {@link DictionaryEntry} objects.
 */
export function parseLatinEntry(raw: string): DictionaryEntry { ... }
```

## Code Complexity Limits

| Limit | Threshold | ESLint Rule |
| ----- | --------- | ----------- |
| Lines per function | 64 | `max-lines-per-function` |
| Statements per function | 16 | `max-statements` |
| Cyclomatic complexity | 8 | `complexity` |
| Nesting depth | 4 | `max-depth` |
| Lines per file | 512 | `max-lines` |
| Parameters per function | 3 | `better-max-params` |
| Classes per file | 1 | `max-classes-per-file` |

When these limits are exceeded, refactor using guard clauses, helper functions, and single-responsibility
decomposition. See the [simplify-code skill](../skills/simplify-code/SKILL.md) for step-by-step guidance.

## Resources

- [TypeScript Handbook: Strict Mode](https://www.typescriptlang.org/tsconfig#strict)
- [Root tsconfig.base.json](../../tsconfig.base.json) - Shared configuration
- [Error Handling](../code-quality/error-handling.md) - Typed error patterns
- [Import Organization](imports.md) - Type import rules
