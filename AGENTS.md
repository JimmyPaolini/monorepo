
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
```

See [Tool Execution Model](documentation/development/tool-execution-model.md) for when to use Nx vs. direct tools.

## Skills

Specialized domain knowledge for working on specific systems or patterns:

<!-- agent-skills-table-of-contents start -->
- **[backup-code](documentation/skills/backup-code/SKILL.md)**: "Create a safety backup before potentially destructive actions. Use when running risky git commands (reset, rebase, clean, restore, checkout with overwrite, force push), applying large sweeping edits, mass refactors, broad search-and-replace, generator rewrites, or any operation that may be hard to undo. Produces a recoverable snapshot via backup branch, stash, or both, and verifies recovery commands."
- **[change-plan](documentation/skills/change-plan/SKILL.md)**: "Revise an existing implementation plan to incorporate scope changes, new requirements, or corrected assumptions. Use when asked to modify plan tasks, constraints, phases, or implementation approach."
- **[checkout-branch](documentation/skills/checkout-branch/SKILL.md)**: Create and validate Git branch names following this monorepo's Conventional Commits naming convention. Use this skill when creating branches, renaming branches, or when asked about branch naming rules and validation.
- **[code-generator-patterns](documentation/skills/code-generator-patterns/SKILL.md)**: Create and extend Nx generators using templates, prompts, and file generation. Use this skill when building new generators or modifying the generator framework.
- **[commenting](documentation/skills/commenting/SKILL.md)**: Apply monorepo commenting conventions for TypeScript, Python, and any language. USE WHEN writing or reviewing comments, adding section comments, organizing code into logical groups, or asked about comment style. Covers when to comment, how to write good comments, section comment format (emoji + capitalized name), emoji reference table, and anti-patterns to avoid (obvious comments, redundant JSDoc, TODO lint bypasses, dash-line dividers).
- **[commit-code](documentation/skills/commit-code/SKILL.md)**: Write commit messages following this monorepo's Conventional Commits standard with Gitmoji support. Use this skill when creating commits or when asked about commit message formatting.
- **[create-orchestration](documentation/skills/create-orchestration/SKILL.md)**: "Create a multi-agent implementation plan for orchestrate-agents.ts to run in sequence or parallel. Use when asked to split implementation into multiple Copilot sessions, coordinate agent prompts by phase, or generate an executable JSON plan file in documentation/planning."
- **[create-plan](documentation/skills/create-plan/SKILL.md)**: "Create an implementation plan file for new features, fixes, or refactors. Use when asked to plan work, design implementation phases, define requirements, or produce a machine-executable plan document."
- **[create-pull-request](documentation/skills/create-pull-request/SKILL.md)**: Create and manage pull requests following this monorepo's conventions. Use this skill when creating PRs, opening PRs for review, writing PR descriptions, or asked about PR workflows and best practices.
- **[create-worktree](documentation/skills/create-worktree/SKILL.md)**: Create or attach git worktrees that follow this monorepo's branch naming conventions. Use when asked to create a worktree, derive a compliant branch name, validate a branch name before worktree creation, choose a worktree path, or avoid raw `git worktree add` commands.
- **[docker-workflows](documentation/skills/docker-workflows/SKILL.md)**: Build and deploy Docker images in the monorepo - platform targeting, GHCR integration, and container optimization. Use this skill when working with Docker.
- **[error-handling-patterns](documentation/skills/error-handling-patterns/SKILL.md)**: Apply monorepo error handling patterns: Zod validation at boundaries, typed errors, early returns, and retry/backoff. Use when implementing error handling or input validation.
- **[execute-plan](documentation/skills/execute-plan/SKILL.md)**: "Execute an implementation plan by running pending tasks in focused sequence, updating task completion, and verifying outcomes. Use when asked to carry out plan tasks phase by phase."
- **[github-actions](documentation/skills/github-actions/SKILL.md)**: Build and test GitHub Actions workflows in this monorepo. Covers the composite action pattern and workflow templates. Use this skill when creating, modifying, or testing GitHub Actions workflows.
- **[imports-conventions](documentation/skills/imports-conventions/SKILL.md)**: Import organization conventions for TypeScript in this monorepo. Use when writing or reviewing imports, when ESLint reports import order errors, when asked about monorepo path aliases, type-only imports, or named vs default exports. Covers auto-sorted import order, Bundler extensionless imports, relative parent import avoidance, and the monorepo namespace.
- **[kubernetes-deployment](documentation/skills/kubernetes-deployment/SKILL.md)**: Deploy applications to Kubernetes using Helm charts, manage PVCs, and work with K8s jobs. Use this skill when deploying caelundas or managing Kubernetes resources.
- **[learn-lessons](documentation/skills/learn-lessons/SKILL.md)**: 'Retrospective skill that analyzes a coding agent session, a set of local changes, or a branch/pull request, then extracts reusable coding patterns, architectural decisions, and best practices — and writes them into skills and AGENTS.md so future agents apply the same patterns automatically. Primary use: capturing HOW code was written (naming, structure, TypeScript idioms, module patterns, error handling), not just what the agent did. Use when asked to "learn from this session", "capture patterns from this PR", "remember how we did this", "document this approach", "improve skills from this work", or "make sure future agents do it this way".'
- **[link-workspace-packages](documentation/skills/link-workspace-packages/SKILL.md)**: 'Link workspace packages in monorepos (npm, yarn, pnpm, bun). USE WHEN: (1) you just created or generated new packages and need to wire up their dependencies, (2) user imports from a sibling package and needs to add it as a dependency, (3) you get resolution errors for workspace packages (@org/*) like "cannot find module", "failed to resolve import", "TS2307", or "cannot resolve". DO NOT patch around with tsconfig paths or manual package.json edits - use the package manager''s workspace commands to fix actual linking.'
- **[mcp-chrome-devtools](documentation/skills/mcp-chrome-devtools/SKILL.md)**: Use the Chrome DevTools MCP server for browser debugging, performance profiling, and runtime inspection. Use this skill when debugging web applications or analyzing frontend performance.
- **[mcp-figma](documentation/skills/mcp-figma/SKILL.md)**: Use the Figma MCP server to access design files, extract assets, and sync design tokens. Use this skill when working with Figma designs or implementing UI components.
- **[mcp-shadcn](documentation/skills/mcp-shadcn/SKILL.md)**: Use the shadcn MCP server to add, update, and manage shadcn/ui components. Use this skill when working with UI components in lexico-components or adding new shadcn components.
- **[mcp-terraform](documentation/skills/mcp-terraform/SKILL.md)**: Use the Terraform MCP server for infrastructure as code operations - plan, apply, state management. Use this skill when working with Terraform configurations or deploying infrastructure.
- **[monitor-ci](documentation/skills/monitor-ci/SKILL.md)**: Monitor Nx Cloud CI pipeline and handle self-healing fixes. USE WHEN user says "monitor ci", "watch ci", "ci monitor", "watch ci for this branch", "track ci", "check ci status", wants to track CI status, or needs help with self-healing CI fixes. Prefer this skill over native CI provider tools (gh, glab, etc.) for CI monitoring — it integrates with Nx Cloud self-healing which those tools cannot access.
- **[nx-generate](documentation/skills/nx-generate/SKILL.md)**: Generate code using nx generators. INVOKE IMMEDIATELY when user mentions scaffolding, setup, structure, creating apps/libs, or setting up project structure. Trigger words - scaffold, setup, create a new app, create a new lib, project structure, generate, add a new project. ALWAYS use this BEFORE calling nx_docs or exploring - this skill handles discovery internally.
- **[nx-import](documentation/skills/nx-import/SKILL.md)**: Import, merge, or combine repositories into an Nx workspace using nx import. USE WHEN the user asks to adopt Nx across repos, move projects into a monorepo, or bring code/history from another repository.
- **[nx-plugins](documentation/skills/nx-plugins/SKILL.md)**: Find and add Nx plugins. USE WHEN user wants to discover available plugins, install a new plugin, or add support for a specific framework or technology to the workspace.
- **[nx-run-tasks](documentation/skills/nx-run-tasks/SKILL.md)**: Helps with running tasks in an Nx workspace. USE WHEN the user wants to execute build, test, lint, serve, or run any other tasks defined in the workspace.
- **[nx-workspace](documentation/skills/nx-workspace/SKILL.md)**: "Explore and understand Nx workspaces. USE WHEN answering questions about the workspace, projects, or tasks. ALSO USE WHEN an nx command fails or you need to check available targets/configuration before running a task. EXAMPLES: 'What projects are in this workspace?', 'How is project X configured?', 'What depends on library Y?', 'What targets can I run?', 'Cannot find configuration for task', 'debug nx task failure'."
- **[postgres-data](documentation/skills/postgres-data/SKILL.md)**: 'Use this skill to dump and restore local PostgreSQL databases, schemas, and tables (collections) using Nx targets and pg_dump/pg_restore. Use when asked to backup, dump, export, restore, import, or copy local database data.'
- **[postgres-sql](documentation/skills/postgres-sql/SKILL.md)**: Toolkit for interactively querying and exploring the local PostgreSQL database schema and data using the local psql client. Use when asked to write a SQL query, explore database schemas, inspect table structures, or execute local database queries. Relies on workspace default environment variables.
- **[python-conventions](documentation/skills/python-conventions/SKILL.md)**: Python project conventions for this monorepo. Use when creating a new Python project, configuring Python tools (ruff, pyright, ty, pytest, bandit, vulture), writing or reviewing pyproject.toml, setting up Nx targets for Python, or asked about Python tooling setup, uv, or the language:python tag. Covers the project.json pattern, pyproject.toml structure, targetDefaults, tool execution via uv run, and ty pre-1.0 configuration rules.
- **[react-conventions](documentation/skills/react-conventions/SKILL.md)**: React coding conventions for this monorepo. Use when writing or reviewing React components, when asked about component structure, section ordering, Tailwind CSS usage, state management patterns, conditional rendering, list rendering, or React 19 conventions. Covers component section layout (🔖🧩🪝🏗💪🏁🎨), Tailwind CSS with theme tokens, TanStack Router file-based routing, lexico-components usage, and testing with Vitest + RTL.
- **[refresh-documentation](documentation/skills/refresh-documentation/SKILL.md)**: Review and update all project documentation to keep it accurate and current. Use this skill when asked to refresh, update, or audit documentation, README files, AGENTS.md files, skill descriptions, or any markdown docs across the monorepo.
- **[rename-branch](documentation/skills/rename-branch/SKILL.md)**: "Rename a git branch. Analyzes changes against the main branch, decides on a conventional name, and executes the rename."
- **[resolve-conflicts](documentation/skills/resolve-conflicts/SKILL.md)**: Workflow to resolve Git merge conflicts cleanly. Use when asked to resolve conflicts, fix merge issues, merge a branch, or rebase with conflicts. This skill instructs the agent to analyze both branches to understand their distinct purposes before resolving conflicts to preserve the intent of both.
- **[restore-code](documentation/skills/restore-code/SKILL.md)**: "Restore code safely from backup artifacts created before risky changes. Use when undoing destructive operations, recovering from failed refactors or rebases, restoring deleted files, rolling back broad search-and-replace edits, or rehydrating work from backup branches and stashes. Supports preview-first recovery via backup branch, stash, or selective file restoration."
- **[sign-commits](documentation/skills/sign-commits/SKILL.md)**: Re-sign unsigned commits on the current branch or pull request without changing code content by rewriting only from the first unsigned commit onward on a temporary branch. Use when asked to sign commits, add GPG signatures to an existing branch, satisfy signed-commit requirements, or make a PR show verified commits. Creates a backup branch first, runs the rebase non-interactively, verifies the rewritten final tree exactly matches the original branch tip, and stops immediately if any check, conflict, drift, or GPG step fails.
- **[simplify-code](documentation/skills/simplify-code/SKILL.md)**: Workflow to identify overly complex functions using ESLint complexity rules (max-statements, max-lines, complexity, max-depth) and refactor them towards simplicity using Refactoring.Guru guidelines. Use when asked to "simplify code", "reduce complexity", "refactor large functions", or fix ESLint complexity warnings and errors.
- **[spell-check](documentation/skills/spell-check/SKILL.md)**: Run and triage cspell in this monorepo. Use when spell-check fails in lint-staged, nx affected, or nx run-many, when cspell reports Unknown word entries, or when adding domain vocabulary to the correct dictionary under configuration/.cspell. Covers full-workspace checks, project-targeted checks, and dictionary update validation.
- **[submit-changes](documentation/skills/submit-changes/SKILL.md)**: Automatically submit local changes through the full branch → commit → push → pull request pipeline. Includes branch-name conformance checks and automatic branch rename when needed. Use this skill when asked to submit, ship, or push changes; when you want to move from local changes to an open PR in one step; or when orchestrating the complete git workflow automatically without manual steps.
- **[tanstack-start-ssr](documentation/skills/tanstack-start-ssr/SKILL.md)**: Build SSR applications with TanStack Start - server functions, file-based routing, and data loading patterns. Use this skill when working on the lexico web application.
- **[testing-mocks](documentation/skills/testing-mocks/SKILL.md)**: Create and structure mocks for tests using createMock, vi.mock, and NestJS DI patterns. USE WHEN writing unit or integration tests with mocked dependencies, when asked about mocking services or repositories, or when setting up test environments with injected dependencies.
- **[testing-strategy](documentation/skills/testing-strategy/SKILL.md)**: Use monorepo testing conventions: unit, integration, end-to-end test naming and Nx commands. Use when adding tests or recommending test coverage.
- **[tool-execution-model](documentation/skills/tool-execution-model/SKILL.md)**: Decide when to use Nx tasks versus direct tooling in this monorepo. Use when asked about build, lint, test, typecheck, formatting, Docker, kubectl, Helm, Supabase CLI, Git, or pnpm commands.
- **[triage-deployment](documentation/skills/triage-deployment/SKILL.md)**: "Diagnose and fix failing GitHub Actions CI workflows in this monorepo. Use when a CI check fails on a pull request or push, when you see red checks in GitHub Actions, when asked to fix CI, debug a workflow failure, or investigate a failing job. Accepts logs pasted directly in chat OR retrieves them automatically via the gh CLI. Triages failures for: analyze-code (typecheck, lint, format, spell-check, knip, markdown-lint, yaml-lint), test-coverage, validate-conventions (branch name, PR title/body, config sync), audit-security (gitleaks, bandit, scan-dependencies, trivy), and make-devcontainer (VSCode extensions sync, Docker build, devcontainer test)."
- **[triage-submission](documentation/skills/triage-submission/SKILL.md)**: "Triage and fix git submission failures for both commits and pushes. Use when a git commit or push is rejected, when lint-staged errors occur, when pre-commit or pre-push hooks fail, when a branch name is invalid on push, or when you see errors from husky, commitlint, validate-branch-name, ESLint, oxfmt, prettier, typecheck, knip, cspell, markdownlint, or yamllint during a commit or push attempt. Reads the error output, identifies the failing hook and checks, reads the relevant configuration, and applies targeted fixes."
- **[typescript-conventions](documentation/skills/typescript-conventions/SKILL.md)**: TypeScript coding conventions for this monorepo. Use when writing or modifying TypeScript or TSX files, when TypeScript type errors appear, or when asked about strict mode, type imports, naming conventions, return types, the no-any rule, async functions, floating promises, exhaustive switches, readonly properties, or non-null assertions. Covers strict mode flags, explicit return types, type import syntax, naming conventions, error handling, and common gotchas.
- **[update-plan](documentation/skills/update-plan/SKILL.md)**: "Read an existing implementation plan, assess actual codebase progress, and update the plan to reflect reality. Use when asked to audit completion, reconcile drift, or refresh task status."
- **[update-pull-request](documentation/skills/update-pull-request/SKILL.md)**: Update an existing pull request's title and description to accurately reflect the implemented changes. Use this skill when asked to update, refresh, or rewrite a PR title or description, sync a PR with the latest changes, or when the PR description no longer matches the implementation.
- **[validate-code](documentation/skills/validate-code/SKILL.md)**: Run the full code quality validation suite for this monorepo. Use this skill when you have finished implementing code changes and want to verify they are clean before committing, when told to "validate", "check quality", or "run linting", or before invoking the submit-changes skill. Runs analyze-code (format, lint, typecheck, knip, spell-check) using the write configuration to auto-fix what it can, then checks that nothing remains.
<!-- agent-skills-table-of-contents end -->

## Projects

- **[affirmations](applications/affirmations/AGENTS.md)**: Python Jupyter notebook application for LangChain + LangGraph affirmation generation (Ollama gemma4:e2b, ReAct agent, SearxNG metasearch with Trafilatura research processing)
- **[caelundas](applications/caelundas/AGENTS.md)**: Node.js CLI for astronomical calendar generation (NASA JPL API)
- **[lexico](applications/lexico/AGENTS.md)**: SSR web app (React 19, TanStack Start)
- **[lexico-components](packages/lexico-components/AGENTS.md)**: Shared React component library (shadcn/ui, Radix UI)
- **lexico-ingestion**: NestJS CLI app for Latin dictionary data ingestion
- **lexico-entities**: Shared TypeORM entities and GraphQL types package
- **JimmyPaolini**: Portfolio website
- **[infrastructure](infrastructure/AGENTS.md)**: Helm charts, Terraform, Kubernetes infrastructure
- **[conformance](tools/conformance/AGENTS.md)**: Nx generators for scaffolding code

## Nx Generators

Provided by the [conformance](tools/conformance/AGENTS.md) tool. Run with `nx generate conformance:<name> [options]` or the short alias `nx g conformance:<alias> [options]`.

<!-- conformance-generators-table start -->
| Generator | Alias | Description |
| --------- | ----- | ----------- |
| `jupyter-notebook-application` | `jna` | Generate a Python Jupyter notebook application scaffold |
| `nestjs-command-application` | `nca` | Generate a NestJS command-line application scaffold using nest-commander |
| `nestjs-command-module` | `ncm` | Generate a NestJS command module with command, module, types, constants, and unit test files |
| `nestjs-dataloader-module` | `ndm` | Generate a NestJS DataLoader module with dataloader, types, and unit test files |
| `nestjs-graphql-application` | `nga` | Generate a NestJS GraphQL API application scaffold with Apollo Server |
| `nestjs-graphql-module` | `ngm` | Generate a NestJS GraphQL module with resolver, entities, inputs, args, factories, service, types, constants, and unit test files |
| `nestjs-service-file` | `nsf` | Generate NestJS service and unit test files |
| `nestjs-service-module` | `nsm` | Generate a NestJS service module with module, service, types, constants, and unit test files |
| `react-component` | `c` | Generate a React component with test file |
<!-- conformance-generators-table end -->

## Work Scope Discipline

- Focus on one project at a time when coding or refactoring.
- If a request spans multiple projects or scopes, complete the first project end-to-end before starting the next one.
- If the work is truly independent across projects, split it into separate subagents or separate passes so each agent stays project-scoped.
- Avoid mixing unrelated project changes in one context unless the task is explicitly orchestrating them.

## Code Quality & Validation

**Every coding agent MUST run the `validate-code` skill before declaring any implementation task complete.** This is non-negotiable.

```bash
# Auto-fix all format, lint, and unused-code issues
pnpm exec nx affected --target=analyze-code --configuration=write --base=main

