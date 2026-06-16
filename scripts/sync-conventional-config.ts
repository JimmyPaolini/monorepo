#!/usr/bin/env tsx

/**
 * Sync conventional commit config from conventional.config.cjs into:
 * - .vscode/settings.json (scopes array)
 * - documentation/skills/commit-code/SKILL.md (types and scopes tables)
 * - documentation/skills/checkout-branch/SKILL.md (types and scopes tables)
 * - documentation/skills/create-pull-request/SKILL.md (types and scopes tables)
 * - .github/prompts/submit-changes.prompt.md (types and scopes tables)
 * - .github/ISSUE_TEMPLATE/bug-report.yml (scopes dropdown)
 * - .github/ISSUE_TEMPLATE/feature-request.yml (scopes dropdown)
 * - release.config.cjs (releaseRules and presetConfig.types arrays)
 *
 * Usage: tsx scripts/sync-conventional-config.ts [check|write]
 *   check (default): Validate that targets are in sync, exit 1 if not
 *   write: Update targets from conventional.config.cjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import JSON5 from "json5";
import _ from "lodash";

// ════════════════════════════════════════════════════════════════════════════
// RUNTIME ENVIRONMENT & CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKSPACE_ROOT = path.join(__dirname, "..");

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
const MODE = process.argv[2] || "check";

/**
 * Types that are handled via special properties in releaseRules (not `type:`),
 * so they are excluded from the releaseRules type-coverage check.
 */
const RELEASE_RULES_SPECIAL_TYPES = new Set(["revert"]);

// ════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS & INTERFACES
// ════════════════════════════════════════════════════════════════════════════

/** Conventional commit configuration loaded from conventional.config.cjs. */
interface ConventionalConfig {
  scopes: Scope[];
  types: Type[];
}

/** Entry with value and description for markdown tables. */
interface EntryWithDescription {
  description: string;
  value: string;
}

/** Type configuration in presetConfig from release.config.cjs. */
interface PresetConfigType {
  hidden?: boolean;
  section: string;
  type: string;
}

/** Release configuration structure from release.config.cjs. */
interface ReleaseConfig {
  plugins: [
    [string, { releaseRules: ReleaseRule[] }],
    [string, { presetConfig: { types: PresetConfigType[] } }],
    ...unknown[],
  ];
}

/** Release rule configuration from release.config.cjs. */
interface ReleaseRule {
  breaking?: boolean;
  release: false | string;
  revert?: boolean;
  scope?: string;
  type?: string;
}

/** Scope entry from conventional.config.cjs. */
interface Scope {
  description: string;
  name: string;
}

/** Type entry from conventional.config.cjs. */
interface Type {
  code: string;
  description: string;
  emoji: string;
  name: string;
}

// ════════════════════════════════════════════════════════════════════════════
// CONFIG LOADING HELPERS
// ════════════════════════════════════════════════════════════════════════════

const capitalize = (s: string): string =>
  s.charAt(0).toUpperCase() + s.slice(1);

function appendToPresetTypes(
  content: string,
  missingTypes: string[],
  sourceTypes: Type[],
): string {
  if (missingTypes.length === 0) return content;
  const newEntries = missingTypes
    .map((t) => {
      const entry = sourceTypes.find((s) => s.name === t);
      const desc = entry
        ? ` // ${entry.description}`
        : " // ⚠️ Added by sync — add description";
      return `            { type: "${t}", section: "⚠️ ${capitalize(t)}", hidden: true },${desc}`;
    })
    .join("\n");
  return content.replace(
    /(presetConfig:\s*\{[\s\S]*?types:\s*\[[\s\S]*?)(\s*\],\s*\})/,
    `$1\n${newEntries}$2`,
  );
}

/**
 * Update release.config.cjs with missing types in releaseRules and presetConfig.types.
 * Appends new entries with placeholder configurations and comments.
 * @param sourceTypes - Type objects from conventional.config.cjs
 */
function appendToReleaseRules(content: string, missingTypes: string[]): string {
  if (missingTypes.length === 0) return content;
  const newEntries = missingTypes
    .map(
      (t) =>
        `          { type: "${t}", release: false }, // ⚠️ Added by sync — set appropriate release level`,
    )
    .join("\n");
  return content.replace(
    /(releaseRules:\s*\[[\s\S]*?)(\s*\],)/,
    `$1\n${newEntries}$2`,
  );
}

