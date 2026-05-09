/**
 * Branch name validation — enforces `<type>/<scope>-<description>` naming convention.
 *
 * Dynamically builds a regex from the same types & scopes defined in conventional.config.cjs
 * so branch names stay in sync with commit message conventions.
 *
 * Runs on `git push` via the `.husky/pre-push` hook.
 * See: .github/skills/checkout-branch/SKILL.md for full documentation.
 */
const { scopes, types } = require("./configuration/conventional.config.cjs");
