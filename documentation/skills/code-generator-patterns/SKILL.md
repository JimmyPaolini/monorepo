---
name: code-generator-patterns
description: Create and extend Nx generators using templates, prompts, and file generation. Use this skill when building new generators or modifying the generator framework.
license: MIT
---

# Code Generator Patterns

This skill covers creating and extending Nx generators in the monorepo, including template syntax, interactive prompts, file generation, and testing generators.

## Overview

The monorepo includes custom Nx generators in `tools/code-generator/` for scaffolding:

- Project structures
- Component templates
- Configuration files
- Documentation

For detailed generator development guide, see [tools/code-generator/AGENTS.md](../../tools/code-generator/AGENTS.md).

## Generator Structure

### Directory Layout

```text
tools/code-generator/
  src/
    generators/
      example/                    # Generator name
        schema.json              # Input schema
        schema.d.ts              # TypeScript types
        generator.ts             # Implementation
        files/                   # Template files
          __name__.ts.template   # Template with substitutions
```

### Generator Files

**schema.json** - Defines inputs:

```json
{
  "$schema": "http://json-schema.org/schema",
  "cli": "nx",
  "id": "example",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Name of the component",
      "$default": { "$source": "argv", "index": 0 }
    },
    "directory": {
      "type": "string",
      "description": "Directory to create the component in"
    }
  },
  "required": ["name"]
}
```

**generator.ts** - Implementation:

```typescript
import { Tree, formatFiles, generateFiles } from "@nx/devkit";
import { ExampleGeneratorSchema } from "./schema";

export async function exampleGenerator(
  tree: Tree,
  options: ExampleGeneratorSchema,
) {
  // Generate files from templates
  generateFiles(tree, join(__dirname, "files"), options.directory, {
    ...options,
    tmpl: "", // Remove .template extension
  });

  // Format generated files
  await formatFiles(tree);
}

export default exampleGenerator;
```

## Template Syntax

### Variable Substitution

Use `__variable__` in filenames and content:

**Filename:** `__name__.ts.template`
**Becomes:** `MyComponent.ts` (when name="MyComponent")

**Content:**

```typescript
// __name__.ts.template
export function __name__() {
  console.log("Hello from __name__!");
}
```

**Generates:**

```typescript
// MyComponent.ts
export function MyComponent() {
  console.log("Hello from MyComponent!");
}
```

### Case Transformations

Use helper functions for case conversion:

```typescript
import { names } from "@nx/devkit";

generateFiles(tree, templatePath, targetPath, {
  ...options,
  ...names(options.name), // Adds: name, className, propertyName, constantName, fileName
  tmpl: "",
});
```

Available transformations:

- `__name__` → Original name
- `__className__` → PascalCase (MyComponent)
- `__propertyName__` → camelCase (myComponent)
- `__constantName__` → UPPER_CASE (MY_COMPONENT)
- `__fileName__` → kebab-case (my-component)

### Conditional Content

Use EJS-style templates for conditionals:

```typescript
// Template with conditional
export interface __className__Props {
  <% if (includeOptional) { %>
  optional?: string
  <% } %>
}
```

Enable by using `template` in generateFiles:

```typescript
import { template } from "@nx/devkit";

generateFiles(tree, templatePath, targetPath, {
  ...options,
  template: template(), // Enable EJS processing
});
```

### Loops in Templates

```typescript
// Generate multiple exports
<% items.forEach(item => { %>
export const __item__ = '__item__'
<% }) %>
```

## Interactive Prompts

### Adding Prompts

Use `x-prompt` in schema.json:

```json
{
  "properties": {
    "style": {
      "type": "string",
      "description": "Styling approach",
      "x-prompt": {
        "message": "Which styling approach would you like to use?",
        "type": "list",
        "items": [
          { "value": "css", "label": "CSS" },
          { "value": "scss", "label": "SCSS" },
          { "value": "tailwind", "label": "Tailwind CSS" }
        ]
      }
    },
    "includeTests": {
      "type": "boolean",
      "description": "Generate test files?",
      "x-prompt": "Would you like to generate test files?",
      "default": true
    }
  }
}
```

### Prompt Types

**List selection:**

```json
{
  "x-prompt": {
    "message": "Select an option",
    "type": "list",
    "items": ["option1", "option2"]
  }
}
```

**Confirmation:**

```json
{
  "type": "boolean",
  "x-prompt": "Include optional feature?"
}
```

**Text input:**

```json
{
  "type": "string",
  "x-prompt": "Enter a description"
}
```

## File Generation Patterns

### Basic File Generation

