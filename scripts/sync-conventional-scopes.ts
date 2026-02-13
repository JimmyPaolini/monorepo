#!/usr/bin/env tsx

/**
 * Sync conventional commit scopes from conventional.config.cjs into .vscode/settings.json
 * Usage: tsx scripts/sync-conventional-scopes.ts [check|write]
 *   check (default): Validate that scopes are in sync, exit 1 if not
 *   write: Update settings.json from conventional.config.cjs
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
const MODE = process.argv[2] || "check";

interface ConventionalConfig {
  types: string[];
  scopes: string[];
}

/**
 * Load conventional.config.cjs using require() since it's a CommonJS module.
 */
function loadConventionalConfig(): ConventionalConfig {
  const require = createRequire(import.meta.url);

  return require(CONVENTIONAL_CONFIG) as ConventionalConfig;
}

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

function showDifference(source: string[], target: string[]): void {
  const missing = _.difference(source, target);
  const extra = _.difference(target, source);

  if (missing.length > 0) {
    console.log(`  Missing in settings.json (${missing.length} items):`);
    missing.forEach((item) => console.log(`    + ${item}`));
  }
  if (extra.length > 0) {
    console.log(`  Extra in settings.json (${extra.length} items):`);
    extra.forEach((item) => console.log(`    - ${item}`));
  }
}

function checkSync(sourceScopes: string[], settingsScopes: string[]): boolean {
  const sortedSource = [...sourceScopes].sort();
  const sortedTarget = [...settingsScopes].sort();
  const valuesMatch = _.isEqual(sortedSource, sortedTarget);
  const orderMatches = _.isEqual(sourceScopes, settingsScopes);

  if (!valuesMatch || !orderMatches) {
    console.log("❌ Conventional commit scopes are out of sync\n");
    if (!valuesMatch) {
      console.log("📋 Differences in scopes:");
      showDifference(sourceScopes, settingsScopes);
      console.log("");
    }
    if (valuesMatch && !orderMatches) {
      console.log("🔀 Scopes have matching values but different ordering\n");
    }
    console.log(
      "💡 Run 'nx run monorepo:sync-conventional-scopes:write' to sync",
    );
    return false;
  }
  return true;
}

function writeSync(): void {
  console.log("🔄 Syncing scopes...");
  const settingsContent = readFileSync(SETTINGS_FILE, "utf-8");
  const scopesBlock = extractScopesBlock();
  const formattedBlock = formatScopesBlockForSettings(scopesBlock);

  // Match the entire "conventionalCommits.scopes": [...] block including comments
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
  console.log("✅ Scopes synced successfully");
}

function main(): void {
  const { scopes: sourceScopes } = loadConventionalConfig();
  const settingsContent = readFileSync(SETTINGS_FILE, "utf-8");
  const settingsScopes = parseSettingsScopes(settingsContent);

  if (MODE === "check") {
    const inSync = checkSync(sourceScopes, settingsScopes);
    if (!inSync) process.exit(1);
    console.log("✅ Conventional commit scopes are in sync");
  } else if (MODE === "write") {
    if (checkSync(sourceScopes, settingsScopes)) {
      console.log("✅ Scopes already in sync");
    } else {
      writeSync();
    }
  } else {
    console.error(`❌ Invalid mode: ${MODE}`);
    console.error(
      "💡 Usage: tsx scripts/sync-conventional-scopes.ts [check|write]",
    );
    process.exit(1);
  }
}

main();
