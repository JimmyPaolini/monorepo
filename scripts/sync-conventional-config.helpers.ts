/**
 * Sync conventional commit config - Helpers and types (orchestrator module).
 *
 * This module exports all types, constants, and the main orchestrator function.
 * I/O operations are in sync-conventional-config.io.ts.
 * Validation checks are in sync-conventional-config.validators.ts.
 */

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import _ from "lodash";

import {
  SYNC_CONVENTIONAL_CONFIG_ISSUE_TEMPLATE_FILES,
  SYNC_CONVENTIONAL_CONFIG_SKILL_FILES,
} from "./sync-conventional-config.constants.js";
import {
  getPresetConfigTypes,
  getReleaseRulesTypes,
  parseSettingsScopes,
  writeIssueTemplateSync,
  writeReleaseConfigSync,
  writeSettingsSync,
  writeSkillSync,
} from "./sync-conventional-config.io.js";
import {
  checkAllSkillsSync,
  checkAllTemplatesSync,
  checkIssueTemplateSync,
  checkPresetConfigSync,
  checkReleaseRulesSync,
  checkSettingsSync,
  checkSkillSync,
} from "./sync-conventional-config.validators.js";

// 🔧 Runtime Environment & Constants

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKSPACE_ROOT = path.join(__dirname, "..");

const CONVENTIONAL_CONFIG = path.join(
  WORKSPACE_ROOT,
  "configuration/conventional.config.cjs",
);
const SETTINGS_FILE = path.join(WORKSPACE_ROOT, ".vscode/settings.json");
const SKILL_FILES = SYNC_CONVENTIONAL_CONFIG_SKILL_FILES.map((f) =>
  path.join(WORKSPACE_ROOT, f),
);
const ISSUE_TEMPLATE_FILES = SYNC_CONVENTIONAL_CONFIG_ISSUE_TEMPLATE_FILES.map(
  (f) => path.join(WORKSPACE_ROOT, f),
);
const RELEASE_CONFIG_FILE = path.join(WORKSPACE_ROOT, "release.config.cjs");
const RELEASE_RULES_EXCLUDED_TYPES = new Set(["revert"]);

// 🗄️ Type Definitions & Interfaces

/** Conventional commit configuration loaded from conventional.config.cjs. */
export interface ConventionalConfig {
  scopes: Scope[];
  types: Type[];
}

/** Entry with value and description for markdown tables. */
export interface EntryWithDescription {
  description: string;
  value: string;
}

/** Type configuration in presetConfig from release.config.cjs. */
export interface PresetConfigType {
  hidden?: boolean;
  section: string;
  type: string;
}

/** Release configuration structure from release.config.cjs. */
export interface ReleaseConfig {
  plugins: [
    [string, { releaseRules: ReleaseRule[] }],
    [string, { presetConfig: { types: PresetConfigType[] } }],
    ...unknown[],
  ];
}

/** Release rule configuration from release.config.cjs. */
export interface ReleaseRule {
  breaking?: boolean;
  release: false | string;
  revert?: boolean;
  scope?: string;
  type?: string;
}

/** Scope entry from conventional.config.cjs. */
export interface Scope {
  description: string;
  name: string;
}

/** Type entry from conventional.config.cjs. */
export interface Type {
  code: string;
  description: string;
  emoji: string;
  name: string;
}

interface SyncContext {
  config: ConventionalConfig;
  scopeNames: string[];
  settingsScopes: string[];
  typeNames: string[];
}

// 🔩 Config Loading Helpers

/**
 * Check mode: Validate that all configuration files are in sync with
 * conventional.config.cjs. Exits with code 1 if any file is out of sync.
 */
