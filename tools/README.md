# Tools

Workspace tooling projects for the monorepo.

The `tools/` directory currently contains the `conformance` Nx plugin, which
provides generators and validators used across the workspace.

## Projects

| Project | Purpose |
| ------- | ------- |
| [`conformance`](./conformance/README.md) | Nx generators and conformance validation utilities |

## Common Commands

```bash
pnpm nx run conformance:build
pnpm nx run conformance:test
pnpm nx generate conformance:react-component --name=Button
```

## Notes

- Generator implementations live under `tools/conformance/src/generators/`.
- Validator implementations live under `tools/conformance/src/validators/`.

See [`tools/conformance/AGENTS.md`](./conformance/AGENTS.md) for detailed
implementation guidance.
