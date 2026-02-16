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

## Architecture Overview

This is an **Nx monorepo** with strict TypeScript, pnpm workspace management, and multiple application types:

Key architectural principles:

- Nx handles all task execution (`nx run`, `nx affected`, never run tooling directly)
- Shared TypeScript path mappings via [tsconfig.base.json](tsconfig.base.json)
- Type-safe imports enforced with `verbatimModuleSyntax` and `consistent-type-imports`
- Strict null checks enabled: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`

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

### Git Workflow Rules

#### Branch Naming (CRITICAL)

Branch names **must** follow the pattern: `<type>/<scope>-<description>` (all three parts required, kebab-case).

Example: `feat/lexico-user-auth`, `fix/monorepo-build-script`, `docs/caelundas-api-guide`

Validation runs on `git push` via `.husky/pre-push` hook. Valid types, scopes, and full details in [checkout-branch skill](documentation/skills/checkout-branch/SKILL.md).

#### Git Hooks (NEVER BYPASS)

**Do NOT use `--no-verify` to skip git hooks.**

```bash
# ❌ NEVER DO THIS
git commit --no-verify  # Bypasses linting, formatting, commitlint
git push --no-verify    # Bypasses branch name validation

# ✅ INSTEAD: Fix the underlying issue
# - If linting fails: run `nx run-many --target=lint --all` and fix errors
# - If formatting fails: run `pnpm format` to auto-fix
# - If commitlint fails: fix the commit message format
# - If branch name fails: rename the branch with `git branch -m <new-name>`
```

If a hook is genuinely broken (e.g., dependency issue), fix the hook configuration rather than bypassing it.

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

### Dev Container Environment

This monorepo includes a dev container for consistent, reproducible development environments.

**Quick Start:**

1. Open repo in VS Code with Dev Containers extension
2. Click "Reopen in Container" when prompted
3. Container includes: Node.js 22.20.0, pnpm 10.20.0, Supabase CLI, kubectl, Helm, GitHub CLI

**When to use:**

- New contributors getting started quickly
- Ensuring consistent tooling versions across team
- Avoiding "works on my machine" issues
- Development on non-macOS systems

See [.devcontainer/README.md](.devcontainer/README.md) for full configuration details and troubleshooting.

## Code Conventions

### TypeScript Standards

- **Explicit return types required** for all functions (`@typescript-eslint/explicit-function-return-type`)
- **No `any` types** - use `unknown` or proper typing
- **Type imports only**: `import { type Foo } from './foo'` (enforced by `consistent-type-imports`)
- **Naming conventions**:
  - PascalCase: Types, interfaces, classes, React components
  - camelCase: Variables, functions
  - UPPER_CASE: Enum members, constants

### Import Organization

Auto-sorted by eslint-plugin-import in this order:

1. Node builtins (`node:fs`, `node:path`)
2. External packages (`react`, `moment`)
3. Internal paths (`@monorepo/lexico-components`)
4. Parent/sibling relative imports
5. Type imports (always last)

Add blank lines between groups (enforced by `import/order`).

### React Patterns

- Use **React 19** with new JSX transform (no React import needed)
- **TanStack Router** for routing in lexico (file-based routes)
- **shadcn/ui components** via lexico-components (never copy components between apps)
- **Tailwind CSS** with CSS variables for theming (see `packages/lexico-components/components.json`)

### Pre-commit Automation

Husky + lint-staged automatically runs on staged files (see `lint-staged.config.ts`):

- **TypeScript/JavaScript**: format, lint, typecheck, spell-check (per affected project + monorepo)
- **JSON/CSS/HTML**: format, spell-check
- **Markdown**: format, lint, markdown-lint, spell-check
- **YAML**: format, yaml-lint, spell-check
- **package.json / pnpm-workspace.yaml**: lockfile integrity check
- **Config syncs**: VSCode extensions sync, conventional config sync

Additional Husky hooks:

- `commit-msg`: commitlint (enforces Conventional Commits with gitmoji)
- `pre-push`: validate-branch-name (enforces `<type>/<scope>-<description>`)

### Error Handling

- **Zod schemas** for input validation — parse user/API inputs at boundaries, let TypeScript handle internal types
- **Early returns** with descriptive error messages — avoid deep nesting of try/catch
- **No swallowed errors** — always log or re-throw; never use empty catch blocks
- **Typed errors** — avoid `catch (e: any)`; use `unknown` and narrow with type guards
- **Graceful degradation** in API calls — use retry logic with exponential backoff (see caelundas `MAX_RETRIES` / `BACKOFF_MULTIPLIER` env vars)
- **Server functions** (lexico) — throw errors that TanStack Start surfaces to `errorComponent`

Commits must follow [Conventional Commits](https://www.conventionalcommits.org/)
with gitmoji prefixes. Valid types and scopes are defined in
[conventional.config.cjs](conventional.config.cjs).
**IMPORTANT: Commits must be single-line only (no body or footer sections)**

Format: `<type>(<scope>): <gitmoji> <subject>`

- Header must be under 128 characters (enforced by `commitlint.config.ts`)
- Aim for under 72 characters for readability
- Imperative mood required (e.g., "add" not "added")
- No period at end

See [commit-code skill](documentation/skills/commit-code/SKILL.md) for full gitmoji reference, type/scope tables, and examples.

### Supabase Development (lexico)

```bash
nx run lexico:supabase:start          # Starts local Docker environment
nx run lexico:supabase:generate-types # Generates TypeScript types from schema
nx run lexico:supabase:database-diff  # Creates migration from local changes
```

Migrations live in `applications/lexico/supabase/migrations/`. Always generate types after schema changes.

### Docker & Kubernetes (caelundas)

```bash
nx run caelundas:docker-build         # Builds for linux/amd64
nx run caelundas:helm-upgrade         # Deploys to k8s with auto-generated name
nx run caelundas:kubernetes-copy-files # Retrieves output from completed job
```

Uses [infrastructure/helm/kubernetes-job](infrastructure/helm/kubernetes-job) chart. Jobs mount PVCs for input/output.

## Project-Specific Details

### caelundas Ephemeris Domain

- Calculates planetary positions and aspects using NASA JPL data
- Event types: Major/minor/specialty aspects, stelliums, solar cycles
- Timezone-aware calculations using `moment-timezone` and `@photostructure/tz-lookup`
- Output formats: iCal, JSON (see [output.utilities.ts](applications/caelundas/src/output.utilities.ts))
- Database: SQLite for caching ephemerides and active aspects

### lexico Component Library

- **Never modify files in** `packages/lexico-components/src/components/ui`
  (shadcn-generated)
- Add custom components to `packages/lexico-components/src/components`
- Uses New York shadcn style with gray base color
- Import via path alias: `import { Button } from '@monorepo/lexico-components'`

### Nx Implicit Dependencies

Defined in `project.json` files (e.g., lexico depends on lexico-components). Nx
rebuilds dependencies automatically when running build targets.

## CI/CD

GitHub Actions workflows in `.github/workflows/`:

- **build-code.yml**: Builds affected projects and posts bundle size reports on PRs
- **build-devcontainer.yml**: Builds/pushes dev container image on `.devcontainer/` changes
- **code-analysis.yml**: Matrix of 8 checks (type check, lint, markdown lint, YAML lint, format, knip, spell check, type coverage)
- **convention-check.yml**: Validates PR branch name, title (commitlint), and body sections
- **dependency-analysis.yml**: Dependency cruiser, security audit, license check (also weekly)
- **dependency-updates.yml**: Weekly automated dependency update PRs via npm-check-updates
- **knip-cleanup.yml**: Weekly automated dead code removal PRs
- **release-projects.yml**: Semantic-release on push to main
- **test-coverage.yml**: Runs affected tests with coverage and uploads artifacts

All workflows use the `.github/actions/setup-monorepo` composite action (pnpm, Node.js, yamllint,
Nx SHAs via `nrwl/nx-set-shas`, and Nx cache).

## Common Gotchas

1. **Don't bypass Nx**: Running `pnpm test` directly skips caching and dependency checks
2. **TypeScript strictness**: Index signatures require null checks (`arr[0]?.prop` not `arr[0].prop`)
3. **ESLint in JS files**: Type-checked rules disabled for `.js` config files (see [eslint.config.base.ts](eslint.config.base.ts))
4. **Supabase types**: Regenerate after every schema change or migrations will fail type checking
5. **Docker platform**: Always build for linux/amd64 when deploying to k8s (Apple Silicon mismatch)
6. **Shadcn updates**: Use `pnpx shadcn@latest add <component>` in lexico-components, never edit ui/ directly

## Key Files

- [nx.json](nx.json): Task defaults, caching, affected computation
- [tsconfig.base.json](tsconfig.base.json): Path mappings for monorepo packages
- [eslint.config.base.ts](eslint.config.base.ts): Flat config with strict rules, import sorting
- [applications/caelundas/src/main.ts](applications/caelundas/src/main.ts): Ephemeris pipeline entry point
- [packages/lexico-components/components.json](packages/lexico-components/components.json): shadcn configuration
