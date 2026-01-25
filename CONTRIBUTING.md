# Contributing to Monorepo

Thank you for contributing! This guide covers the development workflow, code standards, and release process.

## Table of Contents

- [Contributing to Monorepo](#contributing-to-monorepo)
  - [Table of Contents](#table-of-contents)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Automated Setup](#automated-setup)
    - [Workspace Structure](#workspace-structure)
  - [Development Workflow](#development-workflow)
    - [Basic Commands](#basic-commands)
  - [Code Standards](#code-standards)
  - [Commit Guidelines](#commit-guidelines)
  - [Pull Request Process](#pull-request-process)
  - [Release Process](#release-process)
  - [Code Ownership](#code-ownership)
  - [Additional Resources](#additional-resources)
  - [Getting Help](#getting-help)
  - [License](#license)

## Getting Started

### Prerequisites

- **macOS** with Homebrew installed
- **Git**: Latest stable version

### Automated Setup

Run the setup script to install all dependencies:

```bash
git clone https://github.com/JimmyPaolini/monorepo.git
cd monorepo
./scripts/setup.sh
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
git checkout -b feat/your-feature-name

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

## Branch Naming Guidelines

**Required format:** `<type>/<scope>-<description>` (lowercase, kebab-case)

**Examples**: `feat/lexico-user-auth`, `fix/monorepo-routing`, `docs/caelundas-api`

Validated by Husky pre-push hook and GitHub Actions. See [branch-names.md](documentation/branch-names.md) for details.

## Commit Guidelines

Use [Conventional Commits](https://www.conventionalcommits.org/): `<type>(<scope>): <subject>` (max 50 chars, imperative mood, lowercase)

**Types**: `feat` (minor release), `fix`/`perf`/`refactor`/`build` (patch), `docs`/`test`/`ci`/`chore` (no release)

**Scopes**: `monorepo`, `caelundas`, `lexico`, `lexico-components`, `JimmyPaolini`, `documentation`, `dependencies`, `infrastructure`, `ci`

**Breaking changes**: Add `!` after type or `BREAKING CHANGE:` in footer (triggers major release)

**Examples**:

```bash
feat(caelundas): add moon phase calculation
fix(lexico): resolve mobile layout overflow
feat(api)!: redesign authentication  # Breaking change
```

Commits are validated by commitlint + Husky. See [commit-messages.md](documentation/commit-messages.md) for details.

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

See [semantic-release.md](documentation/semantic-release.md) for complete guide.

## Code Ownership

All files are owned by `@JimmyPaolini` (see [.github/CODEOWNERS](.github/CODEOWNERS)).

Pull requests require owner approval before merging.

## Additional Resources

- [Commit Messages Guide](documentation/commit-messages.md)
- [Semantic Release Guide](documentation/semantic-release.md)
- [GitHub Actions Guide](documentation/github-actions.md)
- [Static Analysis Tools](documentation/static-analysis-tools.md)
- [Gitmoji Reference](documentation/gitmoji.md)
- [Nx Documentation](https://nx.dev)
- [Conventional Commits](https://www.conventionalcommits.org/)

## Getting Help

- **Issues:** [GitHub Issues](https://github.com/JimmyPaolini/monorepo/issues)
- **Discussions:** [GitHub Discussions](https://github.com/JimmyPaolini/monorepo/discussions)
- **Owner:** [@JimmyPaolini](https://github.com/JimmyPaolini)

## License

See [LICENSE](LICENSE) file for details.
