# Code Generator: Nx Custom Generator Framework

## Architecture Overview

The code-generator tool provides Nx custom generators for scaffolding React components and other code patterns following monorepo conventions. It uses Nx's generator framework to create files from templates with variable substitutions.

### Technology Stack

- **Framework**: Nx Workspace Generators (built on @nx/devkit)
- **Template Engine**: EJS (Embedded JavaScript templates)
- **Utilities**: Lodash (case transformations), @faker-js/faker (test data)
- **Type Safety**: TypeScript 5.9 with strict mode
- **Testing**: Vitest for generator unit tests

### Purpose

Enforce consistent code patterns across the monorepo by automating:
- File structure (component + test colocated)
- Naming conventions (PascalCase components, kebab-case files)
- Import patterns (structured imports, type imports)
- Test boilerplate (Vitest setup, faker for random data)
- Component structure (props interface, organized sections with emoji markers)

## Generator Structure

### Directory Layout

```text
tools/code-generator/
├── src/
│   └── generators/
│       └── component/              # Component generator
│           ├── generator.ts        # Generator logic (imperative code)
│           ├── schema.json         # CLI prompts and validation
│           └── files/              # Template files
│               ├── __nameKebabCase__.tsx        # Component template
│               └── __nameKebabCase__.test.tsx   # Test template
├── generators.json                 # Registry of available generators
├── project.json                    # Nx project configuration
├── package.json                    # Dependencies
└── README.md                       # Usage documentation
```

### Core Files

**generators.json** (Generator Registry)

```json
{
  "$schema": "http://json-schema.org/schema",
  "generators": {
    "component": {
      "factory": "./src/generators/component/generator",
      "schema": "./src/generators/component/schema.json",
      "description": "Generate a React component with test file"
    }
  }
}
```

**schema.json** (CLI Configuration)

Defines generator options, prompts, and validation:

```json
{
  "$schema": "http://json-schema.org/schema",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "The name of the component (PascalCase)",
      "x-prompt": "What is the name of the component?"
    },
    "directory": {
      "type": "string",
      "description": "The directory where the component will be created",
      "x-prompt": "Where should the component be created? (relative path)"
    }
  },
  "required": ["name", "directory"]
}
```

**generator.ts** (Logic)

Imperative code that:
1. Validates input options
2. Transforms data (case conversions, path normalization)
3. Generates files from templates
4. Runs formatters (Prettier)

```typescript
export async function generateComponent(
  tree: Tree,
  options: GenerateComponentOptions,
): Promise<void> {
  const { name, directory } = options;

  // Case transformations
  const namePascalCase = _.upperFirst(_.camelCase(name));
  const nameKebabCase = _.kebabCase(name);

  // Validation
  if (name !== namePascalCase) {
    throw new Error(`Component name must be PascalCase: ${namePascalCase}`);
  }

  // Generate files with substitutions
  const substitutions = { namePascalCase, nameKebabCase };
  generateFiles(tree, filesPath, directory, substitutions);

  // Auto-format generated files
  await formatFiles(tree);
}
```

### Template Syntax

**File Naming**

Template filenames use `__variableName__` placeholders:
- `__nameKebabCase__.tsx` → `button.tsx`
- `__namePascalCase__.test.tsx` → `Button.test.tsx`

**Content Substitutions**

EJS template syntax: `<%= variableName %>`

```tsx
// Template: __nameKebabCase__.tsx
export interface <%= namePascalCase %>Props {
  className?: string;
}

export const <%= namePascalCase %> = (props: <%= namePascalCase %>Props) => {
  // ...
};
```

Generates:

```tsx
// Output: button.tsx
export interface ButtonProps {
  className?: string;
}

export const Button = (props: ButtonProps) => {
  // ...
};
```

## Component Generator

### Usage

```bash
# Interactive prompts
nx generate code-generator:component

# CLI arguments
nx generate code-generator:component --name=Button --directory=src/components

# Short form
nx g code-generator:component --name=Dialog --directory=packages/lexico-components/src/components
```

### Options

- **`--name`** (required): Component name in PascalCase (validated)
- **`--directory`** (required): Target directory (relative path, validated to exist)

### Generated Files

For component named `Button` in `src/components`:

```text
src/components/
├── button.tsx         # Component implementation
└── button.test.tsx    # Vitest test file
```

### Component Template Structure

```tsx
// 🔖 Type
export interface ButtonProps {
  className?: string;
}

// 🧩 Component
export const Button = (props: ButtonProps): ReactElement => {
  const { className } = props;

  // 🪝 Hooks (useState, useEffect, custom hooks)

  // 🏗️ Setup (computed values, memoized callbacks)

  // 💪 Handler (event handlers)

  // 🎨 Markup

  // ♻️ Lifecycle (useEffect calls)

  // 🔌 Short Circuits (early returns)

  return (
    <div className={className}>
      Button component
    </div>
  );
};
```