# Verify no issues remain — all checks must pass
pnpm exec nx affected --target=analyze-code --configuration=check --base=main
```

For new/untracked files not yet picked up by `nx affected`:

```bash
pnpm exec nx run <project>:analyze-code --configuration=write
pnpm exec nx run <project>:analyze-code --configuration=check
```

**Do not commit until both commands pass cleanly.** If they fail, use the [triage-submission skill](documentation/skills/triage-submission/SKILL.md) to diagnose and fix the errors.

**Never silence errors with disable comments or configuration changes.** Do not use `// eslint-disable`, `// eslint-disable-next-line`, `// @ts-ignore`, `// @ts-expect-error`, `/* eslint-disable */`, `nocheck`, or similar suppression comments to work around lint or type errors. Do not loosen TypeScript `compilerOptions` (e.g. enabling `skipLibCheck`, disabling `strict` flags) or add ESLint `ignores`/`rules` overrides to suppress specific errors. Instead, triage the root cause and fix the code. Suppression is only permitted when the user explicitly requests it.

See the [validate-code skill](documentation/skills/validate-code/SKILL.md) for the full validation workflow and per-tool fix guidance.

### Quality Tools at a Glance

| Tool | Covers | Config |
| ---- | ------ | ------ |
| `oxfmt` + `prettier` | Formatting | `configuration/oxfmt.config.ts`, `configuration/prettier.config.ts` |
| `eslint` + `oxlint` | Linting (TS/JS) | project `eslint.config.ts`, `configuration/oxlint.config.ts` |
| `ruff` | Formatting + linting (Python) | `configuration/pyproject.toml` |
| `tsc` / `pyright` / `ty` | Type checking | project `tsconfig.json`, `configuration/tsconfig.base.json` |
| `knip` / `vulture` | Unused code + deps | `configuration/knip.config.ts`, `configuration/vulture_whitelist.py` |
| `fallow` | Dead code + duplication + complexity (advisory) | `configuration/fallow.config.jsonc` |
| `cspell` | Spell checking | `configuration/cspell.config.yaml` |
| `markdownlint` | Markdown lint | `configuration/.markdownlint-cli2.jsonc` |
| `yamllint` | YAML lint | `configuration/yamllint.yaml` |