/**
 * Main orchestrator function. Determines whether to run in check or write mode.
 *
 * Check mode: Validates that all configuration files are in sync with
 * conventional.config.cjs. Exits with code 1 if any file is out of sync.
 *
 * Write mode: Updates all out-of-sync configuration files with the latest
 * types and scopes from conventional.config.cjs.
 */
function checkAllSkillsSync(
  config: ReturnType<typeof loadConventionalConfig>,
): boolean {
  let skillsOk = true;
  for (const skillFile of SKILL_FILES) {
    if (!checkSkillSync(config, skillFile)) skillsOk = false;
  }
  return skillsOk;
}

function checkAllTemplatesSync(scopeNames: string[]): boolean {
  let templatesOk = true;
  for (const templateFile of ISSUE_TEMPLATE_FILES) {
    if (!checkIssueTemplateSync(scopeNames, templateFile)) templatesOk = false;
  }
  return templatesOk;
}

// ════════════════════════════════════════════════════════════════════════════
// SETTINGS.JSON UTILITIES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Validate that an issue template YAML file has up-to-date scope dropdown options.
 * Checks both values and ordering.
 * @param sourceScopes - Expected scope names from conventional.config.cjs
 * @param templateFile - Path to the issue template YAML file
 * @returns True if in sync, false otherwise
 */
function checkIssueTemplateSync(
  sourceScopes: string[],
  templateFile: string,
): boolean {
  const templateName = path.relative(WORKSPACE_ROOT, templateFile);
  const templateContent = readFileSync(templateFile, "utf8");
  const templateScopes = parseIssueTemplateScopes(templateContent);
  if (templateScopes.length === 0) {
    console.log(
      `❌ ${templateName} missing <!-- scopes-start/end --> markers\n`,
    );
    return false;
  }
  const sortedSource = _.sortBy([...sourceScopes]);
  const sortedTemplate = _.sortBy([...templateScopes]);
  if (!_.isEqual(sortedSource, sortedTemplate)) {
    console.log(`❌ ${templateName} scopes dropdown is out of sync\n`);
    showDifference(sourceScopes, templateScopes, templateName);
    return false;
  }
  if (!_.isEqual(sourceScopes, templateScopes)) {
    console.log(
      `🔀 ${templateName} scopes have matching values but different ordering\n`,
    );
    return false;
  }
  return true;
}

/**
 * Validate that a skill markdown file contains up-to-date types and scopes tables.
 * Checks both values and ordering.
 * @param config - The conventional commit configuration
 * @param skillFile - Path to the skill markdown file
 * @returns True if in sync, false otherwise
 */
function checkMarkerSync(
  config: ConventionalConfig,
  skillName: string,
  skillContent: string,
  marker: "scopes" | "types",
): boolean {
  const markerContent = extractMarkerContent(skillContent, marker);
  if (!markerContent) {
    console.log(
      `❌ ${skillName} missing <!-- ${marker}-start/end --> markers\n`,
    );
    return false;
  }
  const skillValues = parseMarkdownTableValues(markerContent);
  const sourceValues: string[] =
    marker === "types"
      ? config.types.map((type) => type.name)
      : config.scopes.map((scope) => scope.name);
  const sortedSource = _.sortBy([...sourceValues]);
  const sortedSkill = _.sortBy([...skillValues]);
  if (!_.isEqual(sortedSource, sortedSkill)) {
    console.log(`❌ ${skillName} ${marker} table is out of sync\n`);
    showDifference(sourceValues, skillValues, skillName);
    return false;
  }
  if (!_.isEqual(sourceValues, skillValues)) {
    console.log(
      `🔀 ${skillName} ${marker} have matching values but different ordering\n`,
    );
    return false;
  }
  return true;
}

function checkPresetConfigSync(
  sourceTypes: string[],
  presetConfigTypes: string[],
  relativeFile: string,
): boolean {
  const missingFromPresetTypes = _.difference(sourceTypes, presetConfigTypes);
  if (missingFromPresetTypes.length > 0) {
    console.log(`❌ ${relativeFile} presetConfig.types is missing types:\n`);
    missingFromPresetTypes.forEach((t) => console.log(`    + ${t}`));
    console.log("");
    return false;
  }
  return true;
}

function checkReleaseConfigSync(sourceTypes: string[]): boolean {
  const releaseConfig = loadReleaseConfig();
  const releaseRulesTypes = getReleaseRulesTypes(releaseConfig);
  const presetConfigTypes = getPresetConfigTypes(releaseConfig);
  const relativeFile = path.relative(WORKSPACE_ROOT, RELEASE_CONFIG_FILE);
  const rulesOk = checkReleaseRulesSync(
    sourceTypes,
    releaseRulesTypes,
    relativeFile,
  );
  const presetOk = checkPresetConfigSync(
    sourceTypes,
    presetConfigTypes,
    relativeFile,
  );
  return rulesOk && presetOk;
}

