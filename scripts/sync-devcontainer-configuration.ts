#!/usr/bin/env tsx

/**
 * Sync common fields from the local devcontainer config into the cloud config.
 *
 * Architecture:
 *   Primary:   .devcontainer/local/devcontainer.json  — source of truth for common fields
 *   Secondary: .devcontainer/cloud/devcontainer.json  — edit Docker feature / runArgs directly
 *
 * Both configs are edited directly for their environment-specific fields.
 * This script keeps the shared fields in sync so they only need to be maintained once.
 *
 * Synced fields (local → cloud, local wins):
 *   $schema, containerUser, customizations, forwardPorts, image, portsAttributes,
 *   postAttachCommand, postCreateCommand, remoteEnv, remoteUser, waitFor
 *
 * Merged fields (local is canonical, but config-specific entries are preserved):
 *   features  — shared features synced from local; docker feature in each config is preserved
 *   remoteEnv — synced from local; MONOREPO_ENVIRONMENT preserved per-config
 *
 * Cloud-only fields (cloud is source of truth, skipped during check and sync):
 *   mounts    — only used in the cloud config; local config has no mounts
 *
 * Preserved fields in cloud (cloud is source of truth):
 *   name, runArgs  (and any other top-level keys not listed above)
 *
 * Usage: tsx scripts/sync-devcontainer-configuration.ts [check|write]
 *   check (default): Validate that cloud has correct common fields from local, exit 1 if not
 *   write: Propagate common fields from local into cloud
 */

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import JSON5 from "json5";
import _ from "lodash";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKSPACE_ROOT = path.join(__dirname, "..");

const LOCAL_CONFIG_FILE = path.join(
  WORKSPACE_ROOT,
  ".devcontainer/local/devcontainer.json",
);
const CLOUD_CONFIG_FILE = path.join(
  WORKSPACE_ROOT,
  ".devcontainer/cloud/devcontainer.json",
);

// Fields copied verbatim from local into cloud.
const SYNCED_KEYS = new Set([
  "$schema",
  "containerUser",
  "customizations",
  "forwardPorts",
  "image",
  "portsAttributes",
  "postAttachCommand",
  "postCreateCommand",
  "remoteEnv",
  "remoteUser",
  "runServices",
  "waitFor",
]);

// Fields that belong exclusively to the cloud config and are never overwritten or checked.
const CLOUD_ONLY_KEYS = new Set(["mounts"]);

// Keys within remoteEnv that are config-specific and preserved per-environment.
const REMOTE_ENV_PRESERVED_KEYS = new Set(["MONOREPO_ENVIRONMENT"]);

const MODE = process.argv[2] ?? "check";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DevcontainerConfig {
  name?: string;
  features?: Record<string, unknown>;
  runArgs?: string[];
  [key: string]: unknown;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isDockerFeatureKey(key: string): boolean {
  return (
    key.includes("docker-in-docker") || key.includes("docker-outside-of-docker")
  );
}

// ─── Sync ─────────────────────────────────────────────────────────────────────

function applySync(
  localConfig: DevcontainerConfig,
  cloudConfig: DevcontainerConfig,
): DevcontainerConfig {
  const mergedConfig: DevcontainerConfig = { ...cloudConfig };

  // Overwrite verbatim-synced fields from local config.
  for (const key of SYNCED_KEYS) {
    if (key in localConfig) mergedConfig[key] = localConfig[key];
    else Reflect.deleteProperty(mergedConfig, key);
  }

  // Preserve config-specific remoteEnv variables from cloud config.
  const cloudRemoteEnv = cloudConfig["remoteEnv"] as
    | Record<string, unknown>
    | undefined;
  const mergedRemoteEnv = mergedConfig["remoteEnv"] as
    | Record<string, unknown>
    | undefined;
  if (cloudRemoteEnv && mergedRemoteEnv) {
    for (const key of REMOTE_ENV_PRESERVED_KEYS) {
      if (key in cloudRemoteEnv) mergedRemoteEnv[key] = cloudRemoteEnv[key];
    }
  }

  // Features: sync all non-docker features from local; preserve each config's docker feature.
  const localFeatures = localConfig.features ?? {};
  const cloudFeatures = cloudConfig.features ?? {};
  const mergedFeatures: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(localFeatures)) {
    if (!isDockerFeatureKey(key)) mergedFeatures[key] = val;
  }
  // Preserve the docker-related feature(s) from cloud config.
  for (const [key, val] of Object.entries(cloudFeatures)) {
    if (isDockerFeatureKey(key)) mergedFeatures[key] = val;
  }
  mergedConfig.features = mergedFeatures;

  // Cloud-only fields: restore cloud config's values so they are never modified.
  for (const key of CLOUD_ONLY_KEYS) {
    if (key in cloudConfig) mergedConfig[key] = cloudConfig[key];
    else Reflect.deleteProperty(mergedConfig, key);
  }

  return mergedConfig;
}

