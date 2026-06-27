import path from "node:path";

import { Injectable } from "@nestjs/common";

import {
  SYNC_CONVENTIONAL_CONFIG_ISSUE_TEMPLATE_FILES,
  SYNC_CONVENTIONAL_CONFIG_SKILL_FILES,
} from "./conventional-config.constants";

/**
 * Provides workspace-relative file paths for the conventional-config sync workflow.
 * Paths are computed once at construction time using process.cwd() as the workspace root.
 */
@Injectable()
export class ConventionalConfigConstantsService {
  // 🔑 Public Fields

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
  readonly conventionalConfigFile: string;
  readonly issueTemplateFiles: string[];
  readonly releaseConfigFile: string;
  readonly settingsFile: string;
  readonly skillFiles: string[];

  // 🏗 Dependency Injection

  readonly workspaceRoot: string;
}
