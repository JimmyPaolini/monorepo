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

import type { Scope, Type } from "../conventional.config.d.cts";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKSPACE_ROOT = path.join(__dirname, "..");
const CONVENTIONAL_CONFIG = path.join(
  WORKSPACE_ROOT,
  "conventional.config.cjs",
);
const SETTINGS_FILE = path.join(WORKSPACE_ROOT, ".vscode/settings.json");
const SKILL_FILES = [
  path.join(WORKSPACE_ROOT, "documentation/skills/commit-code/SKILL.md"),
  path.join(WORKSPACE_ROOT, "documentation/skills/checkout-branch/SKILL.md"),
  path.join(
    WORKSPACE_ROOT,
    "documentation/skills/create-pull-request/SKILL.md",
  ),
  path.join(WORKSPACE_ROOT, ".github/prompts/submit-changes.prompt.md"),
];
const ISSUE_TEMPLATE_FILES = [
  path.join(WORKSPACE_ROOT, ".github/ISSUE_TEMPLATE/bug-report.yml"),
  path.join(WORKSPACE_ROOT, ".github/ISSUE_TEMPLATE/feature-request.yml"),
];
const RELEASE_CONFIG_FILE = path.join(WORKSPACE_ROOT, "release.config.cjs");
const MODE = process.argv[2] || "check";

/**
 * Types that are handled via special properties in releaseRules (not `type:`),
 * so they are excluded from the releaseRules type-coverage check.
 */
const RELEASE_RULES_SPECIAL_TYPES = new Set(["revert"]);

interface EntryWithDescription {
  value: string;
  description: string;
}

interface ReleaseRule {
  type?: string;
  breaking?: boolean;
  revert?: boolean;
  scope?: string;
  release: string | false;
}

interface PresetConfigType {
  type: string;
  section: string;
  hidden?: boolean;
}

interface ReleaseConfig {
  plugins: [
    [string, { releaseRules: ReleaseRule[] }],
    [string, { presetConfig: { types: PresetConfigType[] } }],
    ...unknown[],
  ];
}

interface ConventionalConfig {
  types: Type[];
  scopes: Scope[];
}

// ─── Config Loading ──────────────────────────────────────────────────────────

/**
 * Load conventional.config.cjs using require() since it's a CommonJS module.
 */
function loadConventionalConfig(): ConventionalConfig {
  return require(CONVENTIONAL_CONFIG) as ConventionalConfig;
}

// ─── Settings.json Sync ─────────────────────────────────────────────────────

/**
 * Parse the settings.json (JSONC) and extract the conventionalCommits.scopes array.
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
 * Generate the conventionalCommits.scopes array block for settings.json (JSONC).
 * Produces lines like `    "caelundas", // Description` (4-space indent).
 * The last entry has no trailing comma (required for valid JSON).
 */
function formatScopesForSettings(scopes: Scope[]): string {
  return scopes
    .map((scope, i) => {
      const comma = i < scopes.length - 1 ? "," : "";
      return `    "${scope.name}"${comma} // ${scope.description}`;
    })
    .join("\n");
}

// ─── SKILL.md Sync ─────────────────────────────────────────────────────────

/**
 * Generate a markdown table from entries with descriptions.
 */
function generateMarkdownTable(
  entries: EntryWithDescription[],
  header: { col1: string; col2: string },
): string {
  const lines = [
    `| ${header.col1} | ${header.col2} |`,
    `| ${"-".repeat(header.col1.length)} | ${"-".repeat(header.col2.length)} |`,
  ];
  for (const entry of entries) {
    lines.push(`| \`${entry.value}\` | ${entry.description} |`);
  }
  return lines.join("\n");
}

// ─── release.config.cjs Sync ──────────────────────────────────────────────

/**
 * Load release.config.cjs using require() since it's a CommonJS module.
 */
function loadReleaseConfig(): ReleaseConfig {
  return require(RELEASE_CONFIG_FILE) as ReleaseConfig;
}

function getReleaseRulesTypes(config: ReleaseConfig): string[] {
  return config.plugins[0][1].releaseRules
    .map((r) => r.type)
    .filter((t): t is string => t !== undefined);
}

function getPresetConfigTypes(config: ReleaseConfig): string[] {
  return config.plugins[1][1].presetConfig.types.map((t) => t.type);
}

// ─── Issue Template Sync ────────────────────────────────────────────────────

