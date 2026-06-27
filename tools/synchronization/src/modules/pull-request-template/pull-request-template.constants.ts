// ♟️ Constants

/** Target files that embed the PR template block. */
export const SYNC_PULL_REQUEST_TEMPLATE_TARGET_FILES: string[] = [
  "documentation/skills/create-pull-request/SKILL.md",
  "documentation/skills/update-pull-request/SKILL.md",
];

/** All files managed by the pull-request-template sync workflow. */
export const SYNC_PULL_REQUEST_TEMPLATE_FILES: string[] = [
  ".github/PULL_REQUEST_TEMPLATE.md",
  ...SYNC_PULL_REQUEST_TEMPLATE_TARGET_FILES,
];