## Key Conventions

### Abbreviations

- **No Acronyms or Abbreviations**: Never use acronyms or abbreviations for variable names, function names, parameters, etc.
- Use explicit and unabbreviated names (e.g. `request` instead of `req`, `response` instead of `res`, `index` instead of `i`, `error` instead of `e`).
- **Exceptions**: Abbreviations are acceptable when avoiding language reserved word collisions (e.g., using `args` instead of `arguments`, `str` instead of `string`).
- Abbreviation rules are enforced by ESLint (`unicorn/prevent-abbreviations`) and CSpell (`flagWords`).

### Project Tags

- **`language:typescript`** — applied to all TypeScript projects (caelundas, lexico, lexico-components, conformance, monorepo)
- **`language:python`** — applied to all Python projects (affirmations)

These tags enable conditional sub-target composition in composite targets (`format`, `lint`, `typecheck`, `test`). Python projects override the TS-default composite targets to compose Python sub-targets (`ruff-format`, `ruff-lint`, `pyright`, `pytest`) instead of TS ones.

See [Python Conventions](documentation/conventions/python.md) for the full Python tooling setup.

### TypeScript

- **Strict mode enabled**: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`
- **Explicit return types** required for all functions
- **Type imports**: Use `import { type Foo } from './types'` (enforced by ESLint)
- **File extensions in imports**: Always include `.js` extensions for relative imports (required by NodeNext resolution)
- **No `any` types**: Use `unknown` or proper typing
- **No non-null assertions**: Never use `!` — use optional chaining or explicit guards
- **Readonly class properties**: Mark all never-mutated class properties as `readonly`
- **Exhaustive switches**: All switch statements on union types must handle every member
- **Async functions**: All functions returning `Promise` must use the `async` keyword
- **No floating promises**: Every Promise must be awaited or explicitly `void`-annotated
- **Consistent returns**: All code paths must uniformly return or not return a value
- **Curly braces**: Always use `{}` for `if`/`else`/`for`/`while` — no single-line forms
- **Early returns**: Remove `else` after a `return` — use guard clauses
- **Object shorthand**: Use `{ name }` instead of `{ name: name }`
- **Template literals**: Use `` `Hello ${name}` `` instead of `"Hello " + name`
- **Max 3 function parameters**: Group extras into an options object (constructors: 12)
- **JSDoc on public APIs**: Public functions, classes, methods, interfaces, types, and enums must have JSDoc — only when it adds non-obvious context
- **Section comments**: Use `// 🎯 Section name` (emoji + capitalized name). Never use dash lines or ASCII art dividers. See [commenting skill](documentation/skills/commenting/SKILL.md).

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

