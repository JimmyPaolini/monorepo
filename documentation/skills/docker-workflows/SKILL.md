---
name: docker-workflows
description: Build and deploy Docker images in the monorepo - platform targeting, GHCR integration, and container optimization. Use this skill when working with Docker.
license: MIT
---

# Docker Workflows

This skill covers Docker workflows in the monorepo, including multi-stage builds, platform targeting, GitHub Container Registry (GHCR) integration, and container optimization.

## Overview

The monorepo uses Docker for:

- **Building production images** for deployment
- **Kubernetes job execution** (caelundas)
- **Local development** environments (Supabase)
- **CI/CD pipelines** for testing and deployment

## Docker Configuration

### Project Structure

```text
applications/caelundas/
  Dockerfile              # Single-stage build (runs TypeScript directly)
  .dockerignore          # Exclude node_modules, etc.
```

### Single-Stage Build

Caelundas uses a single-stage build that runs TypeScript directly via pnpm (no compilation step):

```dockerfile
# Base Image - Alpine for minimal size
FROM node:22.20.0-alpine

# Install build tools needed for native modules like sqlite3
RUN apk add --no-cache python3 make g++

# Setup Environment
WORKDIR /app
RUN npm install -g pnpm

# Install Dependencies (layer caching - copy package files first)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY applications/caelundas/package.json ./applications/caelundas/
RUN pnpm install --filter caelundas

# Copy Source Code (entire monorepo for workspace resolution)
COPY . .

# Run the application
WORKDIR /app/applications/caelundas
CMD ["pnpm", "start"]
```

### Design Decisions

- **Single-stage**: No build step needed — TypeScript is executed directly via `tsx`/`ts-node`
- **Native build tools**: `python3 make g++` required for `sqlite3` native module compilation
- **Full monorepo copy**: Workspace resolution requires root-level package files
- **Filter install**: `pnpm install --filter caelundas` installs only the app's dependencies
- **Layer caching**: Package files copied before source for efficient rebuilds

## Platform Targeting

### Why Platform Targeting Matters

Apple Silicon Macs (M1/M2) use arm64 architecture, but Kubernetes clusters often run amd64. Building images on Apple Silicon without platform targeting creates incompatible images.

### Building for linux/amd64

```bash
# Single platform
docker build --platform linux/amd64 -t caelundas:latest .

# Multi-platform (if needed)
docker buildx build --platform linux/amd64,linux/arm64 -t caelundas:latest .
```

### Nx Target Configuration

```json
{
  "targets": {
    "docker-build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "docker build --platform linux/amd64 -t ghcr.io/jimmypaolini/caelundas:latest .",
        "cwd": "applications/caelundas"
      }
    }
  }
}
```

### Verification

Check image platform:

```bash
docker inspect ghcr.io/jimmypaolini/caelundas:latest | jq '.[0].Architecture'
# Should output: "amd64"
```

## GitHub Container Registry (GHCR)

### Authentication

```bash
# Login with personal access token
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Or use GitHub CLI
gh auth token | docker login ghcr.io -u USERNAME --password-stdin
```

### Image Tagging Convention

```bash
# Latest tag (main branch)
ghcr.io/jimmypaolini/caelundas:latest

# Version tag (semantic version)
ghcr.io/jimmypaolini/caelundas:v1.2.3

# Commit SHA tag (CI builds)
ghcr.io/jimmypaolini/caelundas:sha-abc1234

# Branch tag (feature branches)
ghcr.io/jimmypaolini/caelundas:feat-new-feature
```

### Push Images

```bash
# Tag image
docker tag caelundas:latest ghcr.io/jimmypaolini/caelundas:latest

# Push to registry
docker push ghcr.io/jimmypaolini/caelundas:latest
```

### Pull Images

```bash
# Pull from GHCR
docker pull ghcr.io/jimmypaolini/caelundas:latest

# Run locally
docker run ghcr.io/jimmypaolini/caelundas:latest
```

## Docker Compose

### Local Development

```yaml
# docker-compose.yml
version: "3.8"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: builder # Use builder stage for hot reload
    volumes:
      - ./src:/app/src # Mount source for hot reload
      - ./output:/app/output # Mount output directory
    environment:
      - NODE_ENV=development
      - START_DATE=2024-01-01
      - END_DATE=2024-12-31
    command: pnpm develop
```

### Running with Docker Compose

```bash
# Start services
docker-compose up

# Rebuild on changes
docker-compose up --build

# Run in background
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f app
```

## Image Optimization

### Reduce Image Size

