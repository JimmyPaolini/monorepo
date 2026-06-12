---
name: code-generator-patterns
description: Create and extend Nx generators using templates, prompts, and file generation. Use this skill when building new generators or modifying the generator framework.
license: MIT
---

# Code Generator Patterns

This skill covers creating and extending Nx generators in the monorepo, including template syntax, interactive prompts, file generation, and testing generators.

## Overview

The monorepo includes custom Nx generators in `tools/conformance/` for scaffolding:

- Project structures
- Component templates
- Configuration files
- Documentation

For detailed generator development guide, see [tools/conformance/AGENTS.md](../../../tools/conformance/AGENTS.md).

For workspace task execution, see [tool-execution-model](../tool-execution-model/SKILL.md).

## Component Generator (Monorepo Standard)

The component generator enforces these conventions:

- Component names are **PascalCase** (validated, e.g., `Button`, `UserCard`)
- File names are **PascalCase** (`Button.tsx`, `Button.test.tsx`)
- The generator prompts for a `framework:react` project when `--project` is omitted
- Generated files are placed in `src/components/` of the selected project

Example:

```bash
nx generate conformance:react-component --name=Dialog
# With explicit project:
nx generate conformance:react-component --name=Dialog --project=lexico-components
```

Generates in `packages/lexico-components/src/components/`:

```text
src/components/
├── Dialog.tsx
└── Dialog.test.tsx
```

## Generator Structure

### Directory Layout

```text
tools/conformance/
  src/
    generators/
      example/                          # Generator name
        schema.json                    # Input schema
        generator.ts                   # Implementation
        templates/                     # Template files
          __namePascalCase__.tsx        # React component template (PascalCase)
          __nameCamelCase__.module.ts   # NestJS module template (camelCase)
```

### Generator Files

**schema.json** - Defines inputs:

```json
{
  "$schema": "http://json-schema.org/schema",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Name of the component or module"
    },
    "project": {
      "type": "string",
      "description": "Name of the target project (optional — prompted if omitted)"
    }
  },
  "required": ["name"]
}
```

**generator.ts** - Implementation:

```typescript
import path from "node:path";
import { formatFiles, generateFiles, getProjects } from "@nx/devkit";
import { resolveProjectByTag, resolveNameByCase } from "../../utilities";
import { StringCase } from "../../types";
import type { Tree } from "@nx/devkit";

interface ExampleGeneratorSchema {
  name: string;
  project?: string;
}

export async function exampleGenerator(
  tree: Tree,
  options: ExampleGeneratorSchema,
): Promise<void> {
  const projectName = await resolveProjectByTag({
    tree,
    tag: "framework:react",
    ...(options.project !== undefined && { project: options.project }),
    message: "Which project should the component be generated in?",
  });

  const name = await resolveNameByCase({
    name: options.name,
    case: StringCase.PASCAL_CASE,
    message: "What is the name of the component? (PascalCase)",
    subject: "Component name",
  });

  const allProjects = getProjects(tree);
  const projectConfig = allProjects.get(projectName);
  const projectRoot = projectConfig?.root ?? projectConfig?.sourceRoot;
  if (!projectRoot) throw new Error(`Project "${projectName}" has no root`);

  const directory = path.join(projectRoot, "src", "components");
  const namePascalCase = name;

  // Template filenames use __variable__ substitution; content uses EJS <%= variable %>
  generateFiles(tree, path.join(__dirname, "templates"), directory, {
    namePascalCase,
  });

  await formatFiles(tree);
}

export default exampleGenerator;
```

## Template Syntax

### Variable Substitution

Generators use two substitution mechanisms:

- **Filenames**: `__variable__` is replaced with the corresponding variable value
- **File content**: EJS `<%= variable %>` is evaluated and replaced

**Filename:** `__namePascalCase__.tsx`
**Becomes:** `Dialog.tsx` (when namePascalCase="Dialog")

**Content:**

```tsx
// __namePascalCase__.tsx
export interface <%= namePascalCase %>Props {
  className?: string;
}

export const <%= namePascalCase %> = (props: <%= namePascalCase %>Props) => {
  return <div className={props.className}><%= namePascalCase %> component</div>;
};
```

**Generates:**

```tsx
// Dialog.tsx
export interface DialogProps {
  className?: string;
}

export const Dialog = (props: DialogProps) => {
  return <div className={props.className}>Dialog component</div>;
};
```

### Variable Naming Conventions

This monorepo's generators pass custom substitution variables to `generateFiles()`:

| Variable | Case | Example |
| --- | --- | --- |
| `namePascalCase` | PascalCase | `UserCard` |
| `nameCamelCase` | camelCase | `userCard` |
| `nameKebabCase` | kebab-case | `user-card` |
| `nameSnakeCase` | snake_case | `user_card` |
| `nameConstantCase` | UPPER_CASE | `USER_CARD` |

