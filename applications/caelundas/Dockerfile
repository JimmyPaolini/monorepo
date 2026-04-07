# Dockerfile for caelundas application

# Stage 1: Build
# Using a lightweight node image for building
FROM node:22.22.2-alpine AS builder

# Install build tools needed for native modules like sqlite3
RUN apk add --no-cache python3 make g++

# Enable pnpm via corepack (avoids npm install and its bundled vulnerable dependencies)
RUN corepack enable

# Set working directory
WORKDIR /app

# Copy dependency definition files from the root
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy root tsconfig so caelundas/tsconfig.json can resolve its extends path at runtime
COPY tsconfig.base.json ./

# Copy application-specific package.json to leverage Docker layer caching
COPY applications/caelundas/package.json ./applications/caelundas/

# Configure pnpm inject mode so pnpm deploy works in pnpm v10+ without --legacy.
# Without --legacy, deploy creates a clean isolated node_modules with only
# caelundas' production dependencies, keeping root devDependencies out of the image.
# This .npmrc is scoped to the Docker build context only (not checked into source).
RUN echo "inject-workspace-packages=true" > .npmrc

# Install workspace dependencies (required for pnpm deploy resolution)
RUN pnpm install --frozen-lockfile

# Copy caelundas source code
COPY applications/caelundas ./applications/caelundas

# Deploy caelundas with only its production dependencies
RUN pnpm deploy --filter caelundas /deploy

# Stage 2: Production runtime
FROM node:22.22.2-alpine

# Upgrade OS packages to patch known vulnerabilities (e.g., zlib CVE-2026-22184)
RUN apk upgrade --no-cache

WORKDIR /app

# Copy the deployed package with its isolated node_modules
COPY --from=builder /deploy .

# caelundas/tsconfig.json has `extends: "../../tsconfig.base.json"`.
# With WORKDIR /app, that resolves to /tsconfig.base.json in the container.
COPY --from=builder /app/tsconfig.base.json /tsconfig.base.json

# Command to run the application
CMD ["node_modules/.bin/tsx", "src/main.ts"]
