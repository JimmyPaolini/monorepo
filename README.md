# monorepo

[![Nx](https://img.shields.io/badge/Nx-Monorepo-143055?logo=nx)](https://nx.dev)
[![pnpm](https://img.shields.io/badge/pnpm-Workspace-F69220?logo=pnpm)](https://pnpm.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24-5FA04E?logo=nodedotjs)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python)](https://www.python.org/)
[![Jupyter](https://img.shields.io/badge/Jupyter-1.1-F37626?logo=jupyter&logoColor=white)](https://jupyter.org/)
[![Code Lines](https://img.shields.io/badge/dynamic/json?color=blue&label=lines%20of%20code&query=%24%5B0%5D.linesOfCode&url=https%3A%2F%2Fapi.codetabs.com%2Fv1%2Floc%2F%3Fgithub%3DJimmyPaolini%2Fmonorepo)](https://github.com/JimmyPaolini/monorepo)
[![Repo Size](https://img.shields.io/github/repo-size/JimmyPaolini/monorepo)](https://github.com/JimmyPaolini/monorepo)
[![Last Commit](https://img.shields.io/github/last-commit/JimmyPaolini/monorepo)](https://github.com/JimmyPaolini/monorepo/commits)

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TanStack](https://img.shields.io/badge/TanStack-Start-FF4154?logo=tanstack)](https://tanstack.com/start)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-Components-000000?logo=shadcnui)](https://ui.shadcn.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-Bundler-646CFF?logo=vite)](https://vitejs.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-Testing-6E9F18?logo=vitest)](https://vitest.dev/)
[![NestJS](https://img.shields.io/badge/NestJS-Framework-E0234E?logo=nestjs)](https://nestjs.com/)
[![LangChain](https://img.shields.io/badge/LangChain-AI-1C3C3C?logo=langchain)](https://python.langchain.com/)
[![Docker](https://img.shields.io/badge/Docker-Container-2496ED?logo=docker)](https://www.docker.com/)
[![Helm](https://img.shields.io/badge/Helm-Charts-0F1689?logo=helm)](https://helm.sh/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-K8s-326CE5?logo=kubernetes)](https://kubernetes.io/)
[![Terraform](https://img.shields.io/badge/Terraform-IaC-844FBA?logo=terraform)](https://www.terraform.io/)

[![Analyze Code](https://github.com/JimmyPaolini/monorepo/actions/workflows/analyze-code.yml/badge.svg)](https://github.com/JimmyPaolini/monorepo/actions/workflows/analyze-code.yml)
[![Test Coverage](https://github.com/JimmyPaolini/monorepo/actions/workflows/test-coverage.yml/badge.svg)](https://github.com/JimmyPaolini/monorepo/actions/workflows/test-coverage.yml)
[![Security Audit](https://github.com/JimmyPaolini/monorepo/actions/workflows/audit-security.yml/badge.svg)](https://github.com/JimmyPaolini/monorepo/actions/workflows/audit-security.yml)
[![Validate Conventions](https://github.com/JimmyPaolini/monorepo/actions/workflows/validate-conventions.yml/badge.svg?branch=main)](https://github.com/JimmyPaolini/monorepo/actions/workflows/validate-conventions.yml)
[![Build Projects](https://github.com/JimmyPaolini/monorepo/actions/workflows/build-projects.yml/badge.svg)](https://github.com/JimmyPaolini/monorepo/actions/workflows/build-projects.yml)
[![Make Devcontainer](https://github.com/JimmyPaolini/monorepo/actions/workflows/make-devcontainer.yml/badge.svg)](https://github.com/JimmyPaolini/monorepo/actions/workflows/make-devcontainer.yml)
[![Release Version](https://github.com/JimmyPaolini/monorepo/actions/workflows/release-version.yml/badge.svg)](https://github.com/JimmyPaolini/monorepo/actions/workflows/release-version.yml)

A modern TypeScript monorepo with Nx, featuring automated releases, comprehensive code quality tools, and strict type safety.

## 🚀 Quick Start

### Local Setup (macOS, Recommended)

```bash
# Automated setup (installs tools & dependencies via Homebrew)
./scripts/local/setup.sh
```

### Dev Container Setup

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) and the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
2. Open the repo in VS Code and click **Reopen in Container** when prompted
3. All tools and dependencies are installed automatically

## 📦 Projects

- **[affirmations](applications/affirmations)** - Python LangChain + Ollama affirmation generator (LangGraph ReAct agent, SearxNG)
- **[caelundas](applications/caelundas)** - CLI ephemeris calendar generator with astronomical calculations
- **[lexico](applications/lexico)** - TanStack Start + Supabase dictionary web application
- **[lexico-components](packages/lexico-components)** - Shared React component library using shadcn/ui
- **[JimmyPaolini](applications/JimmyPaolini)** - GitHub profile site

## 💻 Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full development workflow, commit/PR conventions, and release process. See [documentation/github-actions.md](documentation/github-actions.md) for CI/CD pipeline architecture.

```bash
# Run development servers
nx run lexico:develop
nx run caelundas:develop

# Run tasks (Nx handles caching and project dependencies)
nx run <project>:<target>          # single project
nx run-many --target=test --all    # all projects
nx affected --target=test          # affected projects only
```

### ✅ Quality

All projects use strict TypeScript with comprehensive automated quality checks:

| Tool | Purpose |
| --- | --- |
| **ESLint + Oxlint** | Linting with strict rules |
| **Oxfmt + Prettier** | Code formatting (Oxfmt primary, Prettier supplementary) |
| **TypeScript** | Strict type checking (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) |
| **Knip** | Unused files, exports, and dependency detection |
| **cspell** | Spell checking |
| **markdownlint** | Markdown linting |
| **Vitest** | Unit and integration testing |

```bash
# Run all quality checks
nx run-many --target=analyze-code --all

# Check for unused code (review before using :write)
nx run monorepo:knip
nx run monorepo:knip:write  # auto-removes unused code — use with caution

# Run affected projects only
nx affected --target=analyze-code
```

Quality checks run automatically on staged files (pre-commit via lint-staged) and on all PRs via GitHub Actions.

### 🏭 Conformance

The [`conformance`](tools/conformance) tool both generates and validates code conformance to monorepo conventions. Nx generators scaffold new projects, directories, and files with consistent structure, naming, and formatting; generator unit tests then validate that each generated instance still conforms to the template used to generate it.

**Available generators:**

| Generator | Alias | Description |
| --- | --- | --- |
| `conformance:react-component` | `c` | React component + test file (PascalCase) |
| `conformance:nestjs-service-module` | `nsm` | NestJS module, service, types, constants, and unit test |
| `conformance:nestjs-command-application` | `nca` | Full NestJS CLI application scaffold |

```bash
# Generate a React component (prompts for project if --project omitted)
nx generate conformance:react-component --name=Button
nx g conformance:react-component --name=Button --project=lexico-components

# Generate a NestJS service module
nx generate conformance:nestjs-service-module --name=user
nx g conformance:nestjs-service-module --name=userProfile --project=my-nestjs-app

# Generate a NestJS command-line application
nx generate conformance:nestjs-command-application --name=stellar-cli
```

Generators auto-detect the target project by framework tag (`framework:react` / `framework:nestjs`) and prompt interactively when `--project` is omitted. See [tools/conformance](tools/conformance) for architecture details and how to extend generators.

## 🚢 Release Process

Releases are fully automated via [semantic-release](https://semantic-release.gitbook.io/) on merge to `main` — commits are analyzed, the version is bumped (`feat` → minor, `fix` → patch, `BREAKING CHANGE` → major), and a GitHub release + `CHANGELOG.md` entry are generated. See [release.config.cjs](release.config.cjs) for configuration.
