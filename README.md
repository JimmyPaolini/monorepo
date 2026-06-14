# monorepo

[![Nx](https://img.shields.io/badge/Nx-Monorepo-143055?logo=nx)](https://nx.dev)
[![pnpm](https://img.shields.io/badge/pnpm-Workspace-F69220?logo=pnpm)](https://pnpm.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24-5FA04E?logo=nodedotjs)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.14-3776AB?logo=python)](https://www.python.org/)
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

### 💻 Local Setup (macOS, Recommended)

```bash
./scripts/local/setup.sh
```

### 🐳 Dev Container Setup

Install [Docker Desktop](https://www.docker.com/products/docker-desktop/), [VSCode](https://code.visualstudio.com), and the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers), then open this repository and run the command **Reopen in Container** (it should prompt the command)

## 💽 Projects

- **[affirmations](applications/affirmations)** - Python LangChain + Ollama affirmation generator (LangGraph ReAct agent, SearxNG)
- **[caelundas](applications/caelundas)** - CLI ephemeris calendar generator with astronomical calculations
- **[conformance](tools/conformance)** - Nx generators for scaffolding code
- **[infrastructure](infrastructure)** - Helm charts, Terraform, Kubernetes infrastructure
- **JimmyPaolini** - Git submodule for the GitHub profile site (`applications/JimmyPaolini`)
- **[lexico](applications/lexico)** - TanStack Start SSR dictionary interface with placeholder backend contracts
- **[lexico-components](packages/lexico-components)** - Shared React component library using shadcn/ui
- **[lexico-entities](packages/lexico-entities/README.md)** - Shared TypeORM entities and database helpers for Lexico projects
- **[lexico-ingestion](applications/lexico-ingestion)** - NestJS CLI app for Latin dictionary data ingestion

## 📖 Documentation

### Getting Started & Workflow

- [Contributing Guide](CONTRIBUTING.md) - Local setup, PR conventions, and workflows
- [Tool Execution Model](documentation/development/tool-execution-model.md) - When to use Nx vs. direct tooling
- [Release Process](documentation/development/release-process.md) - Automated semantic versioning and changelogs
- [Troubleshooting Gotchas](documentation/troubleshooting/gotchas.md) - Solutions to common environment and tooling issues

### Architecture & Systems

- [CI/CD Pipeline](documentation/github-actions.md) - GitHub Actions workflows
- [Conformance Generators](documentation/development/conformance.md) - Scaffolding code using Nx generators
- [Static Analysis & Code Quality](documentation/code-quality/static-analysis.md) - Linting, formatting, and tests
- [Deployment Models](documentation/architecture/deployment-models.md) - Kubernetes, Helm, and infrastructure architecture
- [Framework Guides](documentation/frameworks/) - References for [Kubernetes](documentation/frameworks/kubernetes.md), [NestJS](documentation/frameworks/nestjs.md), and [LangChain Python](documentation/frameworks/langchain-python.md)

### Conventions & Guidelines

- [TypeScript](documentation/conventions/typescript.md) / [React](documentation/conventions/react.md) / [Python](documentation/conventions/python.md) - Language standards
- [Imports](documentation/conventions/imports.md) - Import sorting and module resolution
- [Testing Strategy](documentation/code-quality/testing-strategy.md) - Unit, integration, and E2E testing approaches
- [Error Handling](documentation/code-quality/error-handling.md) - Typed errors and boundary validations
- [Context Engineering](documentation/development/context-engineering.md) - Building AI-friendly context
- [Gitmoji](documentation/gitmoji.md) / [Abbreviations](documentation/abbreviations.md)

**🤖 Agent Skills (Domain Knowledge)**
Skills are specialized instruction files used by our automated agents, but they also serve as excellent deep-dive documentation for human developers.

- [View all Skills](documentation/skills/README.md) - Complete index of available skills
- **Workflows:** [Git Commits](documentation/skills/commit-code/SKILL.md) / [PR Management](documentation/skills/create-pull-request/SKILL.md) / [Branch Naming](documentation/skills/checkout-branch/SKILL.md)
- **Tooling:** [Nx Workspaces](documentation/skills/nx-workspace/SKILL.md) / [Generators](documentation/skills/nx-generate/SKILL.md) / [Task Running](documentation/skills/nx-run-tasks/SKILL.md)
- **Infrastructure:** [Docker](documentation/skills/docker-workflows/SKILL.md) / [Kubernetes](documentation/skills/kubernetes-deployment/SKILL.md) / [Terraform](documentation/skills/mcp-terraform/SKILL.md)
- **Domains:** [TanStack Start](documentation/skills/tanstack-start-ssr/SKILL.md) / [Ephemeris Pipeline](documentation/skills/ephemeris-pipeline/SKILL.md)

Other important files include [CHANGELOG.md](CHANGELOG.md) and [SECURITY.md](SECURITY.md).
