/**
 * Orchestration service for the conventional-config sync workflow.
 */

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

import { Injectable } from "@nestjs/common";
import _ from "lodash";

import { LoggerService } from "../logger/logger.service";

import { ConventionalConfigConstantsService } from "./conventional-config-constants.service";
import { ConventionalConfigIoService } from "./conventional-config-io.service";
import { ConventionalConfigValidatorsService } from "./conventional-config-validators.service";

import type {
  ConventionalConfig,
  ReleaseConfig,
  SyncContext,
  Type,
} from "./conventional-config.types";

/**
 * Orchestrates check and write modes for conventional-config synchronization.
 */
@Injectable()
export class ConventionalConfigSynchronizationService {
  // 🏗 Dependency Injection

  constructor(
    private readonly constants: ConventionalConfigConstantsService,
    private readonly io: ConventionalConfigIoService,
    private readonly logger: LoggerService,
    private readonly validators: ConventionalConfigValidatorsService,
  ) {
    this.logger.setContext(ConventionalConfigSynchronizationService.name);
  }

  // 🔐 Private Fields

  private readonly requireFromCurrentModule = createRequire(import.meta.url);

  // 🔏 Private Methods

  /** Loads release.config.cjs as a CommonJS module. */
  private loadReleaseConfig(): ReleaseConfig {
    return this.requireFromCurrentModule(
      this.constants.releaseConfigFile,
    ) as ReleaseConfig;
  }

  /** Writes release config when commit types are missing in release rules or preset config. */
  private syncReleaseConfigIfNeeded(args: {
    sourceTypes: Type[];
    typeNames: string[];
  }): void {
    const { sourceTypes, typeNames } = args;
    const releaseConfig = this.loadReleaseConfig();
    const releaseRulesCheckTypes = typeNames.filter(
      (typeName) => !new Set(["revert"]).has(typeName),
    );
    const missingFromReleaseRules = _.difference(
      releaseRulesCheckTypes,
      this.io.getReleaseRulesTypes(releaseConfig),
    );
    const missingFromPresetTypes = _.difference(
      typeNames,
      this.io.getPresetConfigTypes(releaseConfig),
    );

    if (
      missingFromReleaseRules.length > 0 ||
      missingFromPresetTypes.length > 0
    ) {
      this.io.writeReleaseConfigSync(sourceTypes);
    }
  }

  // 🌎 Public Methods

  /**
   * Check mode: validates all configuration files are in sync with conventional.config.cjs.
   */
  handleCheckMode(context: SyncContext): void {
    const { config, scopeNames, settingsScopes, typeNames } = context;
    const settingsOk = this.validators.checkSettingsSync(
      scopeNames,
      settingsScopes,
    );
    const skillsOk = this.validators.checkAllSkillsSync(
      config,
      this.constants.skillFiles,
    );
    const templatesOk = this.validators.checkAllTemplatesSync(
      scopeNames,
      this.constants.issueTemplateFiles,
    );
    const releaseConfig = this.loadReleaseConfig();
    const releaseRulesOk = this.validators.checkReleaseRulesSync(
      typeNames,
      this.io.getReleaseRulesTypes(releaseConfig),
      "release.config.cjs",
    );
    const presetOk = this.validators.checkPresetConfigSync(
      typeNames,
      this.io.getPresetConfigTypes(releaseConfig),
      "release.config.cjs",
    );
    if (
      !settingsOk ||
      !skillsOk ||
      !templatesOk ||
      !releaseRulesOk ||
      !presetOk
    ) {
      this.logger.log(
        "💡 Run 'nx run synchronization:conventional-config:write' to sync",
      );
      process.exit(1);
    }
    this.logger.log("✅ Conventional commit config is in sync");
  }

  /**
   * Write mode: updates all out-of-sync configuration files from conventional.config.cjs.
   */
  handleWriteMode(context: SyncContext): void {
    const { config, scopeNames, settingsScopes, typeNames } = context;
    const settingsOk = this.validators.checkSettingsSync(
      scopeNames,
      settingsScopes,
    );
    const outOfSyncSkills = this.constants.skillFiles.filter(
      (skillFile) => !this.validators.checkSkillSync(config, skillFile),
    );
    const outOfSyncTemplates = this.constants.issueTemplateFiles.filter(
      (templateFile) =>
        !this.validators.checkIssueTemplateSync(scopeNames, templateFile),
    );

    if (
      settingsOk &&
      outOfSyncSkills.length === 0 &&
      outOfSyncTemplates.length === 0
    ) {
      this.logger.log("✅ Already in sync");
      return;
    }

    if (!settingsOk) {
      this.io.writeSettingsSync(config.scopes);
    }
    for (const skillFile of outOfSyncSkills) {
      this.io.writeSkillSync(config, skillFile);
    }
    for (const templateFile of outOfSyncTemplates) {
      this.io.writeIssueTemplateSync(scopeNames, templateFile);
    }
    this.syncReleaseConfigIfNeeded({ sourceTypes: config.types, typeNames });
  }

  /**
   * Loads conventional.config.cjs using require() since it's a CommonJS module.
   */
  loadConventionalConfig(): ConventionalConfig {
    return this.requireFromCurrentModule(
      this.constants.conventionalConfigFile,
    ) as ConventionalConfig;
  }

  /**
   * Runs the workflow in check or write mode.
   */
  runSynchronization(mode: string): void {
    const config = this.loadConventionalConfig();
    const context: SyncContext = {
      config,
      scopeNames: config.scopes.map((scope) => scope.name),
      settingsScopes: this.io.parseSettingsScopes(
        readFileSync(this.constants.settingsFile, "utf8"),
      ),
      typeNames: config.types.map((type) => type.name),
    };

    if (mode === "check") {
      this.handleCheckMode(context);
    } else if (mode === "write") {
      this.handleWriteMode(context);
    } else {
      this.logger.error(`❌ Invalid mode: ${mode}`);
      this.logger.error(
        "💡 Usage: nx run synchronization:conventional-config [check|write]",
      );
      process.exit(1);
    }
  }
}
