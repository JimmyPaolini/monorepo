# Dev Container Configuration

This directory contains the development container configuration for the monorepo. The dev container provides a fully configured, reproducible development environment with all required tools pre-installed.

## Purpose

The dev container eliminates "works on my machine" issues by standardizing:

- **Node.js 22.20.0** - Matching `engines.node` in root `package.json`
- **pnpm 10.20.0** - Matching `packageManager` in root `package.json`
- **Supabase CLI** - For database migrations and type generation (lexico)
- **kubectl & Helm** - For Kubernetes deployments (caelundas)
- **GitHub CLI** - For repository operations
- **Docker** - Access to host Docker socket for running Supabase local stack

## Quick Start

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) and [VS Code Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
2. Open the monorepo folder in VS Code
3. Click **Reopen in Container** when prompted (or `Ctrl/Cmd+Shift+P` → `Dev Containers: Reopen in Container`)
4. Wait for container build (~2-3 minutes first time, cached after)
5. Terminal opens with all tools ready

## Included Features

The container uses [Dev Container Features](https://containers.dev/features) for modular tool installation:

| Feature                    | Version | Purpose                                                |
| -------------------------- | ------- | ------------------------------------------------------ |
| `typescript-node:22`       | Base    | Node.js 22 with TypeScript support                     |
| `docker-outside-of-docker` | 1       | Docker CLI with host socket mount (sibling containers) |
| `github-cli`               | 1       | `gh` command for GitHub operations                     |
| `kubectl-helm-minikube`    | 1       | kubectl and Helm (minikube disabled)                   |

### Custom Installations

- **Supabase CLI**: Installed via `scripts/install-supabase.sh` during container creation
- **pnpm**: Activated via Corepack with exact version 10.20.0

## VS Code Extensions

The following extensions auto-install when the container starts:

| Extension                               | Purpose                         |
| --------------------------------------- | ------------------------------- |
| `dbaeumer.vscode-eslint`                | ESLint integration              |
| `esbenp.prettier-vscode`                | Prettier formatting             |
| `bradlc.vscode-tailwindcss`             | Tailwind CSS IntelliSense       |
| `nrwl.angular-console`                  | Nx Console                      |
| `streetsidesoftware.code-spell-checker` | Spell checking                  |
| `eamodio.gitlens`                       | Git history and annotations     |
| `ms-azuretools.vscode-docker`           | Docker file support             |
| `github.vscode-github-actions`          | GitHub Actions workflow editing |
| `redhat.vscode-yaml`                    | YAML language support           |
| `mikestead.dotenv`                      | `.env` file syntax              |
| `vitest.explorer`                       | Vitest test explorer            |

## Port Forwarding

Ports are automatically forwarded to your host machine:

| Port  | Service             | Auto-Forward | Notes                     |
| ----- | ------------------- | ------------ | ------------------------- |
| 3000  | Lexico Dev Server   | Notify       | TanStack Start dev server |
| 54321 | Supabase API        | Silent       | PostgREST API endpoint    |
| 54322 | Supabase PostgreSQL | Silent       | Direct database access    |
| 54323 | Supabase Studio     | Notify       | Database admin UI         |
| 54324 | Supabase Inbucket   | Silent       | Local email testing       |
| 54325 | Supabase Analytics  | Silent       | Analytics dashboard       |

## Lifecycle Scripts

| Hook                | Tasks                                                       |
| ------------------- | ----------------------------------------------------------- |
| `postCreateCommand` | `pnpm install --frozen-lockfile`, Supabase CLI installation |
| `postAttachCommand` | Verify tool versions (Node, pnpm, Supabase, gh, Helm)       |

## Customization

### Adding Extensions

Edit `customizations.vscode.extensions` in `devcontainer.json`:

```jsonc
"customizations": {
  "vscode": {
    "extensions": [
      // ... existing extensions
      "your.extension-id"
    ]
  }
}
```

### Adding VS Code Settings

Edit `customizations.vscode.settings` in `devcontainer.json`:

```jsonc
"customizations": {
  "vscode": {
    "settings": {
      // ... existing settings
      "your.setting": "value"
    }
  }
}
```

### Environment Variables

Add to `remoteEnv` in `devcontainer.json`:

```jsonc
"remoteEnv": {
  "NODE_OPTIONS": "--max-old-space-size=4096",
  "YOUR_VAR": "value"
}
```

For secrets, create `.devcontainer/.env` (gitignored) and reference in `remoteEnv`.

## Troubleshooting

### Container fails to build

1. Ensure Docker Desktop is running
2. Try `Dev Containers: Rebuild Container` from command palette
3. Check Docker has sufficient resources (8GB RAM recommended)

### Docker commands fail inside container

The container uses Docker-outside-of-Docker (sibling containers) via host socket mount:

1. Verify Docker Desktop is running on host
2. Check socket permissions: `ls -la /var/run/docker.sock`
3. Container user (`node`) should have docker group membership

### Supabase CLI not found

Run the install script manually:

```bash
.devcontainer/scripts/install-supabase.sh
```

### pnpm version mismatch

Corepack should handle this automatically. If issues persist:

```bash
corepack enable
corepack prepare pnpm@10.20.0 --activate
```

### Port already in use

If host already uses a forwarded port:

1. Stop the conflicting service on host
2. Or modify `forwardPorts` in `devcontainer.json` to use different ports

### Slow file system performance (macOS)

Docker Desktop on macOS can have slow I/O with large node_modules:

1. Ensure "Use VirtioFS" is enabled in Docker Desktop settings
2. Consider using `Named Volume` mount for node_modules (advanced)

## Manual Testing Checklist

After building the container, verify the following:

```bash
# 1. Check tool versions
node --version          # Should output v22.20.0
pnpm --version          # Should output 10.20.0
supabase --version      # Should output version number
gh --version            # Should output gh version X.Y.Z
helm version --short    # Should output vX.Y.Z
kubectl version --client # Should output client version

# 2. Verify Docker access
docker run hello-world  # Should complete successfully

# 3. Install dependencies
pnpm install            # Should complete with no errors

# 4. Start Supabase (lexico)
nx run lexico:supabase:start  # All services should start

# 5. Start dev server
nx run lexico:develop   # Should be accessible at localhost:3000

# 6. Run tests
nx run-many --target=test --all  # Tests should pass
```

## Architecture Notes

### Why Docker-outside-of-Docker?

The container mounts the host Docker socket (`/var/run/docker.sock`) instead of running Docker-in-Docker (DinD). Benefits:

- **Faster startup**: No nested Docker daemon
- **Shared cache**: Supabase images pulled once, shared with host
- **Lower overhead**: No additional ~200-500MB RAM for DinD daemon
- **Simpler networking**: Containers share host Docker network

### Why a single monorepo container?

Instead of per-project devcontainers (lexico, caelundas, etc.):

- Nx development typically spans multiple projects
- Shared tooling is more efficient (one kubectl, one Supabase CLI)
- Simpler maintenance with single configuration
- Nx task orchestration benefits from unified access

## Related Documentation

- [CONTRIBUTING.md](../CONTRIBUTING.md) - Development workflow
- [AGENTS.md](../AGENTS.md) - AI agent guidance
- [Dev Container Specification](https://containers.dev/implementors/spec/)
- [VS Code Dev Containers](https://code.visualstudio.com/docs/devcontainers/containers)
