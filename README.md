# monorepo

[![Nx](https://img.shields.io/badge/Nx-Monorepo-143055?logo=nx)](https://nx.dev)
[![pnpm](https://img.shields.io/badge/pnpm-Workspace-F69220?logo=pnpm)](https://pnpm.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Code Lines](https://img.shields.io/badge/dynamic/json?color=blue&label=lines%20of%20code&query=%24%5B0%5D.linesOfCode&url=https%3A%2F%2Fapi.codetabs.com%2Fv1%2Floc%2F%3Fgithub%3DJimmyPaolini%2Fmonorepo)](https://github.com/JimmyPaolini/monorepo)
[![Repo Size](https://img.shields.io/github/repo-size/JimmyPaolini/monorepo)](https://github.com/JimmyPaolini/monorepo)
[![Last Commit](https://img.shields.io/github/last-commit/JimmyPaolini/monorepo)](https://github.com/JimmyPaolini/monorepo/commits)

[![Build](https://github.com/JimmyPaolini/monorepo/actions/workflows/build-code.yml/badge.svg)](https://github.com/JimmyPaolini/monorepo/actions/workflows/build-code.yml)
[![Release](https://github.com/JimmyPaolini/monorepo/actions/workflows/release-projects.yml/badge.svg)](https://github.com/JimmyPaolini/monorepo/actions/workflows/release-projects.yml)
[![Conventional Commits](https://github.com/JimmyPaolini/monorepo/actions/workflows/convention-check.yml/badge.svg)](https://github.com/JimmyPaolini/monorepo/actions/workflows/convention-check.yml)
[![Dependency Check](https://img.shields.io/github/actions/workflow/status/JimmyPaolini/monorepo/dependency-analysis.yml?job=%F0%9F%95%B5%EF%B8%8F%20%F0%9F%94%97%20Dependency%20Check&label=dependencies)](https://github.com/JimmyPaolini/monorepo/actions/workflows/dependency-analysis.yml)
[![Security Audit](https://img.shields.io/github/actions/workflow/status/JimmyPaolini/monorepo/dependency-analysis.yml?job=%F0%9F%95%B5%EF%B8%8F%20%F0%9F%94%92%20Security%20Audit&label=security&logo=npm)](https://github.com/JimmyPaolini/monorepo/actions/workflows/dependency-analysis.yml)
[![License Check](https://img.shields.io/github/actions/workflow/status/JimmyPaolini/monorepo/dependency-analysis.yml?job=%F0%9F%95%B5%EF%B8%8F%20%F0%9F%93%83%20License%20Check&label=licenses)](https://github.com/JimmyPaolini/monorepo/actions/workflows/dependency-analysis.yml)

[![Type Check](https://img.shields.io/github/actions/workflow/status/JimmyPaolini/monorepo/code-analysis.yml?job=%F0%9F%A7%91%E2%80%8D%F0%9F%92%BB%20%F0%9F%8F%B7%EF%B8%8F%20Type%20Check&label=types&logo=typescript)](https://github.com/JimmyPaolini/monorepo/actions/workflows/code-analysis.yml)
[![Lint](https://img.shields.io/github/actions/workflow/status/JimmyPaolini/monorepo/code-analysis.yml?job=%F0%9F%A7%91%E2%80%8D%F0%9F%92%BB%20%F0%9F%A7%B9%20Lint%20Check&label=lint&logo=eslint)](https://github.com/JimmyPaolini/monorepo/actions/workflows/code-analysis.yml)
[![Format](https://img.shields.io/github/actions/workflow/status/JimmyPaolini/monorepo/code-analysis.yml?job=%F0%9F%A7%91%E2%80%8D%F0%9F%92%BB%20%F0%9F%8E%A8%20Format%20Check&label=format&logo=prettier)](https://github.com/JimmyPaolini/monorepo/actions/workflows/code-analysis.yml)
[![Markdown](https://img.shields.io/github/actions/workflow/status/JimmyPaolini/monorepo/code-analysis.yml?job=%F0%9F%A7%91%E2%80%8D%F0%9F%92%BB%20%F0%9F%96%BC%EF%B8%8F%20Markdown%20Lint&label=markdown&logo=markdown)](https://github.com/JimmyPaolini/monorepo/actions/workflows/code-analysis.yml)
[![Knip](https://img.shields.io/github/actions/workflow/status/JimmyPaolini/monorepo/code-analysis.yml?job=%F0%9F%A7%91%E2%80%8D%F0%9F%92%BB%20%E2%9C%82%EF%B8%8F%20Knip%20Check&label=knip)](https://github.com/JimmyPaolini/monorepo/actions/workflows/code-analysis.yml)
[![Spell Check](https://img.shields.io/github/actions/workflow/status/JimmyPaolini/monorepo/code-analysis.yml?job=%F0%9F%A7%91%E2%80%8D%F0%9F%92%BB%20%F0%9F%A7%99%E2%80%8D%E2%99%82%EF%B8%8F%20Spell%20Check&label=spelling&logo=grammarly)](https://github.com/JimmyPaolini/monorepo/actions/workflows/code-analysis.yml)

[![Tests](https://github.com/JimmyPaolini/monorepo/actions/workflows/test-coverage.yml/badge.svg)](https://github.com/JimmyPaolini/monorepo/actions/workflows/test-coverage.yml)
[![codecov](https://codecov.io/gh/JimmyPaolini/monorepo/branch/main/graph/badge.svg)](https://codecov.io/gh/JimmyPaolini/monorepo)

Modern TypeScript monorepo with Nx, featuring automated releases, comprehensive code quality tools, and strict type safety.

## 🚀 Quick Start

### Dev Container (Recommended)

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) and the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
2. Open the repo in VS Code and click **Reopen in Container** when prompted
3. All tools and dependencies are installed automatically

### Local Setup (macOS)

```bash
# Automated setup (installs tools & dependencies via Homebrew)
./scripts/local-setup/setup.sh
```

### Development

```bash
# Run development server
nx run lexico:develop
nx run caelundas:develop

# Run tests
nx run-many --target=test --all

# Run all quality checks
nx run-many --target=code-analysis --all
```

## 📦 Projects

- **[caelundas](applications/caelundas)** - CLI ephemeris calendar generator with astronomical calculations
- **[lexico](applications/lexico)** - TanStack Start + Supabase dictionary web application
- **[lexico-components](packages/lexico-components)** - Shared React component library using shadcn/ui
- **[JimmyPaolini](applications/JimmyPaolini)** - Personal website

## 📚 Documentation

- **[Contributing Guide](CONTRIBUTING.md)** - Development workflow, code standards, and release process
- **[Commit Messages](.github/skills/commit-code/SKILL.md)** - Conventional Commits format and examples
- **[Release Process](documentation/semantic-release.md)** - Automated versioning and changelog generation
- **[GitHub Actions](documentation/github-actions.md)** - CI/CD workflows, composite actions, and pipeline architecture

## 🛠️ Development

### Running Tasks

```bash
# Use Nx to run tasks (handles caching and dependencies)
nx run <project>:<target>

# Examples
nx run caelundas:test
nx run lexico:build
nx run lexico-components:lint

# Run for all projects
nx run-many --target=test --all

# Run for affected projects only
nx affected --target=test
```

### Code Quality Tools

All projects use strict TypeScript configuration and comprehensive linting:

- **ESLint** - Code linting with strict rules
- **Prettier** - Code formatting
- **TypeScript** - Strict type checking
- **Knip** - Unused code detection
- **cspell** - Spell checking
- **markdownlint** - Markdown linting
- **Vitest** - Unit and integration testing

### Knip - Unused Code Detection

Knip finds and removes unused files, dependencies, and exports across the monorepo.

**Check for unused code:**

```bash
# Check entire monorepo
nx run monorepo:knip

# Check specific project
nx run caelundas:knip
nx run lexico:knip
nx run lexico-components:knip
nx run code-generator:knip

# Check only affected projects
nx affected --target=knip

# Explicitly use check configuration
nx run monorepo:knip:check
```

**Auto-fix unused code:**

```bash
# Fix entire monorepo (use with caution)
nx run monorepo:knip:write

# Fix specific project
nx run caelundas:knip:write
nx run lexico:knip:write
```

**Note:** Review knip findings carefully before running `knip:write`.
The write configuration automatically removes unused files, dependencies, and exports.

**Integration:**

- Pre-commit hooks: Runs automatically on staged files via lint-staged
- CI/CD: Runs on all PRs via GitHub Actions workflow

## 🚢 Release Process

Releases are fully automated using [semantic-release](https://semantic-release.gitbook.io/):

1. Merge PR to `main` branch
2. Commits are analyzed (Conventional Commits)
3. Version is determined automatically
4. `CHANGELOG.md` is generated/updated
5. GitHub release is created

**Version Bumps:**

- `feat:` commits → minor version (1.0.0 → 1.1.0)
- `fix:` commits → patch version (1.0.0 → 1.0.1)
- `BREAKING CHANGE:` → major version (1.0.0 → 2.0.0)

See [documentation/semantic-release.md](documentation/semantic-release.md) for complete guide.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Development workflow
- Code standards and conventions
- Commit message format
- Pull request process
- Release guidelines

All commits must follow [Conventional Commits](https://www.conventionalcommits.org/) format.

## 📄 Code Ownership

All files are owned by [@JimmyPaolini](https://github.com/JimmyPaolini). See [.github/CODEOWNERS](.github/CODEOWNERS).

## 📖 Additional Resources

- [Nx Documentation](https://nx.dev)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [TanStack Start](https://tanstack.com/start)
- [shadcn/ui](https://ui.shadcn.com/)
- [Vitest](https://vitest.dev/)

## 📝 License

MIT License. Copyright (c) Jimmy Paolini.
