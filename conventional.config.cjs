/**
 * Shared conventional commit configuration
 *
 * This file is the single source of truth for types and scopes used across:
 * - commitlint.config.ts (commit message validation)
 * - validate-branch-name.config.js (branch name validation)
 *
 * When adding/removing types or scopes, update this file only.
 */

const types = [
  "build", // Build system, Vite/Docker/Helm config, or external dependency integration
  "chore", // Housekeeping that doesn't modify src or test files (gitignore, editor config, etc.)
  "ci", // GitHub Actions workflows, composite actions, and CI/CD scripts
  "docs", // Documentation, AGENTS.md, SKILL.md, README, and planning files
  "feat", // A new feature or capability
  "fix", // A bug fix
  "perf", // A code change that improves performance (caching, query optimization, etc.)
  "refactor", // Code restructuring that neither fixes a bug nor adds a feature
  "revert", // Reverts a previous commit
  "style", // Formatting, whitespace, or code structure changes with no semantic effect
  "test", // Adding or correcting unit, integration, or end-to-end tests
];

const scopes = [
  "applications", // Changes spanning multiple apps (caelundas, lexico, JimmyPaolini)
  "caelundas", // Node.js CLI for astronomical calendar generation (NASA JPL ephemeris)
  "configuration", // Workspace root config files (tsconfig, eslint, vitest, nx.json, etc.)
  "dependencies", // Dependency version changes (upgrades, additions, removals via pnpm)
  "deployments", // GitHub Actions workflows and CI/CD pipeline configuration
  "documentation", // Markdown docs, skills, planning files, and AGENTS.md files
  "infrastructure", // Helm charts, Terraform configs, and Kubernetes resources
  "JimmyPaolini", // Static GitHub profile README project (markdown and assets)
  "lexico-components", // Shared React/shadcn component library in packages/
  "lexico", // TanStack Start SSR Latin dictionary web app with Supabase backend
  "linting", // ESLint configs, rules, plugins, and lint-related tooling
  "monorepo", // Workspace root concerns (pnpm-workspace, root package.json, Nx orchestration)
  "packages", // Changes spanning multiple shared packages
  "scripts", // Shell and TypeScript scripts in scripts/ (sync, setup, utilities)
  "testing", // Vitest configuration, shared test utilities, and coverage setup
  "tools", // Nx custom generators and developer tooling in tools/
];

module.exports = { types, scopes };
