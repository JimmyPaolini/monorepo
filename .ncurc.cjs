// npm-check-updates (ncu) configuration
// Used by the dependency-updates GitHub Actions workflow to find outdated packages.
// Docs: https://github.com/ramonak/npm-check-updates#config-file

module.exports = {
  // Check-only mode: reports outdated packages but does NOT modify package.json.
  // The CI workflow handles the upgrade + PR creation separately.
  upgrade: false,

  // Skip @types/* packages — they're managed alongside their parent packages
  // (e.g., @types/react updates when react updates) to keep versions aligned.
  reject: ["@types/*"],

  // Only suggest minor and patch updates, not major versions.
  // Major upgrades are handled manually to avoid breaking changes.
  target: "minor",

  // Scan all pnpm workspace packages (applications/*, packages/*, tools/*),
  // not just the root package.json.
  workspaces: true,

  // Also check the root package.json (shared devDependencies).
  root: true,
};
