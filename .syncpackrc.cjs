/**
 * Syncpack Configuration
 * Purpose: Enforce consistent dependency versions and semver range formats across all workspace packages
 * Usage (Check): pnpm exec syncpack lint
 * Usage (Fix mismatches): pnpm exec syncpack fix-mismatches
 * Usage (Fix ranges): pnpm exec syncpack set-semver-ranges
 * CI Workflow: .github/workflows/code-analysis.yml
 * @see https://jamiemason.github.io/syncpack/
 */

module.exports = {
  // Source files to analyze for dependency consistency
  source: [
    "package.json",
    "applications/*/package.json",
    "packages/*/package.json",
    "tools/*/package.json",
  ],

  // Version groups: enforce workspace protocol for internal @monorepo/* packages
  versionGroups: [
    {
      label: "Use workspace protocol for internal packages",
      packages: ["**"],
      dependencies: ["@monorepo/*"],
      dependencyTypes: ["dev", "prod"],
      pinVersion: "workspace:*",
    },
  ],

  // Semver groups: use caret (^) ranges for all external dependencies
  semverGroups: [
    {
      // pnpm.overrides use selector syntax (e.g., "package@<1.0.0": ">=1.0.0") for security patches
      // that syncpack cannot validate with standard semver ranges
      isIgnored: true,
      dependencyTypes: ["pnpmOverrides"],
      dependencies: ["**"],
      packages: ["**"],
    },
    {
      range: "^",
      dependencies: ["**"],
      packages: ["**"],
    },
  ],
};
