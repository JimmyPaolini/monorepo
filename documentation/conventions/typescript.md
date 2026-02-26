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

**Enforced by**: ESLint rule `import/order` with `distinctGroup` for types

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

## Resources

- [TypeScript Handbook: Strict Mode](https://www.typescriptlang.org/tsconfig#strict)
- [Root tsconfig.base.json](../../tsconfig.base.json) - Shared configuration
- [Error Handling](../code-quality/error-handling.md) - Typed error patterns
- [Import Organization](imports.md) - Type import rules
