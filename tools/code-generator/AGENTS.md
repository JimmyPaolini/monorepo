# Code Generator: Nx Custom Generator Framework

## Quick Start

Generate a component:

```bash
nx generate code-generator:react-component --name=Button --directory=src/components
```

Short form:

```bash
nx g code-generator:react-component --name=Dialog --directory=packages/lexico-components/src/components
```

## Architecture Overview

### Directory Layout

```text
tools/code-generator/
├── src/
│   └── generators/
│       └── react-component/
│           ├── generator.ts
│           ├── schema.json
│           └── templates/
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

- [src/generators/react-component/generator.ts](src/generators/react-component/generator.ts): Generator logic
- [src/generators/react-component/schema.json](src/generators/react-component/schema.json): CLI prompts
- [src/generators/react-component/templates/](src/generators/react-component/templates/): Templates
- [generators.json](generators.json): Generator registry
