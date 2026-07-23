# Error Handling and Test Typing

## Catch Clauses Use unknown

Always type caught errors as `unknown`, then narrow.

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

## Type Narrowing in Tests

Prefer type guards over cast-based narrowing for mocked call arguments.

```typescript
interface ValidateInstanceFileArgument {
  data: { destinationRoot?: string };
  instanceFilePath: string;
  templateFilePath: string;
}

const isValidateInstanceFileArgument = (
  value: unknown,
): value is ValidateInstanceFileArgument => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return (
    "data" in value &&
    "instanceFilePath" in value &&
    "templateFilePath" in value
  );
};

const firstArgument = mockedFunction.mock.calls[0]?.[0];
if (isValidateInstanceFileArgument(firstArgument)) {
  expect(firstArgument.instanceFilePath).toContain("project");
}
```

> ✅ Best practice: behavior + guard assertions are safer than layered `as` assertions in strict mode tests.

## Node Dirent Mock Typing in Tests

When mocking `fs.readdirSync(..., { withFileTypes: true })`, derive types from the API.

```typescript
import fs from "node:fs";

type ReaddirDirent = ReturnType<typeof fs.readdirSync>[number];
type ReaddirResult = ReturnType<typeof fs.readdirSync>;

const createMockDirent = (args: {
  isDirectory: boolean;
  name: string;
  parentPath?: string;
}): ReaddirDirent => {
  const { isDirectory, name, parentPath = "/workspace" } = args;

  return {
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isDirectory: () => isDirectory,
    isFIFO: () => false,
    isFile: () => !isDirectory,
    isSocket: () => false,
    isSymbolicLink: () => false,
    name: Buffer.from(name),
    parentPath: Buffer.from(parentPath),
  } as unknown as ReaddirDirent;
};

const mockReaddirSync = vi.mocked(fs.readdirSync);
mockReaddirSync.mockReturnValue([
  createMockDirent({ isDirectory: true, name: "alpha" }),
]);
```

> ✅ Best practice: use `ReturnType<typeof fs.readdirSync>` and `ReturnType<typeof fs.readdirSync>[number]` instead of explicit `Dirent<...>` generics.
> ⚠️ Warning: hard-coding `Dirent<Buffer>` or `Dirent<NonSharedBuffer>` can cause avoidable type failures across Node type-definition updates.
