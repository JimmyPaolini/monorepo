# Code Generator: Nx Custom Generator Framework

## Quick Start

Generate a component:

```bash
nx generate code-generator:component --name=Button --directory=src/components
```

Short form:

```bash
nx g code-generator:component --name=Dialog --directory=packages/lexico-components/src/components
```

## Architecture Overview

### Directory Layout

```text
tools/code-generator/
├── src/
│   └── generators/
│       └── component/
│           ├── generator.ts
│           ├── schema.json
│           └── files/
│               ├── __nameKebabCase__.tsx
│               └── __nameKebabCase__.test.tsx
├── generators.json
└── project.json
```

### Generator Rules

- Component names are **PascalCase** (validated)
- Files are **kebab-case**
- Templates use `__variable__` placeholders
- Generated files are auto-formatted

See [code-generator-patterns skill](../../documentation/skills/code-generator-patterns/SKILL.md) for template syntax and case transformations.

## Generated Output

For `--name=Button --directory=src/components`:

```text
src/components/
├── button.tsx
└── button.test.tsx
```

## Troubleshooting

See [Common Gotchas](../../documentation/troubleshooting/gotchas.md) for Nx and formatting issues.

## Key Files

- [src/generators/component/generator.ts](src/generators/component/generator.ts): Generator logic
- [src/generators/component/schema.json](src/generators/component/schema.json): CLI prompts
- [src/generators/component/files/](src/generators/component/files/): Templates
- [generators.json](generators.json): Generator registry