```typescript
import { Tree, generateFiles, joinPathFragments } from "@nx/devkit";

export async function generator(tree: Tree, options: Schema) {
  const targetPath = joinPathFragments(options.directory, options.name);

  generateFiles(tree, join(__dirname, "files"), targetPath, options);
}
```

### Conditional File Generation

```typescript
export async function generator(tree: Tree, options: Schema) {
  // Generate base files
  generateFiles(tree, join(__dirname, "files/base"), targetPath, options);

  // Conditionally generate test files
  if (options.includeTests) {
    generateFiles(tree, join(__dirname, "files/tests"), targetPath, options);
  }

  // Conditionally generate style files
  if (options.style) {
    generateFiles(
      tree,
      join(__dirname, `files/styles/${options.style}`),
      targetPath,
      options,
    );
  }
}
```

### Updating Existing Files

```typescript
import { Tree, updateJson } from "@nx/devkit";

export async function generator(tree: Tree, options: Schema) {
  // Update package.json
  updateJson(tree, "package.json", (json) => {
    json.dependencies = {
      ...json.dependencies,
      "new-package": "^1.0.0",
    };
    return json;
  });

  // Update tsconfig paths
  updateJson(tree, "tsconfig.base.json", (json) => {
    json.compilerOptions.paths[`@${options.name}/*`] = [
      `packages/${options.name}/src/*`,
    ];
    return json;
  });
}
```

### Adding Files to Project

```typescript
import { Tree, addProjectConfiguration } from "@nx/devkit";

export async function generator(tree: Tree, options: Schema) {
  // Create project configuration
  addProjectConfiguration(tree, options.name, {
    root: `packages/${options.name}`,
    sourceRoot: `packages/${options.name}/src`,
    projectType: "library",
    targets: {
      build: {
        executor: "@nx/js:tsc",
        options: {
          outputPath: `dist/packages/${options.name}`,
          main: `packages/${options.name}/src/index.ts`,
          tsConfig: `packages/${options.name}/tsconfig.lib.json`,
        },
      },
    },
  });

  // Generate files
  generateFiles(
    tree,
    join(__dirname, "files"),
    `packages/${options.name}`,
    options,
  );
}
```

## Testing Generators

### Unit Tests

```typescript
import { Tree, readProjectConfiguration } from "@nx/devkit";
import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { myGenerator } from "./generator";

describe("myGenerator", () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it("should generate files", async () => {
    await myGenerator(tree, { name: "test" });

    expect(tree.exists("packages/test/src/index.ts")).toBeTruthy();
  });

  it("should add project configuration", async () => {
    await myGenerator(tree, { name: "test" });

    const config = readProjectConfiguration(tree, "test");
    expect(config.root).toBe("packages/test");
  });

  it("should update tsconfig paths", async () => {
    await myGenerator(tree, { name: "test" });

    const tsconfig = JSON.parse(tree.read("tsconfig.base.json", "utf-8"));
    expect(tsconfig.compilerOptions.paths["@test/*"]).toBeDefined();
  });
});
```

### Integration Tests

```typescript
import { execSync } from "child_process";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

describe("myGenerator (integration)", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "nx-test-"));

    // Create minimal Nx workspace
    execSync("npx create-nx-workspace@latest test-workspace --preset=empty", {
      cwd: tempDir,
    });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true });
  });

  it("should generate files in real workspace", () => {
    // Run generator
    execSync("nx g @myorg/generators:my-generator test", {
      cwd: join(tempDir, "test-workspace"),
    });

    // Verify files exist
    const generatedFile = join(
      tempDir,
      "test-workspace/packages/test/src/index.ts",
    );
    expect(existsSync(generatedFile)).toBe(true);
  });
});
```

## Running Generators

### Command Line

```bash
# Run generator
nx g @monorepo/code-generator:example my-component

# With options
nx g @monorepo/code-generator:example my-component --directory=src/components

# Dry run (preview changes)
nx g @monorepo/code-generator:example my-component --dry-run

# Skip prompts (use defaults)
nx g @monorepo/code-generator:example my-component --defaults
```

### Programmatically

```typescript
import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { exampleGenerator } from "./generator";

const tree = createTreeWithEmptyWorkspace();
await exampleGenerator(tree, {
  name: "my-component",
  directory: "src/components",
});

// Tree now contains generated files
const content = tree.read("src/components/my-component.ts");
```

## Advanced Patterns

### Composing Generators

Call other generators from your generator:

```typescript
import { Tree } from "@nx/devkit";
import { libraryGenerator } from "@nx/js";
import { componentGenerator } from "./component/generator";

export async function featureGenerator(tree: Tree, options: Schema) {
  // Generate library
  await libraryGenerator(tree, {
    name: options.name,
    directory: "packages",
  });

  // Generate components
  for (const component of options.components) {
    await componentGenerator(tree, {
      name: component,
      directory: `packages/${options.name}/src/components`,
    });
  }
}
```

### Custom Validation

Add validation logic:

```typescript
import { Tree } from "@nx/devkit";

export async function generator(tree: Tree, options: Schema) {
  // Validate name
  if (!/^[a-z-]+$/.test(options.name)) {
    throw new Error("Name must be lowercase with hyphens");
  }

  // Check if already exists
  if (tree.exists(`packages/${options.name}`)) {
    throw new Error(`Package ${options.name} already exists`);
  }

  // Generate files...
}
```

### Post-Generation Tasks

Run commands after generation:

```typescript
import { Tree, formatFiles, installPackagesTask } from "@nx/devkit";

export async function generator(tree: Tree, options: Schema) {
  // Generate files
  generateFiles(tree, templatePath, targetPath, options);

  // Format files
  await formatFiles(tree);

  // Install dependencies (runs after generator completes)
  return () => {
    installPackagesTask(tree);
  };
}
```

## Common Patterns

### Package Generator

```typescript
export async function packageGenerator(tree: Tree, options: PackageSchema) {
  const normalized = {
    ...options,
    ...names(options.name),
  };

  // Generate package structure
  generateFiles(
    tree,
    join(__dirname, "files"),
    `packages/${normalized.fileName}`,
    normalized,
  );

  // Add to tsconfig paths
  updateJson(tree, "tsconfig.base.json", (json) => {
    json.compilerOptions.paths[`@monorepo/${normalized.fileName}/*`] = [
      `packages/${normalized.fileName}/src/*`,
    ];
    return json;
  });

  // Add project configuration
  addProjectConfiguration(tree, normalized.fileName, {
    root: `packages/${normalized.fileName}`,
    sourceRoot: `packages/${normalized.fileName}/src`,
    projectType: "library",
    targets: {
      build: {
        executor: "@nx/js:tsc",
        options: {
          outputPath: `dist/packages/${normalized.fileName}`,
          main: `packages/${normalized.fileName}/src/index.ts`,
        },
      },
    },
  });

  await formatFiles(tree);
}
```

### Component Generator

```typescript
export async function componentGenerator(tree: Tree, options: ComponentSchema) {
  const normalized = {
    ...options,
    ...names(options.name),
  };

  // Determine target directory
  const targetPath = join(
    options.project,
    "src/components",
    normalized.fileName,
  );

  // Generate component file
  generateFiles(tree, join(__dirname, "files"), targetPath, normalized);

  // Generate test file if requested
  if (options.includeTests) {
    generateFiles(tree, join(__dirname, "files-test"), targetPath, normalized);
  }

  // Add export to index.ts
  const indexPath = join(options.project, "src/index.ts");
  const indexContent = tree.read(indexPath, "utf-8") || "";
  tree.write(
    indexPath,
    `${indexContent}\nexport { ${normalized.className} } from './components/${normalized.fileName}';\n`,
  );

  await formatFiles(tree);
}
```

## Best Practices

1. **Use schema validation** for input validation
2. **Provide sensible defaults** in schema.json
3. **Format generated files** with formatFiles()
4. **Use names() helper** for consistent naming
5. **Test generators** thoroughly (unit + integration)
6. **Document options** in schema descriptions
7. **Compose generators** to reduce duplication
8. **Validate inputs** before generating files
9. **Update related files** (tsconfig, etc.)
10. **Use dry-run** to preview changes

## Troubleshooting

**Generator not found:**

- Ensure generator is in correct directory structure
- Check schema.json has correct "id" field
- Verify package.json exports generator

**Templates not found:**

- Check `files/` directory exists
- Verify path in generateFiles() is correct
- Use `__dirname` for relative paths

**Variables not substituted:**

- Add `tmpl: ''` to generateFiles() options
- Check variable names match schema properties
- Use `names()` helper for case transformations

**Schema validation errors:**

- Verify JSON schema syntax
- Check required fields are provided
- Ensure types match (string, boolean, etc.)

## Related Documentation

- [tools/code-generator/AGENTS.md](../../tools/code-generator/AGENTS.md) - Full generator guide
- [tools/code-generator/README.md](../../tools/code-generator/README.md) - Usage examples
- [Nx Generator Docs](https://nx.dev/extending-nx/recipes/local-generators) - Official documentation

## Examples

See existing generators for patterns:

- [tools/code-generator/src/generators/](../../tools/code-generator/src/generators/) - Example generators
