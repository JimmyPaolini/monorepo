# Dockerfile for caelundas application

# 1. Base Image
# Using a lightweight node image
FROM node:22.20.0-alpine

# Install build tools needed for native modules like sqlite3
RUN apk add --no-cache python3 make g++

# 2. Setup Environment
# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# 3. Install Dependencies
# Copy dependency definition files from the root
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy application-specific package.json to leverage Docker layer caching
COPY applications/caelundas/package.json ./applications/caelundas/

# Install dependencies for the caelundas application only
RUN pnpm install --filter caelundas

# 4. Copy Source Code
# Copy the rest of the source code for the monorepo
COPY . .

# 5. Set Command
# Change to the application's directory
WORKDIR /app/applications/caelundas

# Command to run the application
CMD ["pnpm", "start"]
