# Code Generator: Nx Custom Generator Framework

## Quick Start

Generate a React component (prompts for project if `--project` omitted):

```bash
nx generate code-generator:react-component --name=Button
nx generate code-generator:react-component --name=Button --project=lexico-components
```

Generate a NestJS service module (prompts for project if `--project` omitted):

```bash
nx generate code-generator:nestjs-service-module --name=user
nx generate code-generator:nestjs-service-module --name=userProfile --project=my-nestjs-app
```

Short alias forms:

```bash
nx g code-generator:react-component --name=Dialog
nx g code-generator:nestjs-service-module --name=auth
```

## Architecture Overview

### Directory Layout

```text
tools/code-generator/
├── src/
│   ├── constants.ts
│   ├── types.ts
│   ├── utilities.ts
│   ├── utilities.unit.test.ts
│   ├── generators/
│   │   ├── react-component/
│   │   │   ├── generator.ts
│   │   │   ├── generator.unit.test.ts
│   │   │   ├── schema.json
│   │   │   └── templates/
│   │   │       ├── __namePascalCase__.tsx
│   │   │       └── __namePascalCase__.test.tsx
│   │   └── nestjs-service-module/
│   │       ├── generator.ts
│   │       ├── generator.unit.test.ts
│   │       ├── schema.json
│   │       └── templates/
│   │           ├── __nameCamelCase__.constants.ts
│   │           ├── __nameCamelCase__.module.ts
│   │           ├── __nameCamelCase__.service.ts
│   │           ├── __nameCamelCase__.service.unit.test.ts
│   │           └── __nameCamelCase__.types.ts
│   └── validators/
├── generators.json
└── project.json
```

### Generator Rules

- **React component** names are **PascalCase** (e.g., `Button`, `UserCard`); files use PascalCase (`Button.tsx`)
- **NestJS service module** names are **camelCase** (e.g., `user`, `userProfile`); files use camelCase (`user.service.ts`)
- Both generators auto-detect the target project by framework tag (`framework:react` / `framework:nestjs`) and prompt interactively when no `--project` flag is given
- Templates use `__variable__` filename substitution; content uses Mustache syntax (`{{variable}}`)
- Generated files are auto-formatted

See [code-generator-patterns skill](../../documentation/skills/code-generator-patterns/SKILL.md) for template syntax and case transformations.

## Generated Output

### react-component: `--name=Button --project=lexico-components`

Files created in `packages/lexico-components/src/components/`:

```text
packages/lexico-components/src/components/
├── Button.tsx
└── Button.test.tsx
```

### nestjs-service-module: `--name=user --project=my-nestjs-app`

Files created in `<projectRoot>/src/modules/user/`:

```text
src/modules/user/
├── user.constants.ts
├── user.module.ts
├── user.service.ts
├── user.service.unit.test.ts
└── user.types.ts
```

## Troubleshooting

See [Common Gotchas](../../documentation/troubleshooting/gotchas.md) for Nx and formatting issues.

## Key Files

### react-component

- [src/generators/react-component/generator.ts](src/generators/react-component/generator.ts): Generator logic
- [src/generators/react-component/schema.json](src/generators/react-component/schema.json): CLI schema (`name`, `project`)
- [src/generators/react-component/templates/](src/generators/react-component/templates/): Templates (`__namePascalCase__.tsx`, `__namePascalCase__.test.tsx`)

### nestjs-service-module

- [src/generators/nestjs-service-module/generator.ts](src/generators/nestjs-service-module/generator.ts): Generator logic
- [src/generators/nestjs-service-module/schema.json](src/generators/nestjs-service-module/schema.json): CLI schema (`name`, `project`)
- [src/generators/nestjs-service-module/templates/](src/generators/nestjs-service-module/templates/): Templates (`__nameCamelCase__.module.ts`, `__nameCamelCase__.service.ts`, etc.)

### Shared utilities

- [src/utilities.ts](src/utilities.ts): `resolveProjectByTag`, `resolveNameByCase` helpers
- [src/constants.ts](src/constants.ts): String-case converters
- [src/types.ts](src/types.ts): Shared type definitions
- [src/validators/](src/validators/): Conformance validators
- [generators.json](generators.json): Generator registry
