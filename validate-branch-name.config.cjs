/**
 * Branch name validation — enforces `<type>/<scope>-<description>` naming convention.
 *
 * Dynamically builds a regex from the same types & scopes defined in conventional.config.cjs
 * so branch names stay in sync with commit message conventions.
 *
 * Runs on `git push` via the `.husky/pre-push` hook.
 * See: .github/skills/checkout-branch/SKILL.md for full documentation.
 */
const { scopes, types } = require("./conventional.config.cjs");

const specialBranches = ["main"];
const automatedPrefixes = ["renovate", "dependabot"];

// Build regex pattern
const typePattern = types.join("|");
const scopePattern = scopes.join("|");
const specialPattern = specialBranches.join("|");
const automatedPattern = automatedPrefixes.map((p) => `${p}\\/.*`).join("|");

module.exports = {
  pattern: `^((${typePattern})\\/(${scopePattern})-[a-z0-9-]+|${specialPattern}|${automatedPattern})$`,
  errorMsg: `❌ Invalid branch name

✅ Required format:
  <type>/<scope>-<description>

  Example: feat/lexico-user-auth
           fix/monorepo-build-script

Special branches: ${specialBranches.join(", ")}
Automated prefixes: ${automatedPrefixes.map((p) => `${p}/*`).join(", ")}

📋 Valid types: ${types.join(", ")}
🏷️ Valid scopes: ${scopes.join(", ")}
💡 Description: lowercase with hyphens (kebab-case)
`,
};