**Never bypass git hooks** with `--no-verify` — fix the underlying issue instead.

**Never suppress lint or type errors** with disable comments (`eslint-disable`, `@ts-ignore`, `@ts-expect-error`, `nocheck`) or by loosening configuration — triage and fix the code instead. Suppression is only permitted when the user explicitly requests it.

#### Branch Names

Format: `<type>/<scope>-<description>` — all three parts required, kebab-case description.

Examples: `feat/lexico-user-auth`, `fix/caelundas-timezone-bug`, `docs/monorepo-architecture`

Special branches exempt from naming convention: `main`, `develop`, `renovate/*`, `dependabot/*`

**Valid types:**

<!-- types-start -->

| Type | Description |
| ---- | ----------- |
| `feat` | A new feature or capability that adds value for users |
| `fix` | A bug fix that addresses a specific issue or problem |
| `docs` | Documentation, AGENTS.md, SKILL.md, README, and planning files |
| `test` | Adding or correcting unit, integration, or end-to-end tests |
| `refactor` | Code restructuring that neither fixes a bug nor adds a feature |
| `style` | Formatting, whitespace, or code structure changes with no semantic effect |
| `perf` | A code change that improves performance (caching, query optimization, etc.) |
| `chore` | Housekeeping that doesn't modify src or test files (gitignore, editor config, etc.) |
| `ci` | GitHub Actions workflows, composite actions, and CI/CD scripts |
| `build` | Build system, Vite/Docker/Helm config, or external dependency integration |
| `revert` | Reverts a previous commit |