// ─── Check / Write ────────────────────────────────────────────────────────────

function check(
  expectedConfig: DevcontainerConfig,
  cloudConfigFile: string,
): boolean {
  const relativeFilePath = path.relative(WORKSPACE_ROOT, cloudConfigFile);
  const currentConfig: DevcontainerConfig = JSON5.parse(
    readFileSync(cloudConfigFile, "utf8"),
  );
  const expectedConfigCopy = structuredClone(expectedConfig);

  if (_.isEqual(expectedConfigCopy, currentConfig)) {
    return true;
  }

  console.log(
    `❌ ${relativeFilePath} has common fields out of sync with local config\n`,
  );

  const expectedFields = expectedConfigCopy as Record<string, unknown>;
  const currentFields = currentConfig as Record<string, unknown>;
  const allFieldKeys = new Set([
    ...Object.keys(expectedFields),
    ...Object.keys(currentFields),
  ]);
  for (const key of allFieldKeys) {
    if (CLOUD_ONLY_KEYS.has(key)) continue;
    if (!_.isEqual(expectedFields[key], currentFields[key])) {
      console.log(`  Field '${key}' differs:`);
      console.log(`    Expected: ${JSON.stringify(expectedFields[key])}`);
      console.log(`    Got:      ${JSON.stringify(currentFields[key])}`);
    }
  }
  console.log("");
  console.log(`  Run: nx run monorepo:sync-devcontainer-configuration:write`);
  return false;
}

function write(
  mergedConfig: DevcontainerConfig,
  cloudConfigFile: string,
): void {
  const relativeFilePath = path.relative(WORKSPACE_ROOT, cloudConfigFile);
  writeFileSync(
    cloudConfigFile,
    `${JSON.stringify(mergedConfig, null, 2)}\n`,
    "utf8",
  );
  console.log(`✅ Updated: ${relativeFilePath}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main(): void {
  const localConfig: DevcontainerConfig = JSON5.parse(
    readFileSync(LOCAL_CONFIG_FILE, "utf8"),
  );
  const cloudConfig: DevcontainerConfig = JSON5.parse(
    readFileSync(CLOUD_CONFIG_FILE, "utf8"),
  );
  const mergedConfig = applySync(localConfig, cloudConfig);

  if (MODE === "check") {
    if (!check(mergedConfig, CLOUD_CONFIG_FILE)) process.exit(1);
    console.log("✅ Cloud devcontainer config is in sync with local config");
  } else if (MODE === "write") {
    write(mergedConfig, CLOUD_CONFIG_FILE);
    console.log("✅ Cloud devcontainer config updated from local config");
  } else {
    console.error(`❌ Invalid mode: ${MODE}`);
    console.error(
      "   Usage: tsx scripts/sync-devcontainer-configuration.ts [check|write]",
    );
    process.exit(1);
  }
}

main();