Use `resolveNameByCase()` from `../../utilities` to normalize the input name, then build the substitutions object manually:

```typescript
const nameCamelCase = name; // already normalized to camelCase
const namePascalCase = _.upperFirst(name);
generateFiles(tree, templatesPath, targetPath, { nameCamelCase, namePascalCase });
```

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
import path from "node:path";

export async function generator(tree: Tree, options: Schema) {
  const targetPath = joinPathFragments(options.directory, options.name);

  generateFiles(tree, path.join(__dirname, "templates"), targetPath, options);
}
```

### Conditional File Generation

```typescript
export async function generator(tree: Tree, options: Schema) {
  // Generate base files
  generateFiles(tree, path.join(__dirname, "templates/base"), targetPath, options);

  // Conditionally generate test files
  if (options.includeTests) {
    generateFiles(tree, path.join(__dirname, "templates/tests"), targetPath, options);
  }

  // Conditionally generate style files
  if (options.style) {
    generateFiles(
      tree,
      path.join(__dirname, `templates/styles/${options.style}`),
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
    path.join(__dirname, "templates"),
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
import { temporaryDirectory } from "os";
import { join } from "path";

describe("myGenerator (integration)", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(temporaryDirectory(), "nx-test-"));

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
nx g @monorepo/conformance:example my-component

# With options
nx g @monorepo/conformance:example my-component --directory=src/components

# Dry run (preview changes)
nx g @monorepo/conformance:example my-component --dry-run

# Skip prompts (use defaults)
nx g @monorepo/conformance:example my-component --defaults
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
  const namePascalCase = _.upperFirst(_.camelCase(options.name));
  const nameKebabCase = _.kebabCase(options.name);
  const normalized = { ...options, namePascalCase, nameKebabCase };

  // Generate package structure
  generateFiles(
    tree,
    path.join(__dirname, "templates"),
    `packages/${nameKebabCase}`,
    normalized,
  );

  // Add to tsconfig paths
  updateJson(tree, "tsconfig.base.json", (json) => {
    json.compilerOptions.paths[`@monorepo/${nameKebabCase}/*`] = [
      `packages/${nameKebabCase}/src/*`,
    ];
    return json;
  });

  // Add project configuration
  addProjectConfiguration(tree, nameKebabCase, {
    root: `packages/${nameKebabCase}`,
    sourceRoot: `packages/${nameKebabCase}/src`,
    projectType: "library",
    targets: {
      build: {
        executor: "@nx/js:tsc",
        options: {
          outputPath: `dist/packages/${nameKebabCase}`,
          main: `packages/${nameKebabCase}/src/index.ts`,
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
  const namePascalCase = options.name;
  const nameKebabCase = namePascalCase.replace(/([A-Z])/g, (m, l, i) => (i ? "-" : "") + l.toLowerCase());

  // Determine target directory
  const targetPath = path.join(options.project, "src/components");

  // Generate component files from templates
  generateFiles(tree, path.join(__dirname, "templates"), targetPath, {
    namePascalCase,
    nameKebabCase,
  });

  // Generate test files if requested
  if (options.includeTests) {
    generateFiles(tree, path.join(__dirname, "templates-test"), targetPath, {
      namePascalCase,
      nameKebabCase,
    });
  }

  // Add export to index.ts
  const indexPath = path.join(options.project, "src/index.ts");
  const indexContent = tree.read(indexPath, "utf-8") ?? "";
  tree.write(
    indexPath,
    `${indexContent}\nexport { ${namePascalCase} } from './components/${namePascalCase}';\n`,
  );

  await formatFiles(tree);
}
```

## Best Practices

1. **Use schema validation** for input validation
2. **Provide sensible defaults** in schema.json
3. **Format generated files** with formatFiles()
4. **Use `resolveNameByCase()`** from `../../utilities` to normalize names, then build substitution variables manually
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

- Check `templates/` directory exists inside the generator folder
- Verify path in generateFiles() is correct
- Use `path.join(__dirname, "templates")` for relative paths

**Variables not substituted:**

- Confirm `__variable__` in filenames matches keys in the substitutions object
- Confirm `<%= variable %>` in file content matches keys in the substitutions object
- Use `resolveNameByCase()` to normalize names before building substitutions

**Schema validation errors:**

- Verify JSON schema syntax
- Check required fields are provided
- Ensure types match (string, boolean, etc.)

## Related Documentation

- [tools/conformance/AGENTS.md](../../tools/conformance/AGENTS.md) - Full generator guide
- [tools/conformance/README.md](../../tools/conformance/README.md) - Usage examples
- [Nx Generator Docs](https://nx.dev/extending-nx/recipes/local-generators) - Official documentation

## Examples

See existing generators for patterns:

- [tools/conformance/src/generators/](../../tools/conformance/src/generators/) - Example generators