<!-- types-end -->

**Valid scopes:**

<!-- scopes-start -->

| Scope | Description |
| ----- | ----------- |
| `affirmations` | Python Jupyter notebook application for LangGraph affirmation generation |
| `applications` | Changes spanning multiple applications in applications/ (e.g. lexico, caelundas, etc.) |
| `caelundas` | Node.js CLI for astronomical calendar generation (NASA JPL ephemeris) |
| `configuration` | Workspace root config files (tsconfig, eslint, vitest, nx.json, etc.) |
| `conformance` | Code generator templates and conformance validation tests for generated instances |
| `dependencies` | Dependency version changes (upgrades, additions, removals via pnpm) |
| `deps` | Dependency version changes (upgrades, additions, removals via pnpm) |
| `deployments` | GitHub Actions workflows and CI/CD pipeline configuration |
| `documentation` | Markdown docs, skills, planning files, and AGENTS.md files |
| `infrastructure` | Helm charts, Terraform configs, and Kubernetes resources |
| `JimmyPaolini` | Static GitHub profile README project (markdown and assets) |
| `lexico` | TanStack Start SSR Latin dictionary web app with Supabase backend |
| `lexico-components` | Shared React/shadcn component library |
| `lexico-entities` | Shared TypeORM entities and GraphQL types |
| `lexico-ingestion` | Data ingestion scripts for Lexico |
| `monorepo` | Workspace root concerns (pnpm-workspace, root package.json, Nx orchestration) |
| `no-release` | Escape hatch: suppress semantic-release for any commit type |
| `packages` | Changes spanning multiple shared packages in packages/ |
| `release` | Version bumps and release commits generated by semantic-release |
| `scripts` | Shell and TypeScript scripts in scripts/ (sync, setup, utilities) |
| `testing` | Vitest configuration, shared test utilities, and coverage setup |
| `tools` | Changes spanning multiple tool projects in tools/ |

