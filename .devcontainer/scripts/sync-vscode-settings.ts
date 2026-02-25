#!/usr/bin/env tsx

/**
 * Sync .vscode/settings.json (JSONC) into the VS Code Machine settings.
 * Machine settings persist across devcontainer rebuilds (volume-mounted)
 * and apply as the lowest-priority layer, below workspace settings.
 *
 * The merge strategy favors workspace settings: existing Machine settings
 * (injected by devcontainer features like Python, Terraform) are preserved,
 * but workspace settings override on conflict.
 *
 * Usage: tsx scripts/sync-vscode-settings.ts [check|write]
 *   check (default): Validate that Machine settings contain all workspace settings, exit 1 if not
 *   write: Merge workspace settings into Machine settings
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import JSON5 from "json5";
import _ from "lodash";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const WORKSPACE_ROOT = join(__dirname, "../..");
const WORKSPACE_SETTINGS_FILE = join(WORKSPACE_ROOT, ".vscode/settings.json");
const MACHINE_SETTINGS_DIR = "/home/node/.vscode-server/data/Machine";
const MACHINE_SETTINGS_FILE = join(MACHINE_SETTINGS_DIR, "settings.json");
const MODE = process.argv[2] || "check";

type Settings = Record<string, unknown>;

function loadWorkspaceSettings(): Settings {
  return JSON5.parse<Settings>(readFileSync(WORKSPACE_SETTINGS_FILE, "utf-8"));
}

function loadMachineSettings(): Settings {
  if (!existsSync(MACHINE_SETTINGS_FILE)) {
    return {};
  }
  return JSON5.parse<Settings>(readFileSync(MACHINE_SETTINGS_FILE, "utf-8"));
}

function checkSync(workspace: Settings, machine: Settings): boolean {
  const missingKeys: string[] = [];
  const mismatchedKeys: string[] = [];

  for (const key of Object.keys(workspace)) {
    if (!(key in machine)) {
      missingKeys.push(key);
    } else if (!_.isEqual(machine[key], workspace[key])) {
      mismatchedKeys.push(key);
    }
  }

  if (missingKeys.length > 0 || mismatchedKeys.length > 0) {
    console.log("❌ VS Code Machine settings are out of sync\n");
    if (missingKeys.length > 0) {
      console.log(
        `  Missing in Machine settings (${missingKeys.length} keys):`,
      );
      missingKeys.forEach((key) => console.log(`    + ${key}`));
      console.log("");
    }
    if (mismatchedKeys.length > 0) {
      console.log(
        `  Mismatched in Machine settings (${mismatchedKeys.length} keys):`,
      );
      mismatchedKeys.forEach((key) => console.log(`    ~ ${key}`));
      console.log("");
    }
    console.log(
      "💡 Run 'pnpm exec tsx scripts/sync-vscode-settings.ts write' to sync",
    );
    return false;
  }
  return true;
}

function writeSync(workspace: Settings, machine: Settings): void {
  console.log("🔄 Syncing workspace settings into Machine settings...");
  const merged = { ...machine, ...workspace };
  mkdirSync(MACHINE_SETTINGS_DIR, { recursive: true });
  writeFileSync(
    MACHINE_SETTINGS_FILE,
    `${JSON.stringify(merged, null, 2)}\n`,
    "utf-8",
  );
  console.log("✅ Machine settings synced successfully");
}

function main(): void {
  const workspace = loadWorkspaceSettings();
  const machine = loadMachineSettings();

  if (MODE === "check") {
    const inSync = checkSync(workspace, machine);
    if (!inSync) process.exit(1);
    console.log("✅ VS Code Machine settings are in sync");
  } else if (MODE === "write") {
    if (checkSync(workspace, machine)) {
      console.log("✅ Machine settings already in sync");
    } else {
      writeSync(workspace, machine);
    }
  } else {
    console.error(`❌ Invalid mode: ${MODE}`);
    console.error(
      "💡 Usage: tsx scripts/sync-vscode-settings.ts [check|write]",
    );
    process.exit(1);
  }
}

main();
