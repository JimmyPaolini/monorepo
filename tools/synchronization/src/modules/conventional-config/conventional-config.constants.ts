import path from "node:path";

import { Injectable } from "@nestjs/common";

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

/**
 * Provides workspace-relative file paths for the conventional-config sync workflow.
 * Paths are computed once at construction time using process.cwd() as the workspace root.
 */
@Injectable()
export class ConventionalConfigConstantsService {
  // 🏗 Dependency Injection

  constructor() {
    this.workspaceRoot = process.cwd();
    this.conventionalConfigFile = path.join(
      this.workspaceRoot,
      "configuration/conventional.config.cjs",
    );
    this.settingsFile = path.join(this.workspaceRoot, ".vscode/settings.json");
    this.releaseConfigFile = path.join(
      this.workspaceRoot,
      "release.config.cjs",
    );
    this.skillFiles = SYNC_CONVENTIONAL_CONFIG_SKILL_FILES.map((file) =>
      path.join(this.workspaceRoot, file),
    );
    this.issueTemplateFiles = SYNC_CONVENTIONAL_CONFIG_ISSUE_TEMPLATE_FILES.map(
      (file) => path.join(this.workspaceRoot, file),
    );
  }

  // 🔑 Public Fields

  readonly conventionalConfigFile: string;
  readonly issueTemplateFiles: string[];
  readonly releaseConfigFile: string;
  readonly settingsFile: string;
  readonly skillFiles: string[];
  readonly workspaceRoot: string;
}
