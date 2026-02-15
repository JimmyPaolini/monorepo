#!/usr/bin/env tsx

/**
 * Sync VS Code extensions between .vscode/extensions.json and .devcontainer/devcontainer.json
 *
 * Source: .vscode/extensions.json
 *   - recommendations: Extensions to recommend (gets copied to BOTH arrays below)
 *   - unwantedRecommendations: Extensions to discourage
 *
 * Target: .devcontainer/devcontainer.json
 *   - extensions: Auto-installed in devcontainers (copied from recommendations)
 *   - recommendations: Shown as suggestions (copied from recommendations)
 *   - unwantedRecommendations: Extensions to discourage (copied as-is)
 *
 * Usage: tsx scripts/sync-vscode-extensions.ts [check|write]
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
      extensions: string[];
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
  const {
    extensions: devcontainerExtensions,
    recommendations: devcontainerRecommendations,
    unwantedRecommendations: devcontainerUnwantedRecommendations,
  } = devcontainer.customizations.vscode;

  // Both extensions and recommendations in devcontainer should match recommendations from extensions.json
  const extensionsMatch = _.isEqual(
    [...recommendations].sort(),
    [...devcontainerExtensions].sort(),
  );
  const recommendationsMatch = _.isEqual(
    [...recommendations].sort(),
    [...devcontainerRecommendations].sort(),
  );
  const unwantedRecommendationsMatch = _.isEqual(
    [...unwantedRecommendations].sort(),
    [...devcontainerUnwantedRecommendations].sort(),
  );

  if (
    !extensionsMatch ||
    !recommendationsMatch ||
    !unwantedRecommendationsMatch
  ) {
    console.log("❌ VS Code extensions are out of sync\n");
    if (!extensionsMatch) {
      console.log(
        "🔧 Differences in devcontainer extensions (should match recommendations):",
      );
      showDifference(recommendations, devcontainerExtensions);
      console.log("");
    }
    if (!recommendationsMatch) {
      console.log(
        "📋 Differences in devcontainer recommendations (should match recommendations):",
      );
      showDifference(recommendations, devcontainerRecommendations);
      console.log("");
    }
    if (!unwantedRecommendationsMatch) {
      console.log("🚫 Differences in unwantedRecommendations:");
      showDifference(
        unwantedRecommendations,
        devcontainerUnwantedRecommendations,
      );
      console.log("");
    }
    console.log(
      "💡 Run 'nx run monorepo:sync-vscode-extensions:write' to sync",
    );
    return false;
  }
  return true;
}

function writeSync(
  extensions: ExtensionsJson,
  devcontainer: DevcontainerJson,
): void {
  console.log("🔄 Syncing extensions...");
  // Copy recommendations to both extensions and recommendations in devcontainer
  devcontainer.customizations.vscode.extensions = extensions.recommendations;
  devcontainer.customizations.vscode.recommendations =
    extensions.recommendations;
  devcontainer.customizations.vscode.unwantedRecommendations =
    extensions.unwantedRecommendations;
  writeFileSync(
    DEVCONTAINER_FILE,
    `${JSON.stringify(devcontainer, null, 2)}\n`,
    "utf-8",
  );
  console.log(
    "✅ Extensions synced successfully (recommendations copied to both arrays)",
  );
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
    console.error(
      "💡 Usage: tsx scripts/sync-vscode-extensions.ts [check|write]",
    );
    process.exit(1);
  }
}

main();
