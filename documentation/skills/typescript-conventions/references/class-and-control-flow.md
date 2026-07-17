# Class and Control Flow Patterns

## Readonly Class Properties

Properties that are never mutated after construction must be `readonly`.

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

## Always Use Curly Braces

All control-flow statements (`if`, `else`, `for`, `while`) must use braces.

```typescript
// ❌ WRONG
if (condition) doSomething();

// ✅ CORRECT
if (condition) {
  doSomething();
}
```

## No Else After Return

Use early returns instead of `else` after a `return`.

```typescript
// ❌ WRONG
function getStatus(isActive: boolean): string {
  if (isActive) {
    return "active";
  } else {
    return "inactive";
  }
}

// ✅ CORRECT
function getStatus(isActive: boolean): string {
  if (isActive) {
    return "active";
  }

  return "inactive";
}
```

## Object Shorthand

Use property shorthand when names match.

```typescript
// ❌ WRONG
const user = { age: age, name: name };

// ✅ CORRECT
const user = { age, name };
```

## Template Literals Over Concatenation

Use template literals rather than string concatenation.

```typescript
// ❌ WRONG
const message = "Hello, " + name + "!";

// ✅ CORRECT
const message = `Hello, ${name}!`;
```
