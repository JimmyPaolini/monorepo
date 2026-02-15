#!/usr/bin/env tsx

/**
 * Sync conventional commit config from conventional.config.cjs into:
 * - .vscode/settings.json (scopes array)
 * - documentation/skills/commit-code/SKILL.md (types and scopes tables)
 *
 * Usage: tsx scripts/sync-conventional-config.ts [check|write]
 *   check (default): Validate that targets are in sync, exit 1 if not
 *   write: Update targets from conventional.config.cjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import JSON5 from "json5";
import _ from "lodash";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const WORKSPACE_ROOT = join(__dirname, "..");
const CONVENTIONAL_CONFIG = join(WORKSPACE_ROOT, "conventional.config.cjs");
const SETTINGS_FILE = join(WORKSPACE_ROOT, ".vscode/settings.json");
const SKILL_FILE = join(
  WORKSPACE_ROOT,
  "documentation/skills/commit-code/SKILL.md",
);
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
 * Each line like `"build", // Description` becomes { value, description }.
 */
function parseEntriesWithDescriptions(
  arrayName: "types" | "scopes",
): EntryWithDescription[] {
  const content = readFileSync(CONVENTIONAL_CONFIG, "utf-8");
  const pattern = new RegExp(`const ${arrayName} = \\[([\\s\\S]*?)\\];`);
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
    throw new Error(
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

/**
 * Extract content between marker comments in a file.
 * Markers are HTML comments like `<!-- types-start -->` and `<!-- types-end -->`.
 */
function extractMarkerContent(
  content: string,
  markerName: string,
): string | undefined {
  const pattern = new RegExp(
    `<!-- ${markerName}-start -->\\n([\\s\\S]*?)<!-- ${markerName}-end -->`,
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
    `(<!-- ${markerName}-start -->\\n)[\\s\\S]*?(<!-- ${markerName}-end -->)`,
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

function checkSkillSync(config: ConventionalConfig): boolean {
  const skillContent = readFileSync(SKILL_FILE, "utf-8");
  let inSync = true;

  for (const marker of ["types", "scopes"] as const) {
    const markerContent = extractMarkerContent(skillContent, marker);
    if (!markerContent) {
      console.log(`❌ SKILL.md missing <!-- ${marker}-start/end --> markers\n`);
      inSync = false;
      continue;
    }

    const skillValues = parseMarkdownTableValues(markerContent);
    const sourceValues = config[marker];
    const sortedSource = [...sourceValues].sort();
    const sortedSkill = [...skillValues].sort();

    if (!_.isEqual(sortedSource, sortedSkill)) {
      console.log(`❌ SKILL.md ${marker} table is out of sync\n`);
      console.log("📋 Differences:");
      showDifference(sourceValues, skillValues, "SKILL.md");
      console.log("");
      inSync = false;
    } else if (!_.isEqual(sourceValues, skillValues)) {
      console.log(
        `🔀 SKILL.md ${marker} have matching values but different ordering\n`,
      );
      inSync = false;
    }
  }

  return inSync;
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

function writeSkillSync(): void {
  console.log("🔄 Syncing SKILL.md types and scopes...");
  let skillContent = readFileSync(SKILL_FILE, "utf-8");

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

  writeFileSync(SKILL_FILE, skillContent, "utf-8");
  console.log("✅ SKILL.md types and scopes synced");
}

function main(): void {
  const config = loadConventionalConfig();
  const settingsContent = readFileSync(SETTINGS_FILE, "utf-8");
  const settingsScopes = parseSettingsScopes(settingsContent);

  if (MODE === "check") {
    const settingsOk = checkSettingsSync(config.scopes, settingsScopes);
    const skillOk = checkSkillSync(config);

    if (!settingsOk || !skillOk) {
      console.log(
        "💡 Run 'nx run monorepo:sync-conventional-config:write' to sync",
      );
      process.exit(1);
    }
    console.log("✅ Conventional commit config is in sync");
  } else if (MODE === "write") {
    const settingsOk = checkSettingsSync(config.scopes, settingsScopes);
    const skillOk = checkSkillSync(config);

    if (settingsOk && skillOk) {
      console.log("✅ Already in sync");
    } else {
      if (!settingsOk) writeSettingsSync();
      if (!skillOk) writeSkillSync();
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