<!-- scopes-end -->

#### Worktrees

- When asked to create a Git worktree, derive or reuse a branch name that follows `<type>/<scope>-<description>`.
- Validate the candidate branch first with `pnpm exec validate-branch-name -t "<branch-name>"`.
- Prefer `bash documentation/skills/create-worktree/scripts/create-worktree.sh "<branch-name>" [base-branch] [worktree-path]` over raw `git worktree add`.
- Default the worktree path to `../monorepo-worktrees/<branch-name-with-slashes-replaced-by-hyphens>` unless the user requests a different path.
- If the branch already exists locally, attach a worktree to it instead of creating a second branch.

#### Commit Messages

Format: `<type>(<scope>): <gitmoji> <subject>` — single line only, max 128 chars.

- **Gitmoji required** at the start of the subject line
- **Body and footer are forbidden** — all context goes in the subject or PR description
- Subject: lowercase, imperative mood, no period
- Never list multiple changes — summarize at a higher level or split into separate commits

Common gitmojis: ✨ `feat` · 🐛 `fix` · 📝 `docs` · 🧪 `test` · ♻️ `refactor` · 🎨 `style` · ⚡️ `perf` · 🔧 `chore` · 👷 `ci` · 📦 `build` · ⏪ `revert`

Examples:

```text
feat(lexico): ✨ add user profile page
fix(caelundas): 🐛 correct aspect angle calculation
chore(dependencies): ⬆️ upgrade react to v19
docs(monorepo): 📝 update contributing guide
```