/**
 * Generate a YAML dropdown options block from scope values.
 * Returns indented lines like `        - caelundas`.
 */
function generateYamlScopeOptions(scopes: string[]): string {
  return scopes.map((scope) => `        - ${scope}`).join("\n");
}

/**
 * Extract scope options from an issue template YAML file.
 * Looks for content between `# <!-- scopes-start -->` and `# <!-- scopes-end -->` markers.
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
 * Extract content between marker comments in a file.
 * Markers are HTML comments like `<!-- types-start -->` and `<!-- types-end -->`.
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

/**
 * Replace content between marker comments, preserving the markers.
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
 * Parse values from a markdown table (first column, backtick-wrapped).
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

// ─── Check / Write Logic ───────────────────────────────────────────────────

function checkReleaseConfigSync(sourceTypes: string[]): boolean {
  const releaseConfig = loadReleaseConfig();
  const releaseRulesTypes = getReleaseRulesTypes(releaseConfig);
  const presetConfigTypes = getPresetConfigTypes(releaseConfig);
  const relativeFile = path.relative(WORKSPACE_ROOT, RELEASE_CONFIG_FILE);
  let inSync = true;

  // Exclude types handled by special releaseRules keys (e.g. `{ revert: true }`)
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
    inSync = false;
  }

  const missingFromPresetTypes = _.difference(sourceTypes, presetConfigTypes);
  if (missingFromPresetTypes.length > 0) {
    console.log(`❌ ${relativeFile} presetConfig.types is missing types:\n`);
    missingFromPresetTypes.forEach((t) => console.log(`    + ${t}`));
    console.log("");
    inSync = false;
  }

  return inSync;
}

function writeReleaseConfigSync(sourceTypes: Type[]): void {
  const relativeFile = path.relative(WORKSPACE_ROOT, RELEASE_CONFIG_FILE);
  console.log(`🔄 Syncing ${relativeFile} types...`);

  const releaseConfig = loadReleaseConfig();
  const releaseRulesCheckTypes = sourceTypes
    .map((sourceType) => sourceType.name)
    .filter((sourceType) => !RELEASE_RULES_SPECIAL_TYPES.has(sourceType));
  const missingFromReleaseRules = _.difference(
    releaseRulesCheckTypes,
    getReleaseRulesTypes(releaseConfig),
  );
  const missingFromPresetTypes = _.difference(
    sourceTypes.map((t) => t.name),
    getPresetConfigTypes(releaseConfig),
  );

  let content = readFileSync(RELEASE_CONFIG_FILE, "utf8");

  if (missingFromReleaseRules.length > 0) {
    const newEntries = missingFromReleaseRules
      .map(
        (sourceType) =>
          `          { type: "${sourceType}", release: false }, // ⚠️ Added by sync — set appropriate release level`,
      )
      .join("\n");
    content = content.replace(
      /(releaseRules:\s*\[[\s\S]*?)(\s*\],)/,
      `$1\n${newEntries}$2`,
    );
  }

  if (missingFromPresetTypes.length > 0) {
    const capitalize = (s: string): string =>
      s.charAt(0).toUpperCase() + s.slice(1);
    const newEntries = missingFromPresetTypes
      .map((missingFromPresetType) => {
        const entry = sourceTypes.find(
          (sourceType) => sourceType.name === missingFromPresetType,
        );
        const description = entry
          ? ` // ${entry.description}`
          : " // ⚠️ Added by sync — add description";
        return `            { type: "${missingFromPresetType}", section: "⚠️ ${capitalize(missingFromPresetType)}", hidden: true },${description}`;
      })
      .join("\n");
    content = content.replace(
      /(presetConfig:\s*\{[\s\S]*?types:\s*\[[\s\S]*?)(\s*\],\s*\})/,
      `$1\n${newEntries}$2`,
    );
  }

  writeFileSync(RELEASE_CONFIG_FILE, content, "utf8");
  console.log(`✅ ${relativeFile} types synced`);
}

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
    const markerContent = extractMarkerContent(skillContent, marker);
    if (!markerContent) {
      console.log(
        `❌ ${skillName} missing <!-- ${marker}-start/end --> markers\n`,
      );
      inSync = false;
      continue;
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
      console.log("📋 Differences:");
      showDifference(sourceValues, skillValues, skillName);
      console.log("");
      inSync = false;
    } else if (!_.isEqual(sourceValues, skillValues)) {
      console.log(
        `🔀 ${skillName} ${marker} have matching values but different ordering\n`,
      );
      inSync = false;
    }
  }

  return inSync;
}

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
    console.log("📋 Differences:");
    showDifference(sourceScopes, templateScopes, templateName);
    console.log("");
    return false;
  } else if (!_.isEqual(sourceScopes, templateScopes)) {
    console.log(
      `🔀 ${templateName} scopes have matching values but different ordering\n`,
    );
    return false;
  }

  return true;
}

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

function writeSkillSync(config: ConventionalConfig, skillFile: string): void {
  const skillName = path.relative(WORKSPACE_ROOT, skillFile);
  console.log(`🔄 Syncing ${skillName} types and scopes...`);
  let skillContent = readFileSync(skillFile, "utf8");

  const typesEntries: EntryWithDescription[] = config.types.map((type) => ({
    value: type.name,
    description: type.description,
  }));
  const scopesEntries: EntryWithDescription[] = config.scopes.map((scope) => ({
    value: scope.name,
    description: scope.description,
  }));

  const typesTable = generateMarkdownTable(typesEntries, {
    col1: "Type",
    col2: "Description",
  });
  const scopesTable = generateMarkdownTable(scopesEntries, {
    col1: "Scope",
    col2: "Description",
  });

  skillContent = replaceMarkerContent(skillContent, "types", typesTable);
  skillContent = replaceMarkerContent(skillContent, "scopes", scopesTable);

  writeFileSync(skillFile, skillContent, "utf8");
  console.log(`✅ ${skillName} types and scopes synced`);
}

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

function main(): void {
  const config = loadConventionalConfig();
  const settingsContent = readFileSync(SETTINGS_FILE, "utf8");
  const settingsScopes = parseSettingsScopes(settingsContent);

  if (MODE === "check") {
    const settingsOk = checkSettingsSync(
      config.scopes.map((scope) => scope.name),
      settingsScopes,
    );
    let skillsOk = true;
    for (const skillFile of SKILL_FILES) {
      if (!checkSkillSync(config, skillFile)) {
        skillsOk = false;
      }
    }
    let templatesOk = true;
    for (const templateFile of ISSUE_TEMPLATE_FILES) {
      if (
        !checkIssueTemplateSync(
          config.scopes.map((scope) => scope.name),
          templateFile,
        )
      ) {
        templatesOk = false;
      }
    }
    const releaseConfigOk = checkReleaseConfigSync(
      config.types.map((type) => type.name),
    );

    if (!settingsOk || !skillsOk || !templatesOk || !releaseConfigOk) {
      console.log(
        "💡 Run 'nx run monorepo:sync-conventional-config:write' to sync",
      );
      process.exit(1);
    }
    console.log("✅ Conventional commit config is in sync");
  } else if (MODE === "write") {
    const settingsOk = checkSettingsSync(
      config.scopes.map((scope) => scope.name),
      settingsScopes,
    );
    const outOfSyncSkills = SKILL_FILES.filter(
      (skillFile) => !checkSkillSync(config, skillFile),
    );
    const outOfSyncTemplates = ISSUE_TEMPLATE_FILES.filter(
      (templateFile) =>
        !checkIssueTemplateSync(
          config.scopes.map((scope) => scope.name),
          templateFile,
        ),
    );
    const releaseConfigOk = checkReleaseConfigSync(
      config.types.map((type) => type.name),
    );

    if (
      settingsOk &&
      outOfSyncSkills.length === 0 &&
      outOfSyncTemplates.length === 0 &&
      releaseConfigOk
    ) {
      console.log("✅ Already in sync");
    } else {
      if (!settingsOk) writeSettingsSync(config.scopes);
      for (const skillFile of outOfSyncSkills) {
        writeSkillSync(config, skillFile);
      }
      for (const templateFile of outOfSyncTemplates) {
        writeIssueTemplateSync(
          config.scopes.map((scope) => scope.name),
          templateFile,
        );
      }
      if (!releaseConfigOk) writeReleaseConfigSync(config.types);
    }
  } else {
    console.error(`❌ Invalid mode: ${MODE}`);
    console.error(
      "💡 Usage: tsx scripts/sync-conventional-config.ts [check|write]",
    );
    process.exit(1);
  }
}

main();
