# Conformance: Nx Custom Generator Framework

## Quick Start

Generate a React component (prompts for project if `--project` omitted):

```bash
nx generate conformance:react-component --name=Button
nx generate conformance:react-component --name=Button --project=lexico-components
```

Generate a NestJS service module (prompts for project if `--project` omitted):

```bash
nx generate conformance:nestjs-service-module --name=user
nx generate conformance:nestjs-service-module --name=userProfile --project=my-nestjs-app
```

Generate a NestJS command module (prompts for project if `--project` omitted):

```bash
nx generate conformance:nestjs-command-module --name=processor
nx generate conformance:nestjs-command-module --name=dataSync --project=lexico-ingestion
nx g conformance:ncm --name=processor
```

Generate a NestJS GraphQL module (prompts for project if `--project` omitted):

```bash
nx generate conformance:nestjs-graphql-module --name=post
nx generate conformance:nestjs-graphql-module --name=post --project=my-nestjs-app
nx g conformance:ngm --name=post
```

Short alias forms:

```bash
nx g conformance:react-component --name=Dialog
nx g conformance:nestjs-service-module --name=auth
nx g conformance:nestjs-graphql-module --name=post
```

Generate a NestJS GraphQL API application scaffold:

```bash
nx generate conformance:nestjs-graphql-application --name=stellar-api
nx g conformance:nestjs-graphql-application --name=stellar-api
```

Generate a NestJS command-line application scaffold:

```bash
nx generate conformance:nestjs-command-application --name=stellar-cli
nx g conformance:nestjs-command-application --name=stellar-cli
```

## Architecture Overview

### Directory Layout

```text
tools/conformance/
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
│   │   └── nestjs-graphql-module/
│   │       ├── generator.ts
│   │       ├── generator.unit.test.ts
│   │       ├── schema.json
│   │       └── templates/
│   │           ├── __nameKebabCase__.args.ts
│   │           ├── __nameKebabCase__.constants.ts
│   │           ├── __nameKebabCase__.dataloader.ts
│   │           ├── __nameKebabCase__.dataloader.unit.test.ts
│   │           ├── __nameKebabCase__.entities.ts
│   │           ├── __nameKebabCase__.factories.ts
│   │           ├── __nameKebabCase__.inputs.ts
│   │           ├── __nameKebabCase__.module.ts
│   │           ├── __nameKebabCase__.resolver.ts
│   │           ├── __nameKebabCase__.resolver.unit.test.ts
│   │           ├── __nameKebabCase__.service.ts
│   │           ├── __nameKebabCase__.service.unit.test.ts
│   │           └── __nameKebabCase__.types.ts
│   │   └── nestjs-command-application/
│   │       ├── generator.ts
│   │       ├── generator.unit.test.ts
│   │       ├── schema.json
│   │       └── templates/
│   │   └── nestjs-graphql-application/
│   │       ├── generator.ts
│   │       ├── generator.unit.test.ts
│   │       ├── schema.json
│   │       └── templates/
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

### nestjs-graphql-module: `--name=post --project=my-nestjs-app`

Files created in `<projectRoot>/src/modules/post/`:

```text
src/modules/post/
├── post.args.ts
├── post.constants.ts
├── post.dataloader.ts
├── post.dataloader.unit.test.ts
├── post.entities.ts
├── post.factories.ts
├── post.inputs.ts
├── post.module.ts
├── post.resolver.ts
├── post.resolver.unit.test.ts
├── post.service.ts
├── post.service.unit.test.ts
└── post.types.ts
```

### nestjs-graphql-application: `--name=stellar-api`

Files created in `applications/stellar-api/`:

```text
applications/stellar-api/
├── src/
│   ├── main.ts
│   ├── main.end-to-end.test.ts
│   └── modules/
│       ├── stellar-api/              ← root NestJS module
│       │   ├── stellar-api.module.ts
│       │   ├── stellar-api.constants.ts
│       │   └── stellar-api.types.ts
│       ├── logger/
│       └── sample/                   ← example GraphQL module
│           ├── sample.module.ts
│           ├── sample.resolver.ts
│           ├── sample.service.ts
│           ├── sample.dataloader.ts
│           ├── sample.entities.ts
│           ├── sample.inputs.ts
│           ├── sample.args.ts
│           ├── sample.factories.ts
│           └── sample.*.unit.test.ts
├── testing/
├── project.json
├── package.json
└── tsconfig.json
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

### nestjs-graphql-module

- [src/generators/nestjs-graphql-module/generator.ts](src/generators/nestjs-graphql-module/generator.ts): Generator logic
- [src/generators/nestjs-graphql-module/schema.json](src/generators/nestjs-graphql-module/schema.json): CLI schema (`name`, `project`)
- [src/generators/nestjs-graphql-module/templates/](src/generators/nestjs-graphql-module/templates/): Templates (`__nameKebabCase__.resolver.ts`, `__nameKebabCase__.dataloader.ts`, `__nameKebabCase__.entities.ts`, `__nameKebabCase__.inputs.ts`, `__nameKebabCase__.args.ts`, `__nameKebabCase__.factories.ts`, etc.)

### nestjs-command-application

- [src/generators/nestjs-command-application/generator.ts](src/generators/nestjs-command-application/generator.ts): Generator logic
- [src/generators/nestjs-command-application/schema.json](src/generators/nestjs-command-application/schema.json): CLI schema (`name`)
- [src/generators/nestjs-command-application/templates/](src/generators/nestjs-command-application/templates/): Application scaffold templates

### nestjs-graphql-application

- [src/generators/nestjs-graphql-application/generator.ts](src/generators/nestjs-graphql-application/generator.ts): Generator logic
- [src/generators/nestjs-graphql-application/schema.json](src/generators/nestjs-graphql-application/schema.json): CLI schema (`name`)
- [src/generators/nestjs-graphql-application/templates/](src/generators/nestjs-graphql-application/templates/): Application scaffold templates (Apollo Server, sample GraphQL module)

### Shared utilities

- [src/utilities.ts](src/utilities.ts): `resolveProjectByTag`, `resolveNameByCase` helpers
- [src/constants.ts](src/constants.ts): String-case converters
- [src/types.ts](src/types.ts): Shared type definitions
- [src/validators/](src/validators/): Conformance validators
- [generators.json](generators.json): Generator registry