#### Pull Requests

PR title follows the same format as commit messages: `<type>(<scope>): <gitmoji> <subject>`

PR description template:

```markdown
## 🌰 Summary

<!-- Brief description of what this PR does (1-2 sentences) -->

## 📝 Details

- <!-- List of specific changes made -->

## 🧪 Testing

1. <!-- How to manually verify these changes work correctly -->

## 🔗 Related

- <!-- Link any relevant issues or documentation -->
```

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

- [Commenting](documentation/skills/commenting/SKILL.md): Conventions for writing comments, section headers, and emoji section format

### Architecture

- [Deployment Models](documentation/architecture/deployment-models.md): K8s Jobs vs. Deployments, PVC strategy

### Frameworks

- [NestJS](documentation/frameworks/nestjs.md): Node.js server-side applications with decorators and DI
- [LangChain Python](documentation/frameworks/langchain-python.md): Building LLM applications with Python
- [Kubernetes](documentation/frameworks/kubernetes.md): Deployments, security, scaling, and observability

### Troubleshooting

- [Common Gotchas](documentation/troubleshooting/gotchas.md): TypeScript, Docker, K8s issues

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
| Docker platform mismatch   | Build with `--platform linux/amd64`           |
| Commit rejected            | Follow format: `type(scope): gitmoji subject` |
| Branch name rejected       | Use pattern: `type/scope-description`         |

See [Common Gotchas](documentation/troubleshooting/gotchas.md) for detailed solutions.

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
