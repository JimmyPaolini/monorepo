# Dev Container Configuration

This directory contains the development container configuration for the monorepo. The dev container provides a fully configured, reproducible development environment with all required tools pre-installed.

## Purpose

The dev container eliminates "works on my machine" issues by standardizing:

- **Node.js 22.20.0** - Matching `engines.node` in root `package.json`
- **pnpm 10.20.0** - Matching `packageManager` in root `package.json`
- **Supabase CLI** - For database migrations and type generation (lexico)
- **kubectl & Helm** - For Kubernetes deployments (caelundas)
- **Terraform** - For Linode LKE cluster provisioning
- **GitHub CLI** - For repository operations
- **Docker** - Docker-in-Docker daemon for running Supabase local stack (isolated from host)
- **SQLite** - CLI tool for querying and managing SQLite databases (caelundas ephemeris caching)

## Quick Start

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) and [VS Code Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
2. Open the monorepo folder in VS Code
3. Click **Reopen in Container** when prompted (or `Ctrl/Cmd+Shift+P` → `Dev Containers: Reopen in Container`)
4. Wait for container build (~2-3 minutes first time, cached after)
5. Terminal opens with all tools ready

## Included Features

The container uses [Dev Container Features](https://containers.dev/features) for modular tool installation:

| Feature                 | Version | Purpose                                        |
| ----------------------- | ------- | ---------------------------------------------- |
| `typescript-node:22`    | Base    | Node.js 22 with TypeScript support             |
| `docker-in-docker`      | 1       | Isolated Docker daemon inside container (DinD) |
| `github-cli`            | 1       | `gh` command for GitHub operations             |
| `kubectl-helm-minikube` | 1       | kubectl and Helm (minikube disabled)           |
| `terraform-asdf`        | 0       | Terraform CLI for infrastructure provisioning  |

### Custom Installations

- **Supabase CLI**: Installed from GitHub releases in `postCreateCommand` (npm wrapper is broken for global installs)
- **SQLite**: Installed via `apt-get` in `postCreateCommand` for database querying and management
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

| Hook                | Tasks                                                                |
| ------------------- | -------------------------------------------------------------------- |
| `postCreateCommand` | Enable pnpm via Corepack, install dependencies, install Supabase CLI |
| `postAttachCommand` | Verify tool versions (node, pnpm, supabase, gh, helm)                |

## Scripts

The `.devcontainer/scripts` directory contains helper scripts for container setup:

| Script                   | Purpose                                                              | Called From         |
| ------------------------ | -------------------------------------------------------------------- | ------------------- |
| `post-create-command.sh` | Enables pnpm, installs dependencies, installs Supabase CLI           | `postCreateCommand` |
| `post-attach-command.sh` | Verifies installed tool versions (Node.js, pnpm, Supabase CLI, etc.) | `postAttachCommand` |

All scripts are executable and can be run manually if needed.

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

The container uses Docker-in-Docker (DinD) with an isolated Docker daemon:

1. Verify the DinD daemon is running: `docker info`
2. If daemon not running, rebuild the container: `Dev Containers: Rebuild Container`
3. Container user (`node`) should have docker group membership automatically

### DNS/Network issues in Docker-in-Docker

The devcontainer includes DNS configuration to fix common Docker-in-Docker networking issues:

- **Container DNS**: Configured via `runArgs` with `--dns` flags (Google DNS: 8.8.8.8, 8.8.4.4 and Cloudflare: 1.1.1.1)
- **Docker Daemon DNS**: Configured via `/etc/docker/daemon.json` in `configure-docker-dns.sh`

If you still encounter `Could not resolve host` errors:

1. Verify DNS is working: `nslookup google.com`
2. Check `/etc/resolv.conf` has nameservers
3. Test basic connectivity: `ping -c 3 8.8.8.8`
4. Rebuild container completely: `Dev Containers: Rebuild Container Without Cache`

### Supabase CLI not found

Install manually from GitHub releases:

```bash
VERSION=$(curl -s https://api.github.com/repos/supabase/cli/releases/latest | grep '"tag_name":' | cut -d '"' -f 4)
curl -fsSL "https://github.com/supabase/cli/releases/download/${VERSION}/supabase_linux_amd64.tar.gz" | sudo tar -xz -C /usr/local/bin
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

### Why Docker-in-Docker?

The container runs an isolated Docker daemon inside the container instead of mounting the host Docker socket. Benefits:

- **GitHub Codespaces compatible**: Works identically in local dev and Codespaces (no host socket available in Codespaces)
- **Better isolation**: Container Docker is completely separate from host Docker
- **No permission issues**: Avoids socket permission complexities between host and container
- **Portable configuration**: Same setup works across all environments without modification

Tradeoffs:

- **Separate image cache**: Supabase images download separately (~5-10 minute first pull)
- **Slight RAM overhead**: DinD daemon uses ~200-500MB additional RAM
- **Startup delay**: ~5-10 seconds for DinD daemon initialization

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
