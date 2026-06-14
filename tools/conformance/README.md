# Conformance

Nx plugin for generators and repository conformance utilities.

## Available Generators

| Generator | Alias | Description |
| --------- | ----- | ----------- |
| `jupyter-notebook-application` | `jna` | Generate a Python Jupyter notebook application scaffold |
| `nestjs-command-application` | `nca` | Generate a NestJS command-line application scaffold |
| `nestjs-command-module` | `ncm` | Generate a NestJS command module |
| `nestjs-dataloader-module` | `ndm` | Generate a NestJS DataLoader module |
| `nestjs-graphql-application` | `nga` | Generate a NestJS GraphQL API application scaffold |
| `nestjs-graphql-module` | `ngm` | Generate a NestJS GraphQL module |
| `nestjs-service-module` | `nsm` | Generate a NestJS service module |
| `react-component` | `c` | Generate a React component |

## Common Commands

```bash
pnpm nx run conformance:build
pnpm nx run conformance:test
pnpm nx generate conformance:react-component --name=Button
pnpm nx generate conformance:nestjs-service-module --name=user
pnpm nx generate conformance:nestjs-graphql-application --name=stellar-api
```

## Layout

```text
tools/conformance/
├── src/generators/
├── src/validators/
├── generators.json
├── project.json
└── AGENTS.md
```

## Notes

- `generators.json` is the source of truth for published generator names and
  aliases.
- Template documentation under `src/generators/**/templates/` should stay in
  sync with the targets and files produced by generated projects.

For deeper implementation details, see [AGENTS.md](AGENTS.md).