/**
 * Validate that release.config.cjs releaseRules and presetConfig.types
 * contain all types from the conventional configuration.
 * @param sourceTypes - Type names from conventional.config.cjs
 * @returns True if in sync, false otherwise
 */
function checkReleaseRulesSync(
  sourceTypes: string[],
  releaseRulesTypes: string[],
  relativeFile: string,
): boolean {
  const releaseRulesCheckTypes = sourceTypes.filter(
    (t) => !RELEASE_RULES_SPECIAL_TYPES.has(t),
  );
  const missingFromReleaseRules = _.difference(
    releaseRulesCheckTypes,
    releaseRulesTypes,
  );
  if (missingFromReleaseRules.length > 0) {
    console.log(`❌ ${relativeFile} releaseRules is missing types:\n`);
    missingFromReleaseRules.forEach((t) => console.log(`    + ${t}`));
    console.log("");
    return false;
  }
  return true;
}

// ════════════════════════════════════════════════════════════════════════════
// SKILL.MD UTILITIES (Markdown Documentation)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Validate that settings.json scopes match the source configuration.
 * Checks both values and ordering.
 * @param sourceScopes - Expected scope names from conventional.config.cjs
 * @param settingsScopes - Actual scope names from settings.json
 * @returns True if in sync, false otherwise
 */
function checkSettingsSync(
  sourceScopes: string[],
  settingsScopes: string[],
): boolean {
  const sortedSource = _.sortBy([...sourceScopes]);
  const sortedTarget = _.sortBy([...settingsScopes]);
  const valuesMatch = _.isEqual(sortedSource, sortedTarget);
  const orderMatches = _.isEqual(sourceScopes, settingsScopes);

  if (!valuesMatch || !orderMatches) {
    console.log("❌ settings.json scopes are out of sync\n");
    if (!valuesMatch) {
      console.log("📋 Differences:");
      showDifference(sourceScopes, settingsScopes, "settings.json");
      console.log("");
    }
    if (valuesMatch && !orderMatches) {
      console.log("🔀 Scopes have matching values but different ordering\n");
    }
    return false;
  }
  return true;
}

function checkSkillSync(
  config: ConventionalConfig,
  skillFile: string,
): boolean {
  const skillName = path.relative(WORKSPACE_ROOT, skillFile);
  const skillContent = readFileSync(skillFile, "utf8");
  let inSync = true;
  for (const marker of ["types", "scopes"] as const) {
    if (!checkMarkerSync(config, skillName, skillContent, marker)) {
      inSync = false;
    }
  }
  return inSync;
}

/**
 * Extract content between marker comments in a file.
 * Markers are HTML comments like `<!-- types-start -->` and `<!-- types-end -->`.
 * @param content - The file content to search
 * @param markerName - The marker name (e.g., "types", "scopes")
 * @returns The content between markers, or undefined if markers not found
 */
function extractMarkerContent(
  content: string,
  markerName: string,
): string | undefined {
  const pattern = new RegExp(
    String.raw`<!-- ${markerName}-start -->\n([\s\S]*?)<!-- ${markerName}-end -->`,
  );
  const match = pattern.exec(content);
  return match?.[1];
}

// ════════════════════════════════════════════════════════════════════════════
// RELEASE CONFIG UTILITIES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Generate the conventionalCommits.scopes array block for settings.json (JSONC).
 * Each entry is formatted as `    "name", // description` (4-space indent).
 * The last entry has no trailing comma (required for valid JSON).
 * @param scopes - Array of scope objects
 * @returns Formatted JSONC string for the scopes array
 */
function formatScopesForSettings(scopes: Scope[]): string {
  return scopes
    .map((scope, index) => {
      const comma = index < scopes.length - 1 ? "," : "";
      return `    "${scope.name}"${comma} // ${scope.description}`;
    })
    .join("\n");
}

/**
 * Generate a markdown table from entries with descriptions.
 * Each entry is formatted as a table row with backtick-escaped values.
 * @param entries - Array of entries with value and description
 * @param header - Header configuration with column titles
 * @returns Formatted markdown table string
 */
