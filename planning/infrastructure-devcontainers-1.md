---
goal: Implement Dev Container for Reproducible Development Environment
version: 1.1
date_created: 2026-01-26
last_updated: 2026-01-26
owner: Infrastructure
status: "Completed"
tags: [infrastructure, developer-experience, docker, devcontainers]
---

# Introduction

![Status: Completed](https://img.shields.io/badge/status-Completed-brightgreen)

This plan implements a single Development Container (devcontainer) for the entire monorepo, providing a reproducible, containerized development environment that ensures consistent tooling across all developers and CI/CD pipelines. Dev containers eliminate "works on my machine" issues by standardizing Node.js 22.20.0, pnpm 10.20.0, and all required CLI tools (Supabase, Helm, kubectl, GitHub CLI) in a unified container-based environment. Rather than per-project devcontainers, a single monorepo devcontainer supports all projects (lexico, caelundas, JimmyPaolini) with shared tooling and configuration.

## 1. Requirements & Constraints

### Functional Requirements

- **REQ-001**: Container must include Node.js 22.20.0 matching `engines.node` in root `package.json`
- **REQ-002**: Container must include pnpm 10.20.0 matching `packageManager` in root `package.json`
- **REQ-003**: Container must support Docker-outside-of-Docker (sibling containers) for running Supabase local stack (PostgreSQL, PostgREST, GoTrue containers) via host Docker socket mount
- **REQ-004**: Container must include Supabase CLI for database migrations and type generation
- **REQ-005**: Container must include Helm and kubectl for caelundas Kubernetes deployments
- **REQ-006**: Container must include GitHub CLI for repository operations
- **REQ-007**: Container must forward ports 3000 (lexico dev server), 54321 (Supabase API), 54322 (PostgreSQL), 54323 (Supabase Studio)
- **REQ-008**: VS Code extensions (ESLint, Prettier, Tailwind CSS IntelliSense, Nx Console) must auto-install

### Security Requirements

- **SEC-001**: Container must run as non-root user (`devcontainer` or `node`)
- **SEC-002**: Docker socket mount (`/var/run/docker.sock`) must have appropriate permissions for non-root user
- **SEC-003**: No secrets or credentials stored in devcontainer configuration files

### Constraints

- **CON-001**: Must use official Microsoft devcontainer base images (`mcr.microsoft.com/devcontainers/*`)
- **CON-002**: Must support VS Code Dev Containers (GitHub Codespaces not in scope for v1)
- **CON-003**: Container build time must be under 5 minutes for acceptable developer experience
- **CON-004**: Must work on macOS (Apple Silicon M1/M2/M3), macOS Intel, Linux x64, and Windows WSL2

### Guidelines

- **GUD-001**: Follow devcontainer.json specification v0.300.0+ from containers.dev
- **GUD-002**: Use Features for modular tool installation (not custom Dockerfile scripts)
- **GUD-003**: Lifecycle scripts must be idempotent (safe to run multiple times)
- **GUD-004**: Configuration must be validated by `devcontainer validate` CLI command

### Patterns

- **PAT-001**: Use parallel lifecycle script execution for independent setup tasks
- **PAT-002**: Use `postCreateCommand` for one-time setup (pnpm install)
- **PAT-003**: Use `postStartCommand` for repeated setup (start Supabase)
- **PAT-004**: Use `remoteEnv` for environment variables, not shell profile modifications

## 2. Implementation Steps

### Implementation Phase 1: Monorepo Devcontainer Configuration

- GOAL-001: Create devcontainer.json with Node.js, pnpm, and essential Features for all monorepo projects

| Task     | Description                                                                                                    | Completed | Date       |
| -------- | -------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-001 | Create `.devcontainer/devcontainer.json` with `mcr.microsoft.com/devcontainers/typescript-node:22` base image  | ✅        | 2026-01-26 |
| TASK-002 | Add Features: `docker-outside-of-docker:1`, `github-cli:1`, `kubectl-helm-minikube:1` (helm only, no minikube) | ✅        | 2026-01-26 |
| TASK-003 | Configure `forwardPorts` array: `[3000, 54321, 54322, 54323, 54324, 54325]` with descriptive labels            | ✅        | 2026-01-26 |
| TASK-004 | Add `postCreateCommand` object with parallel tasks: pnpm install, Supabase CLI install                         | ✅        | 2026-01-26 |
| TASK-005 | Configure `customizations.vscode.extensions` array with required extension IDs                                 | ✅        | 2026-01-26 |
| TASK-006 | Configure `customizations.vscode.settings` for formatOnSave, default formatter, eslint validation              | ✅        | 2026-01-26 |
| TASK-007 | Set `remoteUser: node` and `containerUser: node` for non-root execution                                        | ✅        | 2026-01-26 |

### Implementation Phase 2: Supabase CLI Installation

- GOAL-002: Ensure Supabase CLI is available in devcontainer for lexico database workflows

| Task     | Description                                                                                        | Completed | Date       |
| -------- | -------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-008 | Create `.devcontainer/scripts/install-supabase.sh` script for idempotent Supabase CLI installation | ✅        | 2026-01-26 |
| TASK-009 | Add script execution to `postCreateCommand.supabase` lifecycle hook                                | ✅        | 2026-01-26 |
| TASK-010 | Verify Supabase CLI version with `supabase --version` in `postAttachCommand`                       | ✅        | 2026-01-26 |

### Implementation Phase 3: Documentation and Validation

- GOAL-003: Document devcontainer usage and validate configuration correctness

| Task     | Description                                                                               | Completed | Date       |
| -------- | ----------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-011 | Add devcontainer section to `CONTRIBUTING.md` with setup instructions                     | ✅        | 2026-01-26 |
| TASK-012 | Add `.devcontainer/README.md` explaining monorepo devcontainer usage and configuration    | ✅        | 2026-01-26 |
| TASK-013 | Run `devcontainer validate` CLI command to verify JSON schema compliance                  | ✅        | 2026-01-26 |
| TASK-014 | Test full workflow: clone repo → open in container → pnpm install → nx run lexico:develop | ✅        | 2026-01-26 |
| TASK-015 | Update `AGENTS.md` with devcontainer-aware development workflow guidance                  | ✅        | 2026-01-26 |

### Implementation Phase 4: CI/CD Integration

- GOAL-004: Use devcontainer in CI/CD for consistent build environments

| Task     | Description                                                                              | Completed | Date       |
| -------- | ---------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-016 | Create `.github/workflows/devcontainer-build.yml` to validate devcontainer builds on PRs | ✅        | 2026-01-26 |
| TASK-017 | Add optional CI job using `devcontainers/ci` GitHub Action to run tests inside container | ✅        | 2026-01-26 |
| TASK-018 | Cache devcontainer layers using `ghcr.io/owner/monorepo-devcontainer:latest` prebuild    | ✅        | 2026-01-26 |

## 3. Alternatives

- **ALT-001**: Docker-in-Docker (DinD) instead of sibling containers - rejected because DinD has higher overhead (nested daemon ~200-500MB RAM), slower startup, separate image cache (Supabase images download twice), and storage driver complexity; sibling containers via socket mount are faster and share host cache
- **ALT-002**: Custom Dockerfile without devcontainer Features - rejected because Features provide modular, maintained tool installations with automatic updates and cross-platform support
- **ALT-003**: Docker Compose for development environment - rejected because devcontainers integrate natively with VS Code/Codespaces and provide richer lifecycle hooks
- **ALT-004**: Nix flakes for reproducible environments - rejected because team familiarity with Docker is higher and VS Code integration is more mature for devcontainers
- **ALT-005**: asdf/mise version manager on host - rejected because it doesn't solve environment parity issues across different host operating systems
- **ALT-006**: Per-project devcontainers (lexico, caelundas, etc.) - rejected because Nx monorepo development typically spans multiple projects simultaneously, shared tooling is more efficient, configuration maintenance is simplified with a single container, and Nx task orchestration benefits from unified access to all projects
- **ALT-007**: Support GitHub Codespaces in v1 - deferred because Codespaces requires Docker-in-Docker (no host socket available), adding performance overhead; can be added later with separate config if needed

## 4. Dependencies

- **DEP-001**: Docker Desktop or Docker Engine (Linux) - required for container execution
- **DEP-002**: VS Code with Dev Containers extension (`ms-vscode-remote.remote-containers`) - required for local development
- **DEP-003**: GitHub Codespaces - not supported in v1 (requires Docker-in-Docker, may be added later)
- **DEP-004**: Microsoft devcontainer base images from `mcr.microsoft.com/devcontainers/` - foundation for container
- **DEP-005**: Dev Container Features from `ghcr.io/devcontainers/features/` - modular tool installation
- **DEP-006**: Supabase CLI binary - required for lexico database workflows
- **DEP-007**: Corepack - Node.js built-in for pnpm version management

## 5. Files

### New Files

- **FILE-001**: `.devcontainer/devcontainer.json` - Monorepo devcontainer configuration (single container for all projects)
- **FILE-002**: `.devcontainer/scripts/install-supabase.sh` - Idempotent Supabase CLI installation script
- **FILE-003**: `.devcontainer/README.md` - Devcontainer documentation and usage guide
- **FILE-004**: `.github/workflows/devcontainer-build.yml` - CI workflow to validate devcontainer

### Modified Files

- **FILE-005**: `CONTRIBUTING.md` - Add devcontainer setup instructions section
- **FILE-006**: `AGENTS.md` - Add devcontainer-aware workflow guidance
- **FILE-007**: `.gitignore` - Add `.devcontainer/.env` to ignore local overrides

## 6. Testing

- **TEST-001**: Validate devcontainer.json schema compliance using `devcontainer validate` CLI
- **TEST-002**: Build devcontainer from scratch and verify completion under 5 minutes
- **TEST-003**: Verify Node.js version `node --version` outputs `v22.20.0`
- **TEST-004**: Verify pnpm version `pnpm --version` outputs `10.20.0`
- **TEST-005**: Verify Docker socket access by running `docker run hello-world` inside container
- **TEST-006**: Verify Supabase CLI by running `supabase --version` inside container
- **TEST-007**: Verify kubectl/helm by running `kubectl version --client` and `helm version` inside container
- **TEST-008**: Verify GitHub CLI by running `gh --version` inside container
- **TEST-009**: Run `pnpm install` and verify zero errors
- **TEST-010**: Run `nx run lexico:supabase:start` and verify all Supabase services start
- **TEST-011**: Run `nx run lexico:develop` and verify dev server accessible on forwarded port 3000
- **TEST-012**: Verify VS Code extensions auto-install on container attach
- **TEST-013**: Test on macOS Apple Silicon host machine
- **TEST-014**: Test on Linux x64 host machine (or VM)

## 7. Risks & Assumptions

### Risks

- **RISK-001**: Docker socket permissions may prevent non-root container user from running Docker commands - Mitigation: `docker-outside-of-docker` Feature automatically adds user to docker group
- **RISK-002**: Large container image size (>5GB) increases initial pull time - Mitigation: Use multi-stage builds, prebuild and cache image on GHCR
- **RISK-003**: Supabase CLI installation may fail on architecture mismatch - Mitigation: Use official install script which detects architecture
- **RISK-004**: Port conflicts if host already runs services on forwarded ports - Mitigation: Document port requirements, use `onAutoForward: notify` for awareness
- **RISK-005**: Apple Silicon (ARM64) compatibility issues with some tools - Mitigation: Test on M1/M2/M3 Macs, use `platform: linux/amd64` emulation if needed

### Assumptions

- **ASSUMPTION-001**: Developers have Docker Desktop installed and running (or Docker Engine on Linux)
- **ASSUMPTION-002**: Developers use VS Code as primary IDE (devcontainers work with JetBrains but configuration differs)
- **ASSUMPTION-003**: Network connectivity available for pulling base images and Features from container registries
- **ASSUMPTION-004**: Developers have at least 8GB RAM available for container and Supabase stack
- **ASSUMPTION-005**: GitHub Codespaces usage is optional, not required for development

## 8. Related Specifications / Further Reading

- [Development Containers Specification](https://containers.dev/implementors/spec/)
- [devcontainer.json Reference](https://containers.dev/implementors/json_reference/)
- [Dev Container Features](https://containers.dev/features)
- [Microsoft Dev Container Images](https://github.com/devcontainers/images)
- [Docker-outside-of-Docker Feature](https://github.com/devcontainers/features/tree/main/src/docker-outside-of-docker)
- [GitHub Codespaces Documentation](https://docs.github.com/en/codespaces) (not supported in v1, requires DinD)
- [Supabase CLI Installation](https://supabase.com/docs/guides/cli)
- [Monorepo AGENTS.md](../AGENTS.md) - Existing development workflow documentation
- [Lexico AGENTS.md](../applications/lexico/AGENTS.md) - Supabase local development requirements
- [Caelundas AGENTS.md](../applications/caelundas/AGENTS.md) - Kubernetes deployment tooling requirements