1. **Use Alpine base images**: `node:22.20.0-alpine` vs `node:22` (~100MB vs ~900MB)
2. **Layer caching**: Copy package files before source
3. **Filter dependencies**: `pnpm install --filter <project>` for smaller installs
4. **Clean build artifacts**: `RUN rm -rf /tmp/* ~/.npm`

### Layer Caching Strategy

Order Dockerfile commands by frequency of change:

```dockerfile
# Rarely changes → cache layer
COPY package*.json ./
RUN pnpm install

# Changes often → invalidates subsequent layers
COPY src ./src
RUN pnpm build
```

### .dockerignore

Exclude unnecessary files to speed up builds:

```text
# .dockerignore
node_modules
dist
.git
.github
*.log
.env
.DS_Store
coverage
```

## Security Best Practices

### 1. Don't Include Secrets

Never bake secrets into images:

❌ **Don't:**

```dockerfile
ENV DATABASE_URL=postgresql://user:password@host/db
```

✅ **Do:**

```dockerfile
# Pass secrets at runtime
ENV DATABASE_URL=${DATABASE_URL}
```

### 2. Run as Non-Root User

Don't run containers as root:

```dockerfile
# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Switch to nodejs user
USER nodejs
```

### 3. Use Specific Image Tags

Avoid `latest` in production:

❌ **Don't:**

```dockerfile
FROM node:latest
```

✅ **Do:**

```dockerfile
FROM node:22.20.0-alpine
```

### 4. Scan for Vulnerabilities

```bash
# Scan image with Docker Scout
docker scout cves ghcr.io/jimmypaolini/caelundas:latest

# Scan with Trivy
trivy image ghcr.io/jimmypaolini/caelundas:latest
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Docker Build

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: applications/caelundas
          platforms: linux/amd64
          push: true
          tags: |
            ghcr.io/jimmypaolini/caelundas:latest
            ghcr.io/jimmypaolini/caelundas:${{ github.sha }}
```

## Nx Docker Targets

### Build Target

```bash
# Build Docker image
nx run caelundas:docker-build
```

Defined in `project.json`:

```json
{
  "docker-build": {
    "executor": "nx:run-commands",
    "options": {
      "command": "docker build --platform linux/amd64 -t ghcr.io/jimmypaolini/caelundas:latest .",
      "cwd": "applications/caelundas"
    }
  }
}
```

### Push Target

```bash
# Push to GHCR
nx run caelundas:docker-push
```

### Combined Target

```bash
# Build and push
nx run-many --target=docker-build --projects=caelundas
nx run-many --target=docker-push --projects=caelundas
```

## Debugging Docker Builds

### Build with Output

```bash
# See detailed build output
docker build --progress=plain .
```

### Inspect Layers

```bash
# See layer sizes
docker history ghcr.io/jimmypaolini/caelundas:latest

# Inspect filesystem
docker run -it ghcr.io/jimmypaolini/caelundas:latest sh
```

### Build Specific Stage

```bash
# Build only builder stage
docker build --target builder -t caelundas:builder .
```

### Cache Busting

```bash
# Force rebuild without cache
docker build --no-cache .
```

## Common Issues

### Platform Mismatch

**Error:**

```text
WARNING: The requested image's platform (linux/arm64) does not match
the detected host platform (linux/amd64)
```

**Solution:**

```bash
docker build --platform linux/amd64 .
```

### Build Context Too Large

**Error:**

```text
Sending build context to Docker daemon: 2.5GB
```

**Solution:**
Add to `.dockerignore`:

```text
node_modules
dist
.git
```

### Layer Cache Miss

**Issue:** Builds are slow because layers aren't cached.

**Solution:** Order Dockerfile commands strategically:

```dockerfile
# Copy package files first (changes less frequently)
COPY package*.json ./
RUN pnpm install

# Copy source code last (changes more frequently)
COPY src ./src
```

## Related Documentation

- [applications/caelundas/AGENTS.md](../../applications/caelundas/AGENTS.md) - Caelundas Docker configuration
- [infrastructure/AGENTS.md](../../infrastructure/AGENTS.md) - Kubernetes integration
- [kubernetes-deployment skill](../kubernetes-deployment/SKILL.md) - K8s deployment workflows

## Best Practices Summary

1. **Use Alpine base images** for size reduction
2. **Target linux/amd64** when deploying to K8s
3. **Push to GHCR** with semantic tags
4. **Install native build tools** when needed (sqlite3, etc.)
5. **Don't include secrets** in images
6. **Run as non-root user** for security
7. **Scan for vulnerabilities** regularly
8. **Order layers** by frequency of change
9. **Use .dockerignore** to reduce context size
10. **Tag with commit SHA** for traceability