function generateMarkdownTable(
  entries: EntryWithDescription[],
  header: { column1: string; column2: string },
): string {
  const lines = [
    `| ${header.column1} | ${header.column2} |`,
    `| ${"-".repeat(header.column1.length)} | ${"-".repeat(header.column2.length)} |`,
  ];
  for (const entry of entries) {
    lines.push(`| \`${entry.value}\` | ${entry.description} |`);
  }
  return lines.join("\n");
}

/**
 * Generate a YAML dropdown options block from scope values.
 * Returns indented lines like `        - caelundas` (8-space indent).
 * @param scopes - Array of scope names
 * @returns Formatted YAML options string
 */
function generateYamlScopeOptions(scopes: string[]): string {
  return scopes.map((scope) => `        - ${scope}`).join("\n");
}

/**
 * Extract type names from the presetConfig.types array in release.config.cjs.
 * @param config - The release configuration
 * @returns Array of type names found in presetConfig.types
 */
function getPresetConfigTypes(config: ReleaseConfig): string[] {
  return config.plugins[1][1].presetConfig.types.map((t) => t.type);
}

/**
 * Extract type names from the releaseRules array in release.config.cjs.
 * Filters out undefined type values.
 * @param config - The release configuration
 * @returns Array of type names found in releaseRules
 */
function getReleaseRulesTypes(config: ReleaseConfig): string[] {
  return config.plugins[0][1].releaseRules
    .map((r) => r.type)
    .filter((t): t is string => t !== undefined);
}

function handleCheckMode(
  config: ReturnType<typeof loadConventionalConfig>,
  scopeNames: string[],
  typeNames: string[],
  settingsScopes: string[],
): void {
  const settingsOk = checkSettingsSync(scopeNames, settingsScopes);
  const skillsOk = checkAllSkillsSync(config);
  const templatesOk = checkAllTemplatesSync(scopeNames);
  const releaseConfigOk = checkReleaseConfigSync(typeNames);
  if (!settingsOk || !skillsOk || !templatesOk || !releaseConfigOk) {
    console.log(
      "💡 Run 'nx run monorepo:sync-conventional-config:write' to sync",
    );
    process.exit(1);
  }
  console.log("✅ Conventional commit config is in sync");
}

function handleWriteMode(
  config: ReturnType<typeof loadConventionalConfig>,
  scopeNames: string[],
  typeNames: string[],
  settingsScopes: string[],
): void {
  const settingsOk = checkSettingsSync(scopeNames, settingsScopes);
  const outOfSyncSkills = SKILL_FILES.filter(
    (skillFile) => !checkSkillSync(config, skillFile),
  );
  const outOfSyncTemplates = ISSUE_TEMPLATE_FILES.filter(
    (templateFile) => !checkIssueTemplateSync(scopeNames, templateFile),
  );
  const releaseConfigOk = checkReleaseConfigSync(typeNames);

  if (
    settingsOk &&
    outOfSyncSkills.length === 0 &&
    outOfSyncTemplates.length === 0 &&
    releaseConfigOk
  ) {
    console.log("✅ Already in sync");
    return;
  }
  writeConventionalConfig({
    config,
    outOfSyncSkills,
    outOfSyncTemplates,
    releaseConfigOk,
    scopeNames,
    settingsOk,
  });
}

/**
 * Load conventional.config.cjs using require() since it's a CommonJS module.
 * @returns The parsed conventional commit configuration.
 */
function loadConventionalConfig(): ConventionalConfig {
  return require(CONVENTIONAL_CONFIG) as ConventionalConfig;
}

// ════════════════════════════════════════════════════════════════════════════
// ISSUE TEMPLATE UTILITIES (YAML Configuration)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Load release.config.cjs using require() since it's a CommonJS module.
 * @returns The parsed release configuration.
 */
function loadReleaseConfig(): ReleaseConfig {
  return require(RELEASE_CONFIG_FILE) as ReleaseConfig;
}

function main(): void {
  const config = loadConventionalConfig();
  const scopeNames = config.scopes.map((scope) => scope.name);
  const typeNames = config.types.map((type) => type.name);
  const settingsContent = readFileSync(SETTINGS_FILE, "utf8");
  const settingsScopes = parseSettingsScopes(settingsContent);

  if (MODE === "check") {
    handleCheckMode(config, scopeNames, typeNames, settingsScopes);
  } else if (MODE === "write") {
    handleWriteMode(config, scopeNames, typeNames, settingsScopes);
  } else {
    console.error(`❌ Invalid mode: ${MODE}`);
    console.error(
      "💡 Usage: tsx scripts/sync-conventional-config.ts [check|write]",
    );
    process.exit(1);
  }
}

