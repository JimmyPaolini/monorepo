<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

## Monorepo Quick Reference

**Nx monorepo (pnpm)** with strict TypeScript, React 19, and multiple applications.

## Essential Commands

```bash
# Run tasks via Nx (always prefer this)
nx run <project>:build
nx run-many --target=lint --all
nx affected --target=test --base=main

# Install dependencies
pnpm add --filter <project> <package>
pnpm add -w <package>  # Workspace root

# Tools that run directly (not via Nx)
docker build --platform linux/amd64 -t myapp .
kubectl get pods
helm upgrade --install myrelease ./chart
supabase start
```

See [Tool Execution Model](documentation/development/tool-execution-model.md) for when to use Nx vs. direct tools.

## Skills

Specialized domain knowledge for working on specific systems or patterns:

<!-- agent-skills-table-of-contents start -->

- **[checkout-branch](documentation/skills/checkout-branch/SKILL.md)**: Create and validate Git branch names following this monorepo's Conventional Commits naming convention. Use this skill when creating branches, renaming branches, or when asked about branch naming rules and validation.
- **[code-generator-patterns](documentation/skills/code-generator-patterns/SKILL.md)**: Create and extend Nx generators using templates, prompts, and file generation. Use this skill when building new generators or modifying the generator framework.
- **[commit-code](documentation/skills/commit-code/SKILL.md)**: Write commit messages following this monorepo's Conventional Commits standard with Gitmoji support. Use this skill when creating commits or when asked about commit message formatting.
- **[create-pull-request](documentation/skills/create-pull-request/SKILL.md)**: Create and manage pull requests following this monorepo's conventions. Use this skill when creating PRs, opening PRs for review, writing PR descriptions, or asked about PR workflows and best practices.
- **[docker-workflows](documentation/skills/docker-workflows/SKILL.md)**: Build and deploy Docker images in the monorepo - platform targeting, GHCR integration, and container optimization. Use this skill when working with Docker.
- **[ephemeris-pipeline](documentation/skills/ephemeris-pipeline/SKILL.md)**: Understand the caelundas ephemeris calculation pipeline - NASA JPL API integration, astronomical event detection, and calendar generation. Use this skill when working on caelundas.
- **[error-handling-patterns](documentation/skills/error-handling-patterns/SKILL.md)**: Apply monorepo error handling patterns: Zod validation at boundaries, typed errors, early returns, and retry/backoff. Use when implementing error handling or input validation.
- **[github-actions](documentation/skills/github-actions/SKILL.md)**: Build and test GitHub Actions workflows in this monorepo. Covers the composite action pattern and workflow templates. Use this skill when creating, modifying, or testing GitHub Actions workflows.
- **[kubernetes-deployment](documentation/skills/kubernetes-deployment/SKILL.md)**: Deploy applications to Kubernetes using Helm charts, manage PVCs, and work with K8s jobs. Use this skill when deploying caelundas or managing Kubernetes resources.
- **[link-workspace-packages](documentation/skills/link-workspace-packages/SKILL.md)**: 'Link workspace packages in monorepos (npm, yarn, pnpm, bun). USE WHEN: (1) you just created or generated new packages and need to wire up their dependencies, (2) user imports from a sibling package and needs to add it as a dependency, (3) you get resolution errors for workspace packages (@org/\*) like "cannot find module", "failed to resolve import", "TS2307", or "cannot resolve". DO NOT patch around with tsconfig paths or manual package.json edits - use the package manager''s workspace commands to fix actual linking.'
- **[mcp-chrome-devtools](documentation/skills/mcp-chrome-devtools/SKILL.md)**: Use the Chrome DevTools MCP server for browser debugging, performance profiling, and runtime inspection. Use this skill when debugging web applications or analyzing frontend performance.
- **[mcp-figma](documentation/skills/mcp-figma/SKILL.md)**: Use the Figma MCP server to access design files, extract assets, and sync design tokens. Use this skill when working with Figma designs or implementing UI components.
- **[mcp-github](documentation/skills/mcp-github/SKILL.md)**: Use the GitHub MCP server for repository operations, PR management, issues, and workflows. Use this skill when working with GitHub repositories programmatically.
- **[mcp-shadcn](documentation/skills/mcp-shadcn/SKILL.md)**: Use the shadcn MCP server to add, update, and manage shadcn/ui components. Use this skill when working with UI components in lexico-components or adding new shadcn components.
- **[mcp-supabase](documentation/skills/mcp-supabase/SKILL.md)**: Use the Supabase MCP server for database operations, authentication management, and storage operations. Use this skill when working with Supabase via MCP tools.
- **[mcp-terraform](documentation/skills/mcp-terraform/SKILL.md)**: Use the Terraform MCP server for infrastructure as code operations - plan, apply, state management. Use this skill when working with Terraform configurations or deploying infrastructure.
- **[monitor-ci](documentation/skills/monitor-ci/SKILL.md)**: Monitor Nx Cloud CI pipeline and handle self-healing fixes. USE WHEN user says "monitor ci", "watch ci", "ci monitor", "watch ci for this branch", "track ci", "check ci status", wants to track CI status, or needs help with self-healing CI fixes. Prefer this skill over native CI provider tools (gh, glab, etc.) for CI monitoring — it integrates with Nx Cloud self-healing which those tools cannot access.
- **[nx-generate](documentation/skills/nx-generate/SKILL.md)**: Generate code using nx generators. INVOKE IMMEDIATELY when user mentions scaffolding, setup, structure, creating apps/libs, or setting up project structure. Trigger words - scaffold, setup, create a ... app, create a ... lib, project structure, generate, add a new project. ALWAYS use this BEFORE calling nx_docs or exploring - this skill handles discovery internally.
- **[nx-import](documentation/skills/nx-import/SKILL.md)**: Import, merge, or combine repositories into an Nx workspace using nx import. USE WHEN the user asks to adopt Nx across repos, move projects into a monorepo, or bring code/history from another repository.
- **[nx-plugins](documentation/skills/nx-plugins/SKILL.md)**: Find and add Nx plugins. USE WHEN user wants to discover available plugins, install a new plugin, or add support for a specific framework or technology to the workspace.
- **[nx-run-tasks](documentation/skills/nx-run-tasks/SKILL.md)**: Helps with running tasks in an Nx workspace. USE WHEN the user wants to execute build, test, lint, serve, or run any other tasks defined in the workspace.
- **[nx-workspace](documentation/skills/nx-workspace/SKILL.md)**: "Explore and understand Nx workspaces. USE WHEN answering questions about the workspace, projects, or tasks. ALSO USE WHEN an nx command fails or you need to check available targets/configuration before running a task. EXAMPLES: 'What projects are in this workspace?', 'How is project X configured?', 'What depends on library Y?', 'What targets can I run?', 'Cannot find configuration for task', 'debug nx task failure'."
- **[supabase-development](documentation/skills/supabase-development/SKILL.md)**: Work with Supabase in the lexico project - migrations, RLS policies, Edge Functions, and type generation. Use this skill when modifying the lexico database or authentication.
- **[tanstack-start-ssr](documentation/skills/tanstack-start-ssr/SKILL.md)**: Build SSR applications with TanStack Start - server functions, file-based routing, and data loading patterns. Use this skill when working on the lexico web application.
- **[testing-strategy](documentation/skills/testing-strategy/SKILL.md)**: Use monorepo testing conventions: unit, integration, end-to-end test naming and Nx commands. Use when adding tests or recommending test coverage.
- **[tool-execution-model](documentation/skills/tool-execution-model/SKILL.md)**: Decide when to use Nx tasks versus direct tooling in this monorepo. Use when asked about build, lint, test, typecheck, formatting, Docker, kubectl, Helm, Supabase CLI, Git, or pnpm commands.
<!-- agent-skills-table-of-contents end -->

