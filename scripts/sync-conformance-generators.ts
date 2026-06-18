#!/usr/bin/env tsx

/**
 * Sync conformance generators table into AGENTS.md
 *
 * Reads tools/conformance/generators.json, extracts generator names, aliases,
 * and descriptions, and generates a markdown table that is injected into the
 * root AGENTS.md file between marker comments.
 *
 * Usage: pnpm exec nx run monorepo:sync-conformance-generators [check|write]
 *   check (default): Validate that AGENTS.md has up-to-date generators table, exit 1 if not
 *   write: Update AGENTS.md with generated generators table
 */

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const SYNC_CONFORMANCE_GENERATORS_FILES = [
  "AGENTS.md",
  "tools/conformance/generators.json",
];

const WORKSPACE_ROOT = path.join(__dirname, "..");
const GENERATORS_FILE = path.join(
  WORKSPACE_ROOT,
  "tools/conformance/generators.json",
);
const AGENTS_FILE = path.join(WORKSPACE_ROOT, "AGENTS.md");
const MODE = process.argv[2] ?? "check";

/**
 *
 */
interface Generator {
  aliases: string[];
  description: string;
  name: string;
}

/**
 *
 */
interface GeneratorsJson {
  generators: Record<
    string,
    { aliases?: string[]; description: string; factory: string; schema: string }
  >;
}

/**
 * Check if the generated content matches the stored content
 */
function checkSync(generators: Generator[]): boolean {
  const generatedTable = generateGeneratorsTable(generators);
  const existingContent = readAgentsFile();

  const generated = generatedTable.trim();
  const existing = existingContent.generatedContent.trim();

  if (generated !== existing) {
    console.log(
      "❌ Conformance generators table in AGENTS.md is out of sync\n",
    );
    console.log(
      `  Found ${generators.length} generators in tools/conformance/generators.json`,
    );
    console.log("  Generated content doesn't match stored content");
    console.log(
      "💡 Run 'pnpm exec nx run monorepo:sync-conformance-generators:write' to sync\n",
    );
    return false;
  }

  console.log(
    `✅ Conformance generators table is in sync (${generators.length} generators)`,
  );
  return true;
}

/**
 * Generate markdown table of generators
 */
function generateGeneratorsTable(generators: Generator[]): string {
  const header =
    "| Generator | Alias | Description |\n| --------- | ----- | ----------- |";
  const rows = generators.map((gen) => {
    const alias = gen.aliases.map((a) => `\`${a}\``).join(", ");
    return `| \`${gen.name}\` | ${alias} | ${gen.description} |`;
  });
  return [header, ...rows].join("\n");
}

/**
 * Main entry point
 */
function main(): void {
  try {
    const generators = readGenerators();

    if (MODE === "check") {
      const success = checkSync(generators);
      process.exit(success ? 0 : 1);
    } else if (MODE === "write") {
      writeSync(generators);
      process.exit(0);
    } else {
      console.error(`❌ Unknown mode: ${MODE}`);
      console.error("Expected 'check' or 'write'");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

/**
 * Read AGENTS.md and extract content around the generated section
 */
function readAgentsFile(): {
  afterMarker: string;
  beforeMarker: string;
  generatedContent: string;
} {
  const content = readFileSync(AGENTS_FILE, "utf8");
  const startMarker = "<!-- conformance-generators-table start -->";
  const endMarker = "<!-- conformance-generators-table end -->";

  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1) {
    throw new Error(
      `Markers not found in AGENTS.md. Expected to find "${startMarker}" and "${endMarker}"`,
    );
  }

  const beforeMarker = content.slice(
    0,
    Math.max(0, startIndex + startMarker.length),
  );
  const afterMarker = content.slice(Math.max(0, endIndex));
  const generatedContent = content.slice(
    startIndex + startMarker.length,
    endIndex,
  );

  return { afterMarker, beforeMarker, generatedContent };
}

/**
 * Read generators from tools/conformance/generators.json
 */
function readGenerators(): Generator[] {
  const content = readFileSync(GENERATORS_FILE, "utf8");
  const json = JSON.parse(content) as GeneratorsJson;

  return Object.entries(json.generators).map(([name, config]) => ({
    aliases: config.aliases ?? [],
    description: config.description,
    name,
  }));
}

/**
 * Write the generated content to AGENTS.md
 */
function writeSync(generators: Generator[]): void {
  console.log("🔄 Generating conformance generators table...");
  const generatedTable = generateGeneratorsTable(generators);
  const { afterMarker, beforeMarker } = readAgentsFile();

  const newContent = `${beforeMarker}\n${generatedTable}\n${afterMarker}`;

  writeFileSync(AGENTS_FILE, newContent, "utf8");
  console.log(`✅ Updated AGENTS.md with ${generators.length} generators`);
}

if (process.argv[1]?.endsWith("sync-conformance-generators.ts")) {
  main();
}
