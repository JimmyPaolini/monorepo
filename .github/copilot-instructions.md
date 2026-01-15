# Copilot Instructions for Monorepo

## Architecture Overview

This is an **Nx monorepo** with strict TypeScript, pnpm workspace management, and multiple application types:

- **caelundas**: Node.js CLI app for astronomical calendar generation (ephemeris calculations, aspect events)
- **lexico**: TanStack Start + Supabase web app with SSR
- **lexico-components**: Shared React component library using shadcn/ui (New York style)

Key architectural principles:

- Nx handles all task execution (`nx run`, `nx affected`, never run tooling directly)
- Shared TypeScript path mappings via [tsconfig.base.json](tsconfig.base.json)
- Type-safe imports enforced with `verbatimModuleSyntax` and `consistent-type-imports`
- Strict null checks enabled: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`

## Developer Workflows

### Running Tasks

```bash
# Always use Nx to run tasks - it handles caching and dependencies
nx run caelundas:develop              # Run with .env loaded
nx run lexico:develop                 # Start dev server
nx affected --target=test             # Test only changed projects
nx run-many --target=lint --all      # Lint everything

# Use Nx MCP tools when available (nx_workspace, nx_project_details, nx_docs)
```

### Pre-commit Automation

Husky + lint-staged automatically runs on staged files:

- Format (Prettier)
- Lint (ESLint with strict type checking)
- Typecheck (tsc --noEmit)

Commits must follow [Conventional Commits](https://www.conventionalcommits.org/)
with gitmoji prefixes. Valid scopes: `monorepo`, `caelundas`, `lexico`,
`lexico-components`, `JimmyPaolini`, `documentation`, `dependencies`,
`infrastructure`, `ci`. See [commitlint.config.ts](commitlint.config.ts).

**IMPORTANT: Subject line must be under 50 characters** (Conventional Commits
best practice)

Examples:

- ✅ `chore(infrastructure): enforce markdown styles` (48 chars)
- ❌ `chore(infrastructure): enforce specific markdown formatting styles` (72 chars - TOO LONG)

Format: `<type>(<scope>): <subject>` where subject is max 49 characters, imperative mood, no period.

Optional body (wrap at 72 chars, blank line after subject):

```
chore(infrastructure): enforce markdown styles

- Require backticks for code fences
- Use ATX-style headers (# ## ###)
- Use dash (-) for list bullets
```

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

### Testing Strategy (caelundas)

Three test types with distinct naming:

- `*.unit.test.ts`: Pure functions, no I/O
- `*.integration.test.ts`: Database interactions
- `*.end-to-end.test.ts`: Full app execution

Run specific types: `nx run caelundas:test:unit`

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

- **setup.yml**: Reusable workflow for pnpm install + Nx caching
- **lint.yml**, **typecheck.yml**, **test.yml**, **format.yml**: Run on affected projects

All workflows use `nrwl/nx-set-shas` to calculate affected projects from git diff.

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
- [AGENTS.md](AGENTS.md): Nx-specific MCP tool guidance
- [applications/caelundas/src/main.ts](applications/caelundas/src/main.ts): Ephemeris pipeline entry point
- [packages/lexico-components/components.json](packages/lexico-components/components.json): shadcn configuration