## Projects

- **[affirmations](applications/affirmations/AGENTS.md)**: Python Jupyter notebook application for LangChain + LangGraph affirmation generation (Ollama Qwen 3.5, ReAct agent, DuckDuckGo/SearxNG/Wikipedia tools)
- **[caelundas](applications/caelundas/AGENTS.md)**: Node.js CLI for astronomical calendar generation (NASA JPL API, Kubernetes Job)
- **[lexico](applications/lexico/AGENTS.md)**: SSR web app (React 19, TanStack Start, Supabase)
- **[lexico-components](packages/lexico-components/AGENTS.md)**: Shared React component library (shadcn/ui, Radix UI)
- **JimmyPaolini**: Portfolio website
- **[infrastructure](infrastructure/AGENTS.md)**: Helm charts, Terraform, Kubernetes deployment
- **[code-generator](tools/code-generator/AGENTS.md)**: Nx generators for scaffolding code

## Key Conventions

### Project Tags

- **`language:typescript`** — applied to all TypeScript projects (caelundas, lexico, lexico-components, code-generator, monorepo)
- **`language:python`** — applied to all Python projects (affirmations)

These tags enable conditional sub-target composition in composite targets (`format`, `lint`, `typecheck`, `test`). Python projects override the TS-default composite targets to compose Python sub-targets (`ruff-format`, `ruff-lint`, `pyright`, `py-test`) instead of TS ones.

