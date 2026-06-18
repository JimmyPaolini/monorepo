/**
 * Shared file lists used by conventional-config sync scripts.
 */

export const SYNC_CONVENTIONAL_CONFIG_SKILL_FILES = [
  "documentation/skills/rename-branch/SKILL.md",
  "documentation/skills/commit-code/SKILL.md",
  "documentation/skills/checkout-branch/SKILL.md",
  "documentation/skills/create-pull-request/SKILL.md",
  ".github/skills/triage-submission/SKILL.md",
  ".github/copilot-instructions.md",
];

export const SYNC_CONVENTIONAL_CONFIG_ISSUE_TEMPLATE_FILES = [
  ".github/ISSUE_TEMPLATE/bug-report.yml",
  ".github/ISSUE_TEMPLATE/feature-request.yml",
];

export const SYNC_CONVENTIONAL_CONFIG_FILES = [
  "configuration/conventional.config.cjs",
  ".vscode/settings.json",
  ...SYNC_CONVENTIONAL_CONFIG_SKILL_FILES,
  ...SYNC_CONVENTIONAL_CONFIG_ISSUE_TEMPLATE_FILES,
  "release.config.cjs",
];
