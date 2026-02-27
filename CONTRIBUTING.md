# Contributing to Monorepo

Thank you for contributing! This guide covers the development workflow, code standards, and release process.

## Table of Contents

- [Contributing to Monorepo](#contributing-to-monorepo)
  - [Table of Contents](#table-of-contents)
  - [Getting Started](#getting-started)
    - [Option 1: Dev Container (Recommended)](#option-1-dev-container-recommended)
    - [Option 2: Local Setup (macOS)](#option-2-local-setup-macos)
    - [Workspace Structure](#workspace-structure)
  - [Development Workflow](#development-workflow)
    - [Basic Commands](#basic-commands)
  - [Code Standards](#code-standards)
  - [Branch Naming Guidelines](#branch-naming-guidelines)
  - [Commit Guidelines](#commit-guidelines)
  - [Pull Request Process](#pull-request-process)
  - [Release Process](#release-process)
  - [Code Ownership](#code-ownership)
  - [Additional Resources](#additional-resources)
  - [Getting Help](#getting-help)
  - [License](#license)

## Getting Started

### Option 1: Dev Container (Recommended)

The fastest way to get started is using the included dev container, which provides a fully configured development environment with all required tools.

**Prerequisites:**

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine on Linux)
- [VS Code](https://code.visualstudio.com/) with [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

**Setup:**

1. Clone the repository: `git clone https://github.com/JimmyPaolini/monorepo.git`
2. Open the folder in VS Code
3. When prompted "Reopen in Container", click **Reopen in Container** (or run `Dev Containers: Reopen in Container` from command palette)
4. Wait for container build (~2-3 minutes first time)
5. Start developing!

**Included Tools:**

| Tool         | Version | Purpose                              |
| ------------ | ------- | ------------------------------------ |
| Node.js      | 22.20.0 | JavaScript runtime                   |
| pnpm         | 10.20.0 | Package manager                      |
| Terraform    | latest  | Infrastructure provisioning (Linode) |
| Supabase CLI | latest  | Database migrations, type generation |
| kubectl      | latest  | Kubernetes cluster management        |
| Helm         | latest  | Kubernetes package manager           |
| GitHub CLI   | latest  | Repository operations                |
| Docker       | (DinD)  | Isolated Docker daemon in container  |

**Port Forwarding:**

| Port  | Service           | Auto-Forward |
| ----- | ----------------- | ------------ |
| 3000  | Lexico Dev Server | Notify       |
| 54321 | Supabase API      | Silent       |
| 54322 | PostgreSQL        | Silent       |
| 54323 | Supabase Studio   | Notify       |
| 54324 | Inbucket (Email)  | Silent       |
| 54325 | Analytics         | Silent       |

See [.devcontainer/README.md](.devcontainer/README.md) for detailed configuration and troubleshooting.

### Option 2: Local Setup (macOS)

For local development without containers:

**Prerequisites:**

- **macOS** with Homebrew installed
- **Git**: Latest stable version

**Setup:**

Run the setup script to install all dependencies:

```bash
git clone https://github.com/JimmyPaolini/monorepo.git
cd monorepo
./scripts/local-setup/setup.sh
```

This script:

- Installs **pnpm** (10.20.0+), **nvm**, **Node.js** (22.20.0), **Terraform**
- Creates `.env` file from `.env.default` template
- Runs `pnpm install` to install all project dependencies

### Workspace Structure

```text
monorepo/
├── applications/           # Deployable applications
│   ├── caelundas/         # CLI ephemeris calendar generator
│   ├── lexico/            # TanStack Start + Supabase web app
│   └── JimmyPaolini/      # Personal website
├── packages/              # Shared libraries
│   └── lexico-components/ # React component library (shadcn/ui)
├── documentation/         # Guides and references
├── infrastructure/        # Helm charts, Terraform
└── tools/                # Build tools and generators
```

## Development Workflow

### Basic Commands

```bash
# Create feature branch (see branch naming conventions)
git checkout -b feat/lexico-your-feature

# Run development server
nx run <project>:develop          # caelundas, lexico, JimmyPaolini

# Run tests
nx run <project>:test             # All tests
nx run <project>:test:watch       # Watch mode
nx run caelundas:test:unit        # Specific type

# Code quality (use --all for all projects)
nx run-many --target=lint --all           # or :lint:write to fix
nx run-many --target=typecheck --all
nx run-many --target=format:check --all   # or :format:write
nx run-many --target=spell-check --all
nx run-many --target=markdown-lint --all  # or :markdown-lint:write
nx run-many --target=knip --all           # or :knip:write (caution!)
nx run-many --target=code-analysis --all  # Run all checks

# Affected projects only
nx affected --target=test
```

## Code Standards

- **TypeScript**: Explicit return types, no `any`, type imports (`import { type T }`), strict null checks
- **Imports**: Auto-sorted (Node built-ins → external → workspace → relative → types)
- **Naming**: PascalCase (types/classes), camelCase (variables/functions), UPPER_CASE (constants), kebab-case (files)
- **React**: React 19, TanStack Router, shadcn/ui via `@monorepo/lexico-components`, Tailwind CSS
- **Documentation**: TSDoc for public APIs, update docs with code changes

See [eslint.config.base.ts](eslint.config.base.ts) for complete rules.

## Git Hooks (Husky)

Three Husky hooks enforce quality gates locally. **Never bypass them with `--no-verify`** — fix the underlying issue instead.

| Hook         | Trigger      | What it runs                                                                         | Config                                                             |
| ------------ | ------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `pre-commit` | `git commit` | **lint-staged**: format, lint, typecheck, spell-check, and more on staged files      | [lint-staged.config.ts](lint-staged.config.ts)                     |
| `commit-msg` | `git commit` | **commitlint**: validates Conventional Commits format (`<type>(<scope>): <subject>`) | [commitlint.config.ts](commitlint.config.ts)                       |
| `pre-push`   | `git push`   | **validate-branch-name**: enforces `<type>/<scope>-<description>` pattern            | [validate-branch-name.config.cjs](validate-branch-name.config.cjs) |

If a hook fails, the git operation is blocked until you fix the error. See the config files linked above for details on what each hook checks.

## Branch Naming Guidelines

**Required format:** `<type>/<scope>-<description>` (lowercase, kebab-case)

**Examples**: `feat/lexico-user-auth`, `fix/monorepo-routing`, `docs/caelundas-api`

Validated by Husky pre-push hook and GitHub Actions. See [checkout-branch skill](.github/skills/checkout-branch/SKILL.md) for details.

## Commit Guidelines

Use [Conventional Commits](https://www.conventionalcommits.org/): `<type>(<scope>): <gitmoji> <subject>` (max 128 chars, imperative mood, lowercase)

**Types**: `feat` (minor release), `fix`/`perf`/`refactor`/`build` (patch), `docs`/`test`/`ci`/`chore` (no release)

**Scopes**: `monorepo`, `caelundas`, `lexico`, `lexico-components`, `JimmyPaolini`, `documentation`, `dependencies`, `infrastructure`, `ci`

**Breaking changes**: Add `!` after type or `BREAKING CHANGE:` in footer (triggers major release)

**Examples**:

```bash
feat(caelundas): add moon phase calculation
fix(lexico): resolve mobile layout overflow
feat(api)!: redesign authentication  # Breaking change
```

Commits are validated by commitlint + Husky. See [commit-code skill](.github/skills/commit-code/SKILL.md) for details.

## Pull Request Process

1. **Create PR**: `git push origin feat/your-feature && gh pr create --fill`
2. **PR title**: Use Conventional Commits format (e.g., `feat(lexico): add search`)
3. **Automated checks**: Lint, typecheck, tests, format, spell-check, markdown-lint (all must pass)
4. **Code review**: Requires `@JimmyPaolini` approval ([CODEOWNERS](.github/CODEOWNERS))
5. **Merge**: Squash and merge with Conventional Commits message, delete branch

## Release Process

Releases use [semantic-release](https://semantic-release.gitbook.io/) - fully automated on merge to `main`.

**Version bumps**: `BREAKING CHANGE` → major, `feat` → minor, `fix`/`perf`/`refactor`/`build` → patch, `docs`/`test`/`ci`/`chore` → none

**Workflow**: Merge PR to `main` → automated release runs → analyzes commits → bumps version → updates `CHANGELOG.md` → creates tag & GitHub release

**Test locally**: `pnpm semantic-release:dry-run`

**Prevent release**: Use `docs`/`test`/`ci`/`chore` types or `no-release` scope

See [release.config.cjs](release.config.cjs) for complete configuration and guide.

## Code Ownership

All files are owned by `@JimmyPaolini` (see [.github/CODEOWNERS](.github/CODEOWNERS)).

Pull requests require owner approval before merging.

## Environment Variables

Each project uses `.env.default` files as templates for required environment variables. Copy `.env.default` to `.env` in each directory and fill in values.

### Root (`.env.default`)

| Variable                                     | Purpose                                     |
| -------------------------------------------- | ------------------------------------------- |
| `TF_VAR_linode_token`                        | Linode API token for Terraform provisioning |
| `TF_VAR_linode_kubernetes_engine_cluster_id` | LKE cluster ID for deployments              |

### caelundas (`applications/caelundas/.env.default`)

| Variable             | Default     | Purpose                                       |
| -------------------- | ----------- | --------------------------------------------- |
| `LATITUDE`           | `39.949309` | Observer latitude for ephemeris calculations  |
| `LONGITUDE`          | `-75.17169` | Observer longitude for ephemeris calculations |
| `START_DATE`         | (dynamic)   | Calculation start date (YYYY-MM-DD)           |
| `END_DATE`           | (dynamic)   | Calculation end date (YYYY-MM-DD)             |
| `OUTPUT_DIRECTORY`   | `./output`  | Directory for generated calendar files        |
| `MAX_RETRIES`        | `5`         | NASA JPL API retry attempts                   |
| `INITIAL_DELAY_MS`   | `1000`      | Initial retry backoff delay                   |
| `MAX_DELAY_MS`       | `30000`     | Maximum retry backoff delay                   |
| `BACKOFF_MULTIPLIER` | `2`         | Exponential backoff factor                    |

### lexico (`applications/lexico/.env.default`)

| Variable                    | Purpose                                                    |
| --------------------------- | ---------------------------------------------------------- |
| `SUPABASE_URL`              | Supabase project URL                                       |
| `SUPABASE_ANON_KEY`         | Supabase anonymous/public key (safe for client)            |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only, never expose) |

## Dependency Update Workflow

Weekly automated dependency updates are handled by the [`dependency-updates.yml`](.github/workflows/dependency-updates.yml) workflow:

1. **Schedule**: Runs every Monday at 6:00 UTC
2. **Detection**: Uses `npm-check-updates` to find outdated dependencies
3. **PR creation**: Automatically creates a PR with the updates
4. **Review**: All CI checks run against the update PR
5. **Merge**: Requires manual review and approval before merging

To check for updates manually:

```bash
pnpm outdated              # See which packages are outdated
pnpm update                # Update within semver ranges
pnpx npm-check-updates -u  # Update to latest versions (breaking changes possible)
```

## Additional Resources

- [Commit Messages Guide](.github/skills/commit-code/SKILL.md)
- [Semantic Release Config](release.config.cjs)
- [GitHub Actions Guide](documentation/github-actions.md) - CI/CD workflows and composite actions
- [Gitmoji Reference](documentation/gitmoji.md)
- [Nx Documentation](https://nx.dev)
- [Conventional Commits](https://www.conventionalcommits.org/)

## Getting Help

- **Issues:** [GitHub Issues](https://github.com/JimmyPaolini/monorepo/issues)
- **Discussions:** [GitHub Discussions](https://github.com/JimmyPaolini/monorepo/discussions)
- **Owner:** [@JimmyPaolini](https://github.com/JimmyPaolini)

## License

MIT License. Copyright (c) Jimmy Paolini.
