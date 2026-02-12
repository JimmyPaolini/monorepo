#!/usr/bin/env tsx

/**
 * Sync VS Code extensions between .vscode/extensions.json and .devcontainer/devcontainer.json
 * Usage: tsx scripts/sync-extensions.ts [check|write]
 *   check (default): Validate that files are in sync, exit 1 if not
 *   write: Update devcontainer.json from extensions.json
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import JSON5 from "json5";
import _ from "lodash";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const WORKSPACE_ROOT = join(__dirname, "..");
const EXTENSIONS_FILE = join(WORKSPACE_ROOT, ".vscode/extensions.json");
const DEVCONTAINER_FILE = join(
  WORKSPACE_ROOT,
  ".devcontainer/devcontainer.json",
);
const MODE = process.argv[2] || "check";

interface ExtensionsJson {
  recommendations: string[];
  unwantedRecommendations: string[];
}

interface DevcontainerJson {
  customizations: {
    vscode: {
      recommendations: string[];
      unwantedRecommendations: string[];
    };
  };
}

function showDifference(source: string[], target: string[]): void {
  const missing = _.difference(source, target);
  const extra = _.difference(target, source);

  if (missing.length > 0) {
    console.log(`  Missing in devcontainer.json (${missing.length} items):`);
    missing.forEach((item) => console.log(`    + ${item}`));
  }
  if (extra.length > 0) {
    console.log(`  Extra in devcontainer.json (${extra.length} items):`);
    extra.forEach((item) => console.log(`    - ${item}`));
  }
}

function checkSync(
  extensions: ExtensionsJson,
  devcontainer: DevcontainerJson,
): boolean {
  const { recommendations, unwantedRecommendations } = extensions;
  const { recommendations: dcRecs, unwantedRecommendations: dcUnwanted } =
    devcontainer.customizations.vscode;

  const recsMatch = _.isEqual([...recommendations].sort(), [...dcRecs].sort());
  const unwantedMatch = _.isEqual(
    [...unwantedRecommendations].sort(),
    [...dcUnwanted].sort(),
  );

  if (!recsMatch || !unwantedMatch) {
    console.log("❌ VS Code extensions are out of sync\n");
    if (!recsMatch) {
      console.log("📋 Differences in recommendations:");
      showDifference(recommendations, dcRecs);
      console.log("");
    }
    if (!unwantedMatch) {
      console.log("🚫 Differences in unwantedRecommendations:");
      showDifference(unwantedRecommendations, dcUnwanted);
      console.log("");
    }
    console.log("💡 Run 'nx run monorepo:sync-extensions:write' to sync");
    return false;
  }
  return true;
}

function writeSync(
  extensions: ExtensionsJson,
  devcontainer: DevcontainerJson,
): void {
  console.log("🔄 Syncing extensions...");
  devcontainer.customizations.vscode.recommendations =
    extensions.recommendations;
  devcontainer.customizations.vscode.unwantedRecommendations =
    extensions.unwantedRecommendations;
  writeFileSync(
    DEVCONTAINER_FILE,
    `${JSON.stringify(devcontainer, null, 2)}\n`,
    "utf-8",
  );
  console.log("✅ Extensions synced successfully");
}

function main(): void {
  const extensions: ExtensionsJson = JSON5.parse(
    readFileSync(EXTENSIONS_FILE, "utf-8"),
  );
  const devcontainer: DevcontainerJson = JSON5.parse(
    readFileSync(DEVCONTAINER_FILE, "utf-8"),
  );

  if (MODE === "check") {
    const inSync = checkSync(extensions, devcontainer);
    if (!inSync) process.exit(1);
    console.log("✅ VS Code extensions are in sync");
  } else if (MODE === "write") {
    if (checkSync(extensions, devcontainer)) {
      console.log("✅ Extensions already in sync");
    } else {
      writeSync(extensions, devcontainer);
    }
  } else {
    console.error(`❌ Invalid mode: ${MODE}`);
    console.error("💡 Usage: tsx scripts/sync-extensions.ts [check|write]");
    process.exit(1);
  }
}

main();
