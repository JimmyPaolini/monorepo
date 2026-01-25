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
  "build", // Changes that affect the build system or external dependencies
  "chore", // Other changes that don't modify src or test files
  "ci", // Changes to CI configuration files and scripts
  "docs", // Documentation only changes
  "feat", // A new feature
  "fix", // A bug fix
  "perf", // A code change that improves performance
  "refactor", // A code change that neither fixes a bug nor adds a feature
  "revert", // Reverts a previous commit
  "style", // Changes that do not affect the meaning of the code
  "test", // Adding missing tests or correcting existing tests
];

const scopes = [
  // 🕋 Root
  "monorepo", // Workspace root
  "applications", // All applications
  "packages", // All packages
  "tools", // Build or development tooling
  // 🏢 Projects
  "caelundas", // Caelundas application
  "lexico", // Lexico application
  "lexico-components", // Lexico components package
  "JimmyPaolini", // JimmyPaolini application
  // 🗑️ Other
  "documentation", // Documentation
  "dependencies", // Dependency updates
  "infrastructure", // Infrastructure changes
  "deployments", // CI/CD workflows
  "testing", // Testing-related changes
  "linting", // Linting-related changes
  "scripts", // Build or dev scripts
  "configuration", // Config files
];

module.exports = { types, scopes };