/**
 * Parse scope options from an issue template YAML file.
 * Extracts content between `# <!-- scopes-start -->` and `# <!-- scopes-end -->` markers.
 * @param content - The raw content of the issue template file
 * @returns Array of scope names found in the YAML
 */
function parseIssueTemplateScopes(content: string): string[] {
  const pattern =
    /# <!-- scopes-start -->\n[\s\S]*?options:\n([\s\S]*?)\n\s*validations:[\s\S]*?# <!-- scopes-end -->/;
  const match = pattern.exec(content);
  if (!match?.[1]) return [];

  const scopes: string[] = [];
  for (const line of match[1].split("\n")) {
    const scopeMatch = /^\s{8}-\s+(.+)$/.exec(line);
    if (scopeMatch?.[1]) {
      scopes.push(scopeMatch[1]);
    }
  }
  return scopes;
}

/**
 * Parse values from a markdown table (first column, backtick-wrapped).
 * Extracts all backtick-wrapped values from the first column of a markdown table.
 * @param tableContent - The markdown table content
 * @returns Array of values from the first column
 */
function parseMarkdownTableValues(tableContent: string): string[] {
  const values: string[] = [];
  for (const line of tableContent.split("\n")) {
    const match = /^\|\s*`([^`]+)`\s*\|/.exec(line);
    if (match?.[1]) {
      values.push(match[1]);
    }
  }
  return values;
}

// ════════════════════════════════════════════════════════════════════════════
// MARKER & COMPARISON UTILITIES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Parse the settings.json (JSONC) file and extract the conventionalCommits.scopes array.
 * @param content - The raw content of settings.json
 * @returns Array of scope names
 * @throws TypeError If the scopes array is not found
 */
function parseSettingsScopes(content: string): string[] {
  const settings = JSON5.parse<Record<string, unknown>>(content);
  const scopes = settings["conventionalCommits.scopes"];
  if (!Array.isArray(scopes)) {
    throw new TypeError(
      'Could not find "conventionalCommits.scopes" array in settings.json',
    );
  }
  return scopes as string[];
}

/**
 * Replace content between marker comments, preserving the markers themselves.
 * @param content - The file content to modify
 * @param markerName - The marker name (e.g., "types", "scopes")
 * @param newContent - The new content to insert between markers
 * @returns The updated file content
 */
function replaceMarkerContent(
  content: string,
  markerName: string,
  newContent: string,
): string {
  const pattern = new RegExp(
    String.raw`(<!-- ${markerName}-start -->\n)[\s\S]*?(<!-- ${markerName}-end -->)`,
  );
  return content.replace(pattern, `$1\n${newContent}\n\n$2`);
}

/**
 * Display the differences between two arrays in a human-readable format.
 * Shows missing and extra items with clear indicators.
 * @param source - The expected array
 * @param target - The actual array
 * @param targetName - Display name for the target (for messages)
 */
function showDifference(
  source: string[],
  target: string[],
  targetName: string,
): void {
  const missing = _.difference(source, target);
  const extra = _.difference(target, source);

  if (missing.length > 0) {
    console.log(`  Missing in ${targetName} (${missing.length} items):`);
    missing.forEach((item) => console.log(`    + ${item}`));
  }
  if (extra.length > 0) {
    console.log(`  Extra in ${targetName} (${extra.length} items):`);
    extra.forEach((item) => console.log(`    - ${item}`));
  }
}

function writeConventionalConfig({
  config,
  outOfSyncSkills,
  outOfSyncTemplates,
  releaseConfigOk,
  scopeNames,
  settingsOk,
}: {
  config: ReturnType<typeof loadConventionalConfig>;
  outOfSyncSkills: string[];
  outOfSyncTemplates: string[];
  releaseConfigOk: boolean;
  scopeNames: string[];
  settingsOk: boolean;
}): void {
  if (!settingsOk) writeSettingsSync(config.scopes);
  for (const skillFile of outOfSyncSkills) writeSkillSync(config, skillFile);
  for (const templateFile of outOfSyncTemplates)
    writeIssueTemplateSync(scopeNames, templateFile);
  if (!releaseConfigOk) writeReleaseConfigSync(config.types);
}

/**
 * Update an issue template YAML file with the latest scope dropdown options.
 * Replaces content between marker comments while preserving the markers.
 * @param sourceScopes - Scope names to write
 * @param templateFile - Path to the issue template YAML file
 */
function writeIssueTemplateSync(
  sourceScopes: string[],
  templateFile: string,
): void {
  const templateName = path.relative(WORKSPACE_ROOT, templateFile);
  console.log(`🔄 Syncing ${templateName} scopes dropdown...`);
  const templateContent = readFileSync(templateFile, "utf8");
  const scopeOptions = generateYamlScopeOptions(sourceScopes);

  const pattern =
    /(# <!-- scopes-start -->\n[\s\S]*?options:\n)[\s\S]*?(\s*validations:[\s\S]*?# <!-- scopes-end -->)/;
  const match = pattern.exec(templateContent);
  if (!match) {
    throw new Error(`Could not find scopes markers in ${templateName}`);
  }

  const updatedContent = templateContent.replace(
    pattern,
    `$1${scopeOptions}\n$2`,
  );

  writeFileSync(templateFile, updatedContent, "utf8");
  console.log(`✅ ${templateName} scopes synced`);
}

function writeReleaseConfigSync(sourceTypes: Type[]): void {
  const relativeFile = path.relative(WORKSPACE_ROOT, RELEASE_CONFIG_FILE);
  console.log(`🔄 Syncing ${relativeFile} types...`);
  const releaseConfig = loadReleaseConfig();
  const sourceTypeNames = sourceTypes.map((t) => t.name);
  const releaseRulesCheckTypes = sourceTypeNames.filter(
    (t) => !RELEASE_RULES_SPECIAL_TYPES.has(t),
  );
  const missingFromReleaseRules = _.difference(
    releaseRulesCheckTypes,
    getReleaseRulesTypes(releaseConfig),
  );
  const missingFromPresetTypes = _.difference(
    sourceTypeNames,
    getPresetConfigTypes(releaseConfig),
  );
  let content = readFileSync(RELEASE_CONFIG_FILE, "utf8");
  content = appendToReleaseRules(content, missingFromReleaseRules);
  content = appendToPresetTypes(content, missingFromPresetTypes, sourceTypes);
  writeFileSync(RELEASE_CONFIG_FILE, content, "utf8");
  console.log(`✅ ${relativeFile} types synced`);
}

/**
 * Update settings.json with the latest scope configuration.
 * @param scopes - Array of scopes to write
 */
function writeSettingsSync(scopes: Scope[]): void {
  console.log("🔄 Syncing settings.json scopes...");
  const settingsContent = readFileSync(SETTINGS_FILE, "utf8");
  const formattedBlock = formatScopesForSettings(scopes);

  const scopesPattern =
    /("conventionalCommits\.scopes":\s*\[)([\s\S]*?)(\s*\])/;
  const match = scopesPattern.exec(settingsContent);
  if (!match) {
    throw new Error(
      'Could not find "conventionalCommits.scopes" array in settings.json',
    );
  }

  const updatedContent = settingsContent.replace(
    scopesPattern,
    `$1\n${formattedBlock}\n  ]`,
  );

  writeFileSync(SETTINGS_FILE, updatedContent, "utf8");
  console.log("✅ settings.json scopes synced");
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// ════════════════════════════════════════════════════════════════════════════

/**
 * Update a skill markdown file with the latest types and scopes tables.
 * Replaces content between marker comments while preserving the markers.
 * @param config - The conventional commit configuration
 * @param skillFile - Path to the skill markdown file
 */
function writeSkillSync(config: ConventionalConfig, skillFile: string): void {
  const skillName = path.relative(WORKSPACE_ROOT, skillFile);
  console.log(`🔄 Syncing ${skillName} types and scopes...`);
  let skillContent = readFileSync(skillFile, "utf8");

  const typesEntries: EntryWithDescription[] = config.types.map((type) => ({
    description: type.description,
    value: type.name,
  }));
  const scopesEntries: EntryWithDescription[] = config.scopes.map((scope) => ({
    description: scope.description,
    value: scope.name,
  }));

  const typesTable = generateMarkdownTable(typesEntries, {
    column1: "Type",
    column2: "Description",
  });
  const scopesTable = generateMarkdownTable(scopesEntries, {
    column1: "Scope",
    column2: "Description",
  });

  skillContent = replaceMarkerContent(skillContent, "types", typesTable);
  skillContent = replaceMarkerContent(skillContent, "scopes", scopesTable);

  writeFileSync(skillFile, skillContent, "utf8");
  console.log(`✅ ${skillName} types and scopes synced`);
}

if (process.argv[1]?.endsWith("sync-conventional-config.ts")) {
  main();
}