**Emoji Markers**: Visual section markers for consistent component organization

### Test Template Structure

```tsx
import { render } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { createElement } from 'react';
import { faker } from '@faker-js/faker';
import { Button, type ButtonProps } from './button';

describe('Button', () => {
  // 🎭 Mocks
  let props: ButtonProps;

  // 🏗️ Setup
  beforeEach(() => {
    props = {
      className: faker.helpers.arrayElement([undefined, faker.string.alpha(10)]),
    };
  });

  // 🧪 Tests
  it('should render successfully', () => {
    const element = createElement(Button, props);
    const { container } = render(element);
    expect(container).toBeInTheDocument();
  });
});
```

**@faker-js/faker**: Generates random test data for prop values

## Creating New Generators

### Step-by-Step Guide

**1. Create Generator Directory**

```bash
mkdir -p tools/code-generator/src/generators/my-generator
cd tools/code-generator/src/generators/my-generator
```

**2. Create schema.json**

Define CLI options and prompts:

```json
{
  "$schema": "http://json-schema.org/schema",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "The name of the thing to generate",
      "x-prompt": "What should we call it?"
    },
    "type": {
      "type": "string",
      "description": "Type of thing to generate",
      "enum": ["simple", "complex"],
      "default": "simple",
      "x-prompt": {
        "message": "Which type?",
        "type": "list",
        "items": [
          { "value": "simple", "label": "Simple" },
          { "value": "complex", "label": "Complex" }
        ]
      }
    }
  },
  "required": ["name"]
}
```

**3. Create generator.ts**

Implement generator logic:

```typescript
import { formatFiles, generateFiles } from "@nx/devkit";
import * as path from "path";
import type { Tree } from "@nx/devkit";

interface MyGeneratorOptions {
  name: string;
  type: "simple" | "complex";
}

export async function myGenerator(
  tree: Tree,
  options: MyGeneratorOptions,
): Promise<void> {
  // 1. Validate inputs
  if (!options.name.match(/^[A-Z][a-zA-Z0-9]*$/)) {
    throw new Error("Name must be PascalCase");
  }

  // 2. Transform data
  const substitutions = {
    name: options.name,
    nameLower: options.name.toLowerCase(),
    type: options.type,
  };

  // 3. Generate files
  const filesPath = path.join(__dirname, "files", options.type);
  generateFiles(tree, filesPath, "output/directory", substitutions);

  // 4. Format generated files
  await formatFiles(tree);
}
```

**4. Create Template Files**

```bash
mkdir -p tools/code-generator/src/generators/my-generator/files/simple
mkdir -p tools/code-generator/src/generators/my-generator/files/complex
```

Create template:

```typescript
// files/simple/__nameLower__.ts
export class <%= name %> {
  constructor() {
    console.log('<%= name %> created');
  }
}
```

**5. Register Generator**

Add to [generators.json](generators.json):

```json
{
  "generators": {
    "component": { "..." },
    "my-generator": {
      "factory": "./src/generators/my-generator/generator",
      "schema": "./src/generators/my-generator/schema.json",
      "description": "Generate my custom thing"
    }
  }
}
```

**6. Test Generator**

```bash
nx generate code-generator:my-generator --name=Example --type=simple
```

### Generator Best Practices

**Validation**

- Validate all inputs early (throw errors before generating files)
- Check naming conventions (PascalCase, camelCase, kebab-case)
- Verify paths exist (use `tree.exists(path)`)
- Prevent path traversal (`..` or absolute paths)

**Case Transformations**

Use lodash for consistent casing:

```typescript
import _ from "lodash";

const namePascalCase = _.upperFirst(_.camelCase(name));  // "MyComponent"
const nameCamelCase = _.camelCase(name);                  // "myComponent"
const nameKebabCase = _.kebabCase(name);                  // "my-component"
const nameSnakeCase = _.snakeCase(name);                  // "my_component"
const nameUpperCase = _.toUpper(_.snakeCase(name));       // "MY_COMPONENT"
```

**File Generation**

```typescript
// Generate from single template directory
generateFiles(tree, filesPath, targetPath, substitutions);

// Conditionally generate files
if (options.includeTests) {
  generateFiles(tree, testFilesPath, targetPath, substitutions);
}
```

**Tree API** (Nx virtual file system)

```typescript
// Check if file/directory exists
if (tree.exists("src/components")) { /* ... */ }

// Read file contents
const contents = tree.read("package.json")?.toString();

// Write file
tree.write("src/new-file.ts", "content");

// Delete file
tree.delete("src/old-file.ts");

// List directory children
const children = tree.children("src/components");
```