export function handleCheckMode(context: SyncContext): void {
  const { config, scopeNames, settingsScopes, typeNames } = context;
  const settingsOk = checkSettingsSync(scopeNames, settingsScopes);
  const skillsOk = checkAllSkillsSync(config);
  const templatesOk = checkAllTemplatesSync(scopeNames);
  const releaseRulesOk = checkReleaseRulesSync(
    typeNames,
    getReleaseRulesTypes(loadReleaseConfig()),
    "release.config.cjs",
  );
  const presetOk = checkPresetConfigSync(
    typeNames,
    getPresetConfigTypes(loadReleaseConfig()),
    "release.config.cjs",
  );
  if (
    !settingsOk ||
    !skillsOk ||
    !templatesOk ||
    !releaseRulesOk ||
    !presetOk
  ) {
    console.log(
      "💡 Run 'nx run monorepo:sync-conventional-config:write' to sync",
    );
    process.exit(1);
  }
  console.log("✅ Conventional commit config is in sync");
}

/**
 * Write mode: Update all out-of-sync configuration files with the latest
 * types and scopes from conventional.config.cjs.
 */
export function handleWriteMode(context: SyncContext): void {
  const { config, scopeNames, settingsScopes, typeNames } = context;
  const settingsOk = checkSettingsSync(scopeNames, settingsScopes);
  const outOfSyncSkills = SKILL_FILES.filter(
    (skillFile) => !checkSkillSync(config, skillFile),
  );
  const outOfSyncTemplates = ISSUE_TEMPLATE_FILES.filter(
    (templateFile) => !checkIssueTemplateSync(scopeNames, templateFile),
  );

  if (
    settingsOk &&
    outOfSyncSkills.length === 0 &&
    outOfSyncTemplates.length === 0
  ) {
    console.log("✅ Already in sync");
    return;
  }

  if (!settingsOk) writeSettingsSync(config.scopes);
  for (const skillFile of outOfSyncSkills) writeSkillSync(config, skillFile);
  for (const templateFile of outOfSyncTemplates)
    writeIssueTemplateSync(scopeNames, templateFile);
  syncReleaseConfigIfNeeded({ sourceTypes: config.types, typeNames });
}

// 🎫 Main Orchestrator Functions

/**
 * Load conventional.config.cjs using require() since it's a CommonJS module.
 * @returns The parsed conventional commit configuration.
 */
export function loadConventionalConfig(): ConventionalConfig {
  return require(CONVENTIONAL_CONFIG) as ConventionalConfig;
}

/**
 * Main orchestrator function. Determines whether to run in check or write mode.
 */
export function main(mode: string): void {
  const config = loadConventionalConfig();
  const context: SyncContext = {
    config,
    scopeNames: config.scopes.map((scope) => scope.name),
    settingsScopes: parseSettingsScopes(readFileSync(SETTINGS_FILE, "utf8")),
    typeNames: config.types.map((type) => type.name),
  };

  if (mode === "check") {
    handleCheckMode(context);
  } else if (mode === "write") {
    handleWriteMode(context);
  } else {
    console.error(`❌ Invalid mode: ${mode}`);
    console.error(
      "💡 Usage: tsx scripts/sync-conventional-config.ts [check|write]",
    );
    process.exit(1);
  }
}

/**
 * Load release.config.cjs using require() since it's a CommonJS module.
 * @returns The parsed release configuration.
 */
function loadReleaseConfig(): ReleaseConfig {
  return require(RELEASE_CONFIG_FILE) as ReleaseConfig;
}

/**
 * Syncs release.config.cjs when release rules or preset types are missing.
 */
function syncReleaseConfigIfNeeded(args: {
  sourceTypes: Type[];
  typeNames: string[];
}): void {
  const { sourceTypes, typeNames } = args;
  const releaseConfig = loadReleaseConfig();
  const releaseRulesCheckTypes = typeNames.filter(
    (typeName) => !RELEASE_RULES_EXCLUDED_TYPES.has(typeName),
  );
  const missingFromReleaseRules = _.difference(
    releaseRulesCheckTypes,
    getReleaseRulesTypes(releaseConfig),
  );
  const missingFromPresetTypes = _.difference(
    typeNames,
    getPresetConfigTypes(releaseConfig),
  );

  if (missingFromReleaseRules.length > 0 || missingFromPresetTypes.length > 0) {
    writeReleaseConfigSync(sourceTypes);
  }
}
