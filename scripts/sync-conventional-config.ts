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
 *
 * Usage: tsx scripts/sync-conventional-config.ts [check|write]
 *   check (default): Validate that targets are in sync, exit 1 if not
 *   write: Update targets from conventional.config.cjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import JSON5 from "json5";
import _ from "lodash";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const WORKSPACE_ROOT = join(__dirname, "..");
const CONVENTIONAL_CONFIG = join(WORKSPACE_ROOT, "conventional.config.cjs");
const SETTINGS_FILE = join(WORKSPACE_ROOT, ".vscode/settings.json");
const SKILL_FILES = [
  join(WORKSPACE_ROOT, "documentation/skills/commit-code/SKILL.md"),
  join(WORKSPACE_ROOT, "documentation/skills/checkout-branch/SKILL.md"),
  join(WORKSPACE_ROOT, "documentation/skills/create-pull-request/SKILL.md"),
  join(WORKSPACE_ROOT, ".github/prompts/submit-changes.prompt.md"),
];
const ISSUE_TEMPLATE_FILES = [
  join(WORKSPACE_ROOT, ".github/ISSUE_TEMPLATE/bug-report.yml"),
  join(WORKSPACE_ROOT, ".github/ISSUE_TEMPLATE/feature-request.yml"),
];
const MODE = process.argv[2] || "check";

interface EntryWithDescription {
  value: string;
  description: string;
}

interface ConventionalConfig {
  types: string[];
  scopes: string[];
}

// ─── Config Loading ──────────────────────────────────────────────────────────

/**
 * Load conventional.config.cjs using require() since it's a CommonJS module.
 */
function loadConventionalConfig(): ConventionalConfig {
  const require = createRequire(import.meta.url);

  return require(CONVENTIONAL_CONFIG) as ConventionalConfig;
}

/**
 * Parse entries with inline comments from conventional.config.cjs.
 * Each line like `"build", // Description` becomes an EntryWithDescription object.
 */
function parseEntriesWithDescriptions(
  arrayName: "types" | "scopes",
): EntryWithDescription[] {
  const content = readFileSync(CONVENTIONAL_CONFIG, "utf-8");
  const pattern = new RegExp(String.raw`const ${arrayName} = \[([\s\S]*?)\];`);
  const match = pattern.exec(content);
  if (!match?.[1]) {
    throw new Error(
      `Could not find ${arrayName} array in conventional.config.cjs`,
    );
  }

  const entries: EntryWithDescription[] = [];
  for (const line of match[1].split("\n")) {
    const entryMatch = /^\s*"([^"]+)",?\s*\/\/\s*(.+)$/.exec(line);
    if (entryMatch?.[1] && entryMatch[2]) {
      entries.push({
        value: entryMatch[1],
        description: entryMatch[2].trim(),
      });
    }
  }
  return entries;
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
 * Extract the raw scopes array block (with comments) from conventional.config.cjs.
 * Returns the inner content between the brackets.
 */
function extractScopesBlock(): string {
  const content = readFileSync(CONVENTIONAL_CONFIG, "utf-8");
  const match = /const scopes = \[([\s\S]*?)\];/.exec(content);
  if (!match?.[1]) {
    throw new Error("Could not find scopes array in conventional.config.cjs");
  }
  return match[1];
}

/**
 * Re-indent the scopes block from conventional.config.cjs (2-space indented)
 * to settings.json format (4-space indented within the array).
 * Removes trailing comma from the last value entry for valid JSON.
 */
