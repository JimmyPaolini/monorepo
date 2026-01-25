<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always
  prefer running the task through `nx` (i.e. `nx run`, `nx run-many`,
  `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace`
  tool first to gain an understanding of the workspace architecture where
  applicable.
- When working in individual projects, use the `nx_project_details` mcp
  tool to analyze and understand the specific project structure and
  dependencies
- For questions around nx configuration, best practices or if you're
  unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always
  use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors

<!-- nx configuration end-->

## Monorepo Architecture

This workspace uses Nx to manage three distinct application types and shared libraries:

- **caelundas**: Node.js CLI for astronomical calendar generation (ephemeris calculations via NASA JPL API)
- **lexico**: TanStack Start SSR web application with Supabase backend (Latin dictionary)
- **JimmyPaolini**: Portfolio website
- **lexico-components**: Shared React component library (shadcn/ui)

### Key Architectural Decisions

**Why Nx?**

- Incremental builds via computation caching (only rebuild affected projects)
- Task orchestration with dependency awareness (implicit dependencies in project.json)
- Consistent tooling across TypeScript/Node.js/React projects
- Affected command support for efficient CI/CD (`nx affected --target=test`)

#### Dependency Graph Strategy

Projects declare implicit dependencies in their `project.json`:

- lexico depends on lexico-components (UI library)
- caelundas is standalone (no internal dependencies)
- Nx automatically rebuilds dependents when dependencies change

View the graph: `nx graph` or use the `nx_workspace` MCP tool

#### TypeScript Path Mappings

Shared packages use the `@monorepo/*` namespace defined in [tsconfig.base.json](tsconfig.base.json):

```typescript
import { Button } from "@monorepo/lexico-components";
```

This enables:

- Refactor-safe imports (no relative path breakage)
- Clear distinction between external and internal packages
- IDE autocomplete for monorepo packages

#### Strict TypeScript Configuration

All projects inherit from `tsconfig.base.json` with strict settings:

- `verbatimModuleSyntax` + `consistent-type-imports` (explicit type imports)
- `noUncheckedIndexedAccess` (array access requires null checks)
- `exactOptionalPropertyTypes` (strict optional property handling)
- All strict flags enabled (`strict: true`)

#### Testing Strategy

- **Unit tests** (`*.unit.test.ts`): Pure functions, no I/O
- **Integration tests** (`*.integration.test.ts`): Database/API interactions
- **End-to-end tests** (`*.end-to-end.test.ts`): Full application workflows

Run specific test types: `nx run <project>:test:unit`

### Project-Specific Documentation

For detailed architecture, workflows, and domain knowledge:

- **[applications/caelundas/AGENTS.md](applications/caelundas/AGENTS.md)**: Ephemeris pipeline, NASA API integration, Kubernetes deployment
- **[applications/lexico/AGENTS.md](applications/lexico/AGENTS.md)**: Supabase architecture, TanStack Start SSR, authentication flows
- **[packages/lexico-components/AGENTS.md](packages/lexico-components/AGENTS.md)**: Component library patterns, shadcn integration, theming
- **[infrastructure/AGENTS.md](infrastructure/AGENTS.md)**: Helm charts, Terraform, Kubernetes deployment workflows
- **[tools/code-generator/AGENTS.md](tools/code-generator/AGENTS.md)**: Generator development, template syntax, creating new generators

### Common Workflows

#### Adding New Dependencies

```bash
# Install to specific project
pnpm add --filter <project-name> <package>

# Install to workspace root (shared tooling)
pnpm add -w <package>
```

#### Running Tasks

```bash
# Single project
nx run caelundas:develop
nx run lexico:develop

# Many projects
nx run-many --target=lint --all
nx run-many --target=test --projects=caelundas,lexico

# Only affected projects (based on git diff)
nx affected --target=test
nx affected --target=build --base=main
```

#### Understanding Project Configuration

Use MCP tools for real-time project analysis:

- `nx_workspace`: Overall workspace structure and errors
- `nx_project_details`: Specific project targets and configuration
- `nx_docs`: Up-to-date Nx documentation (never assume Nx knowledge)

#### Cache Management

Nx caches task outputs locally and remotely (if configured):

```bash
# Clear local cache
nx reset

# Skip cache for specific run
nx run caelundas:build --skip-nx-cache
```

### Performance Optimization

#### Parallel Execution

Nx runs independent tasks in parallel automatically:

```bash
# Runs tests for all projects in parallel (where possible)
nx run-many --target=test --all
```

#### Incremental Builds

Configure `outputs` in `project.json` to enable caching:

```json
{
  "targets": {
    "build": {
      "outputs": ["{projectRoot}/dist"]
    }
  }
}
```

#### Affected Commands

CI workflows use affected commands to test only changed projects:

```bash
# Test only projects affected by changes since main branch
nx affected --target=test --base=main
```