See [Python Conventions](documentation/conventions/python.md) for the full Python tooling setup.

### TypeScript

- **Strict mode enabled**: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`
- **Explicit return types** required for all functions
- **Type imports**: Use `import { type Foo } from './types'` (enforced by ESLint)
- **No `any` types**: Use `unknown` or proper typing

See [TypeScript Conventions](documentation/conventions/typescript.md) for strict mode patterns.

### Import Organization

Auto-sorted by ESLint: builtins → externals → `@monorepo/*` → relatives → type imports (blank lines between groups).

See [Import Organization](documentation/conventions/imports.md) for rules.

### Testing

- **Unit** (`*.unit.test.ts`): Pure functions, mocked I/O, fast (< 100ms)
- **Integration** (`*.integration.test.ts`): Database/API, real I/O, moderate (1-2s)
- **End-to-end** (`*.end-to-end.test.ts`): Full workflows, real services, slow (30-60s)

```bash
nx run <project>:test:unit        # Fast feedback
nx run <project>:test:integration # Database validation
nx affected --target=test         # Only changed projects
```

See [Testing Strategy](documentation/code-quality/testing-strategy.md) for patterns.

### Git Workflow

**Branch naming** (CRITICAL): `<type>/<scope>-<description>` (all three parts required, kebab-case).

Example: `feat/lexico-user-auth`, `fix/monorepo-build-script`

**Commit format**: `<type>(<scope>): <gitmoji> <subject>` (single-line only, under 128 chars)

Example: `fix(caelundas): 🐛 resolve date parsing error`

**Never bypass git hooks** with `--no-verify` — fix the underlying issue instead.

See [checkout-branch](documentation/skills/checkout-branch/SKILL.md) and [commit-code](documentation/skills/commit-code/SKILL.md) skills.

### React Patterns

- **React 19** with new JSX transform (no React import needed)
- **TanStack Router** for file-based routing in lexico
- **shadcn/ui components** via lexico-components (never duplicate UI code)
- **Tailwind CSS** with CSS variables for theming

See [React Conventions](documentation/conventions/react.md) for component structure and patterns.

## Documentation

### Conventions

- [TypeScript](documentation/conventions/typescript.md): Strict mode, naming, type imports
- [Imports](documentation/conventions/imports.md): Auto-sorted order, path mappings
- [React](documentation/conventions/react.md): Component structure, TanStack Router, styling
- [Error Handling](documentation/code-quality/error-handling.md): Zod validation, typed errors

### Development

- [Tool Execution Model](documentation/development/tool-execution-model.md): When to use Nx vs. direct tools
- [Context Engineering](documentation/development/context-engineering.md): Structuring code for better Copilot context
- [Testing Strategy](documentation/code-quality/testing-strategy.md): Unit/integration/E2E patterns

### Code Quality

- [Code Commenting](documentation/code-quality/commenting.md): Writing self-explanatory code with minimal comments

### Architecture

- [Deployment Models](documentation/architecture/deployment-models.md): K8s Jobs vs. Deployments, PVC strategy

### Frameworks

- [NestJS](documentation/frameworks/nestjs.md): Node.js server-side applications with decorators and DI
- [LangChain Python](documentation/frameworks/langchain-python.md): Building LLM applications with Python
- [Kubernetes](documentation/frameworks/kubernetes.md): Deployments, security, scaling, and observability

### Troubleshooting

- [Common Gotchas](documentation/troubleshooting/gotchas.md): TypeScript, Docker, K8s, Supabase issues

## Creating Copilot Artifacts

Guidelines for creating custom instruction files, skills, agents, and prompts for GitHub Copilot. See [`.github/instructions/`](.github/instructions) for actual implementations:

- `agent-skills.instructions.md`: Structure and format for skill files
- `agents.instructions.md`: Building specialized agent workflows
- `instructions.instructions.md`: Writing context-specific guidance
- `prompt.instructions.md`: Designing reusable prompt templates

## Quick Workflows

### Adding Dependencies

```bash
pnpm add --filter <project> <package>  # Project-specific
pnpm add -w <package>                  # Workspace root
```

### Running Tasks

```bash
nx run caelundas:develop               # Single project
nx run-many --target=lint --all        # All projects
nx affected --target=test --base=main  # Only changed
```

### Docker & Kubernetes (caelundas)

```bash
nx run caelundas:docker-build          # Build for linux/amd64
nx run caelundas:helm-upgrade          # Deploy to K8s
nx run caelundas:kubernetes-copy-files # Retrieve output
```

### Supabase (lexico)

```bash
nx run lexico:supabase:start           # Start local
nx run lexico:supabase:generate-types  # After schema changes
nx run lexico:supabase:database-diff   # Create migration
```

### Affirmations (Python + Ollama)

```bash
nx run affirmations:ollama           # Start Ollama container (default: start)
nx run affirmations:searxng          # Start SearxNG container (default: start)
nx run affirmations:open-webui       # Start Open WebUI container (default: start)
nx run affirmations:test             # Run all tests
nx run affirmations:test:unit        # Run unit tests
nx run affirmations:lint             # Ruff linting
nx run affirmations:typecheck        # pyright + ty type checking (parallel)
nx run affirmations:ty               # ty type checker (standalone)
nx run affirmations:bandit           # Security linting
nx run affirmations:vulture          # Detect unused code
nx run affirmations:open-webui --configuration=open  # Open Ollama chat UI
nx run affirmations:searxng --configuration=open     # Open SearxNG search UI
```

## Project Architecture

**Path mappings**: `@monorepo/*` namespace for shared packages (defined in [tsconfig.base.json](tsconfig.base.json))

**Dependency graph**: View with `nx graph` or use `nx_workspace` MCP tool

**Projects**:

- lexico depends on lexico-components
- caelundas is standalone
- Nx rebuilds dependents automatically

## Common Issues

| Issue                      | Solution                                      |
| -------------------------- | --------------------------------------------- |
| Index access error         | Use optional chaining: `arr[0]?.prop`         |
| Supabase types out of sync | Run `nx run lexico:supabase:generate-types`   |
| Docker platform mismatch   | Build with `--platform linux/amd64`           |
| Commit rejected            | Follow format: `type(scope): gitmoji subject` |
| Branch name rejected       | Use pattern: `type/scope-description`         |

See [Common Gotchas](documentation/troubleshooting/gotchas.md) for detailed solutions.