**Formatting**

Always call `formatFiles(tree)` at end:
- Applies Prettier formatting
- Ensures consistent code style
- Respects .prettierrc configuration

### Advanced Patterns

**Conditional File Generation**

```typescript
// files/component/
//   __name__.tsx
//   __name__.test.tsx          # Only if includeTests=true
//   __name__.stories.tsx       # Only if includeStories=true

if (options.includeTests) {
  generateFiles(tree, testFilesPath, targetPath, substitutions);
}

if (options.includeStories) {
  generateFiles(tree, storiesFilesPath, targetPath, substitutions);
}
```

**Multiple Template Sets**

```typescript
// files/
//   simple/
//     __name__.ts
//   complex/
//     __name__.ts
//     __name__.types.ts
//     __name__.utils.ts

const templateDir = options.type === "simple" ? "simple" : "complex";
const filesPath = path.join(__dirname, "files", templateDir);
generateFiles(tree, filesPath, targetPath, substitutions);
```

**Package.json Modification**

```typescript
import { updateJson } from "@nx/devkit";

updateJson(tree, "package.json", (json) => {
  json.dependencies = json.dependencies || {};
  json.dependencies["new-package"] = "^1.0.0";
  return json;
});
```

**Project Configuration Updates**

```typescript
import { updateProjectConfiguration, readProjectConfiguration } from "@nx/devkit";

const projectConfig = readProjectConfiguration(tree, projectName);
projectConfig.targets = projectConfig.targets || {};
projectConfig.targets["new-target"] = {
  executor: "nx:run-commands",
  options: {
    command: "echo 'Hello'",
  },
};
updateProjectConfiguration(tree, projectName, projectConfig);
```

## Testing Generators

### Unit Testing

```typescript
// generator.test.ts
import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { myGenerator } from "./generator";

describe("myGenerator", () => {
  it("should generate files", async () => {
    const tree = createTreeWithEmptyWorkspace();

    // Create necessary directories
    tree.write("src/components/.gitkeep", "");

    // Run generator
    await myGenerator(tree, { name: "Example", type: "simple" });

    // Assertions
    expect(tree.exists("src/components/example.ts")).toBe(true);
    const content = tree.read("src/components/example.ts")?.toString();
    expect(content).toContain("export class Example");
  });

  it("should validate inputs", async () => {
    const tree = createTreeWithEmptyWorkspace();

    await expect(
      myGenerator(tree, { name: "invalid-name", type: "simple" })
    ).rejects.toThrow("Name must be PascalCase");
  });
});
```

### Manual Testing

```bash
# Generate with dry-run (no files written)
nx generate code-generator:component --name=Test --directory=src --dry-run

# Check generated files
nx generate code-generator:component --name=Test --directory=src
git status  # See what was created

# Clean up
git clean -fd  # Remove untracked files
```

## Quickstart Script

**quickstart.sh** (Interactive setup)

```bash
#!/usr/bin/env bash
# Quickly generate a component via interactive prompts

nx generate code-generator:component
```

Run with: `./tools/code-generator/quickstart.sh`

## Common Patterns

### Exports Management

**Barrel Exports** (index.ts files)

```typescript
// Option 1: Generate barrel export in same directory
tree.write(
  path.join(targetPath, "index.ts"),
  `export * from "./${nameKebabCase}";\n`
);

// Option 2: Update existing barrel export
const indexPath = path.join(targetPath, "index.ts");
const existingContent = tree.read(indexPath)?.toString() || "";
const newContent = existingContent + `export * from "./${nameKebabCase}";\n`;
tree.write(indexPath, newContent);
```

**Centralized Exports** (src/index.ts)

```typescript
import { updateJson } from "@nx/devkit";

// Add to package.json exports
updateJson(tree, "package.json", (json) => {
  json.exports = json.exports || {};
  json.exports[`./${name}`] = `./src/components/${name}/index.ts`;
  return json;
});
```

### Path Resolution

```typescript
import * as path from "path";
import { workspaceRoot } from "@nx/devkit";

// Relative to workspace root
const absolutePath = path.join(workspaceRoot, "src", "components");

// Relative to generator directory
const templatePath = path.join(__dirname, "files");

// Normalize paths (handle Windows backslashes)
const normalized = path.posix.normalize(userPath);
```

## Related Documentation

- [Main AGENTS.md](../../AGENTS.md): Monorepo architecture, Nx workflows, conventions
- [README.md](README.md): Component generator usage examples
- [Nx Generator Documentation](https://nx.dev/extending-nx/recipes/local-generators): Official Nx generator guide
- [EJS Documentation](https://ejs.co/): Template syntax reference
