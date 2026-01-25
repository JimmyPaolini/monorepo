---
name: docker-workflows
description: Build and deploy Docker images in the monorepo - multi-stage builds, platform targeting, GHCR integration, and container optimization. Use this skill when working with Docker.
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
  Dockerfile              # Multi-stage build
  .dockerignore          # Exclude node_modules, etc.
  docker-compose.yml     # Local development
```

### Multi-Stage Build

Caelundas uses multi-stage builds for optimal image size:

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build application
RUN pnpm build

# Stage 2: Runtime
FROM node:20-alpine AS runner
WORKDIR /app

# Copy only production dependencies and built app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Set production environment
ENV NODE_ENV=production

# Run application
CMD ["node", "dist/main.js"]
```

### Benefits of Multi-Stage Builds

- **Smaller image size**: Final image only includes runtime dependencies
- **Faster deployments**: Less data to transfer
- **Security**: Build tools not included in production image
- **Clear separation**: Build vs runtime concerns

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

1. **Use Alpine base images**: `node:20-alpine` vs `node:20` (~100MB vs ~900MB)
2. **Multi-stage builds**: Only include runtime dependencies
3. **Layer caching**: Copy package files before source
4. **Remove dev dependencies**: `pnpm install --prod`
5. **Clean build artifacts**: `RUN rm -rf /tmp/* ~/.npm`

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
FROM node:20.11-alpine3.19
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

1. **Use multi-stage builds** for smaller images
2. **Target linux/amd64** when deploying to K8s
3. **Push to GHCR** with semantic tags
4. **Use Alpine base images** for size reduction
5. **Don't include secrets** in images
6. **Run as non-root user** for security
7. **Scan for vulnerabilities** regularly
8. **Order layers** by frequency of change
9. **Use .dockerignore** to reduce context size
10. **Tag with commit SHA** for traceability
