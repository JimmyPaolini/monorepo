/**
 * I/O, parsing, and formatting operations for conventional config sync.
 */

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import JSON5 from "json5";
import _ from "lodash";

import type {
  EntryWithDescription,
  ReleaseConfig,
  Scope,
  Type,
} from "./sync-conventional-config.helpers";

const WORKSPACE_ROOT = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  "..",
);
const SETTINGS_FILE = path.join(WORKSPACE_ROOT, ".vscode/settings.json");
const RELEASE_CONFIG_FILE = path.join(WORKSPACE_ROOT, "release.config.cjs");

const RELEASE_RULES_SPECIAL_TYPES = new Set(["revert"]);

const capitalize = (s: string): string =>
  s.charAt(0).toUpperCase() + s.slice(1);

// 📝 Formatting & Generation Functions

/**
 * Appends missing preset type entries into semantic-release preset config.
 */
export function appendToPresetTypes(
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
 * Appends missing release rule entries into semantic-release config.
 */
export function appendToReleaseRules(
  content: string,
  missingTypes: string[],
): string {
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
 * Extracts text content between named HTML comment markers.
 */
export function extractMarkerContent(
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
 * Formats scope list for VS Code settings JSON with inline descriptions.
 */
export function formatScopesForSettings(scopes: Scope[]): string {
  return scopes
    .map((scope, index) => {
      const comma = index < scopes.length - 1 ? "," : "";
      return `    "${scope.name}"${comma} // ${scope.description}`;
    })
    .join("\n");
}

// 📋 Parser & Extractor Functions

/**
 * Builds a markdown table from value-description pairs.
 */
export function generateMarkdownTable(
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
 * Generates YAML list items for scope dropdown options.
 */
export function generateYamlScopeOptions(scopes: string[]): string {
  return scopes.map((scope) => `        - ${scope}`).join("\n");
}

/**
 * Reads commit type names configured in release preset sections.
 */
export function getPresetConfigTypes(config: ReleaseConfig): string[] {
  return config.plugins[1][1].presetConfig.types.map((t) => t.type);
}

/**
 * Reads commit type names configured in semantic-release rules.
 */
export function getReleaseRulesTypes(config: ReleaseConfig): string[] {
  return config.plugins[0][1].releaseRules
    .map((r) => r.type)
    .filter((t): t is string => t !== undefined);
}

/**
 * Parses scope options from an issue template YAML content block.
 */
export function parseIssueTemplateScopes(content: string): string[] {
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
 * Parses first-column values from a markdown table body.
 */
export function parseMarkdownTableValues(tableContent: string): string[] {
  const values: string[] = [];
  for (const line of tableContent.split("\n")) {
    const match = /^\|\s*`([^`]+)`\s*\|/.exec(line);
    if (match?.[1]) {
      values.push(match[1]);
    }
  }
  return values;
}

/**
 * Parses conventional commit scopes from VS Code settings content.
 */
export function parseSettingsScopes(content: string): string[] {
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
 * Replaces content inside named marker block with generated content.
 */
export function replaceMarkerContent(
  content: string,
  markerName: string,
  newContent: string,
): string {
  const pattern = new RegExp(
    String.raw`(<!-- ${markerName}-start -->\n)[\s\S]*?(<!-- ${markerName}-end -->)`,
  );
  return content.replace(pattern, `$1\n${newContent}\n\n$2`);
}

// 🔄 Write/Update Functions

/**
 * Rewrites scope options in a GitHub issue template file.
 */
export function writeIssueTemplateSync(
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

/**
 * Updates release.config.cjs with missing release rules and preset types.
 */
export function writeReleaseConfigSync(sourceTypes: Type[]): void {
  const relativeFile = path.relative(WORKSPACE_ROOT, RELEASE_CONFIG_FILE);
  console.log(`🔄 Syncing ${relativeFile} types...`);

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const releaseConfig = require(RELEASE_CONFIG_FILE) as ReleaseConfig;

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
 * Rewrites VS Code settings conventional scope array from source scopes.
 */
export function writeSettingsSync(scopes: Scope[]): void {
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

/**
 * Rewrites a skill file's types and scopes markdown tables.
 */
export function writeSkillSync(
  config: { scopes: Scope[]; types: Type[] },
  skillFile: string,
): void {
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