function formatScopesBlockForSettings(scopesBlock: string): string {
  const lines = scopesBlock
    .split("\n")
    .map((line) => {
      const trimmed = line.trimEnd();
      if (!trimmed) return "";
      // Remove leading whitespace and re-indent with 4 spaces
      return `    ${trimmed.trimStart()}`;
    })
    .filter((line) => line !== "");

  // Remove trailing comma from the last value line (not a comment-only line)
  const reversed = [...lines].reverse();
  for (const [i, line] of reversed.entries()) {
    if (line.trimStart().startsWith("//")) continue;
    reversed[i] = line.replace(/,(\s*\/\/.*)$/, "$1");
    break;
  }
  reversed.reverse();

  return reversed.join("\n");
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
  const sortedSource = [...sourceScopes].sort();
  const sortedTarget = [...settingsScopes].sort();
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
  const skillName = relative(WORKSPACE_ROOT, skillFile);
  const skillContent = readFileSync(skillFile, "utf-8");
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
    const sourceValues = config[marker];
    const sortedSource = [...sourceValues].sort();
    const sortedSkill = [...skillValues].sort();

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
  const templateName = relative(WORKSPACE_ROOT, templateFile);
  const templateContent = readFileSync(templateFile, "utf-8");
  const templateScopes = parseIssueTemplateScopes(templateContent);

  if (templateScopes.length === 0) {
    console.log(
      `❌ ${templateName} missing <!-- scopes-start/end --> markers\n`,
    );
    return false;
  }

  const sortedSource = [...sourceScopes].sort();
  const sortedTemplate = [...templateScopes].sort();

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

function writeSettingsSync(): void {
  console.log("🔄 Syncing settings.json scopes...");
  const settingsContent = readFileSync(SETTINGS_FILE, "utf-8");
  const scopesBlock = extractScopesBlock();
  const formattedBlock = formatScopesBlockForSettings(scopesBlock);

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

  writeFileSync(SETTINGS_FILE, updatedContent, "utf-8");
  console.log("✅ settings.json scopes synced");
}

function writeSkillSync(skillFile: string): void {
  const skillName = relative(WORKSPACE_ROOT, skillFile);
  console.log(`🔄 Syncing ${skillName} types and scopes...`);
  let skillContent = readFileSync(skillFile, "utf-8");

  const typesEntries = parseEntriesWithDescriptions("types");
  const scopesEntries = parseEntriesWithDescriptions("scopes");

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

  writeFileSync(skillFile, skillContent, "utf-8");
  console.log(`✅ ${skillName} types and scopes synced`);
}

function writeIssueTemplateSync(
  sourceScopes: string[],
  templateFile: string,
): void {
  const templateName = relative(WORKSPACE_ROOT, templateFile);
  console.log(`🔄 Syncing ${templateName} scopes dropdown...`);
  const templateContent = readFileSync(templateFile, "utf-8");
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

  writeFileSync(templateFile, updatedContent, "utf-8");
  console.log(`✅ ${templateName} scopes synced`);
}

function main(): void {
  const config = loadConventionalConfig();
  const settingsContent = readFileSync(SETTINGS_FILE, "utf-8");
  const settingsScopes = parseSettingsScopes(settingsContent);

  if (MODE === "check") {
    const settingsOk = checkSettingsSync(config.scopes, settingsScopes);
    let skillsOk = true;
    for (const skillFile of SKILL_FILES) {
      if (!checkSkillSync(config, skillFile)) {
        skillsOk = false;
      }
    }
    let templatesOk = true;
    for (const templateFile of ISSUE_TEMPLATE_FILES) {
      if (!checkIssueTemplateSync(config.scopes, templateFile)) {
        templatesOk = false;
      }
    }

    if (!settingsOk || !skillsOk || !templatesOk) {
      console.log(
        "💡 Run 'nx run monorepo:sync-conventional-config:write' to sync",
      );
      process.exit(1);
    }
    console.log("✅ Conventional commit config is in sync");
  } else if (MODE === "write") {
    const settingsOk = checkSettingsSync(config.scopes, settingsScopes);
    const outOfSyncSkills = SKILL_FILES.filter(
      (skillFile) => !checkSkillSync(config, skillFile),
    );
    const outOfSyncTemplates = ISSUE_TEMPLATE_FILES.filter(
      (templateFile) => !checkIssueTemplateSync(config.scopes, templateFile),
    );

    if (
      settingsOk &&
      outOfSyncSkills.length === 0 &&
      outOfSyncTemplates.length === 0
    ) {
      console.log("✅ Already in sync");
    } else {
      if (!settingsOk) writeSettingsSync();
      for (const skillFile of outOfSyncSkills) {
        writeSkillSync(skillFile);
      }
      for (const templateFile of outOfSyncTemplates) {
        writeIssueTemplateSync(config.scopes, templateFile);
      }
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
