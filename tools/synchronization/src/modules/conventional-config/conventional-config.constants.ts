// ♟️ Constants

/** Skill files that contain type and scope markdown tables. */
export const SYNC_CONVENTIONAL_CONFIG_SKILL_FILES = [
  "documentation/skills/rename-branch/SKILL.md",
  "documentation/skills/commit-code/SKILL.md",
  "documentation/skills/checkout-branch/SKILL.md",
  "documentation/skills/create-worktree/SKILL.md",
  "documentation/skills/create-pull-request/SKILL.md",
  ".github/skills/triage-submission/SKILL.md",
  ".github/copilot-instructions.md",
];

/** Issue template files that contain scope dropdowns. */
export const SYNC_CONVENTIONAL_CONFIG_ISSUE_TEMPLATE_FILES = [
  ".github/ISSUE_TEMPLATE/bug-report.yml",
  ".github/ISSUE_TEMPLATE/feature-request.yml",
];

/** All files managed by the conventional-config sync workflow. */
export const SYNC_CONVENTIONAL_CONFIG_FILES = [
  "configuration/conventional.config.cjs",
  ".vscode/settings.json",
  ...SYNC_CONVENTIONAL_CONFIG_SKILL_FILES,
  ...SYNC_CONVENTIONAL_CONFIG_ISSUE_TEMPLATE_FILES,
  "release.config.cjs",
];

/** Commit types excluded from release rules presence validation. */
export const RELEASE_RULES_SPECIAL_TYPES = new Set(["revert"]);
