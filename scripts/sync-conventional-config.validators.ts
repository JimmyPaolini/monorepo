/**
 * Validation functions for checking synchronization of conventional config.
 */

import { readFileSync } from "node:fs";
import path from "node:path";

import _ from "lodash";

import {
  SYNC_CONVENTIONAL_CONFIG_ISSUE_TEMPLATE_FILES,
  SYNC_CONVENTIONAL_CONFIG_SKILL_FILES,
} from "./sync-conventional-config.constants";
import {
  extractMarkerContent,
  parseIssueTemplateScopes,
  parseMarkdownTableValues,
} from "./sync-conventional-config.io";

import type { ConventionalConfig } from "./sync-conventional-config.helpers";

const WORKSPACE_ROOT = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  "..",
);
const SKILL_FILES = SYNC_CONVENTIONAL_CONFIG_SKILL_FILES.map((f) =>
  path.join(WORKSPACE_ROOT, f),
);
const ISSUE_TEMPLATE_FILES = SYNC_CONVENTIONAL_CONFIG_ISSUE_TEMPLATE_FILES.map(
  (f) => path.join(WORKSPACE_ROOT, f),
);
const RELEASE_RULES_SPECIAL_TYPES = new Set(["revert"]);

/**
 * Validates that every configured skill file has synchronized type/scope tables.
 */
export function checkAllSkillsSync(config: ConventionalConfig): boolean {
  let skillsOk = true;
  for (const skillFile of SKILL_FILES) {
    if (!checkSkillSync(config, skillFile)) skillsOk = false;
  }
  return skillsOk;
}

/**
 * Validates that all issue templates contain matching scope options.
 */
export function checkAllTemplatesSync(scopeNames: string[]): boolean {
  let templatesOk = true;
  for (const templateFile of ISSUE_TEMPLATE_FILES) {
    if (!checkIssueTemplateSync(scopeNames, templateFile)) templatesOk = false;
  }
  return templatesOk;
}

/**
 * Validates a single issue template against configured scope values and order.
 */
export function checkIssueTemplateSync(
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
    showDifference(sourceScopes, templateScopes, templateName);
    return false;
  }
  if (!_.isEqual(sourceScopes, templateScopes)) {
    console.log(
      `🔀 ${templateName} scopes have matching values but different ordering\n`,
    );
    return false;
  }
  return true;
}

/**
 * Validates release preset type entries include all configured commit types.
 */
export function checkPresetConfigSync(
  sourceTypes: string[],
  presetConfigTypes: string[],
  relativeFile: string,
): boolean {
  const missingFromPresetTypes = _.difference(sourceTypes, presetConfigTypes);
  if (missingFromPresetTypes.length > 0) {
    console.log(`❌ ${relativeFile} presetConfig.types is missing types:\n`);
    missingFromPresetTypes.forEach((t) => console.log(`    + ${t}`));
    console.log("");
    return false;
  }
  return true;
}

/**
 * Validates release rules include all configured commit types except specials.
 */
export function checkReleaseRulesSync(
  sourceTypes: string[],
  releaseRulesTypes: string[],
  relativeFile: string,
): boolean {
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
    return false;
  }
  return true;
}

/**
 * Validates configured commit scopes in settings are value- and order-synced.
 */
export function checkSettingsSync(
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

/**
 * Validates a skill file's type/scope markdown tables against source config.
 */
export function checkSkillSync(
  config: ConventionalConfig,
  skillFile: string,
): boolean {
  const skillName = path.relative(WORKSPACE_ROOT, skillFile);
  const skillContent = readFileSync(skillFile, "utf8");
  let inSync = true;
  for (const marker of ["types", "scopes"] as const) {
    if (!checkMarkerSync({ config, marker, skillContent, skillName })) {
      inSync = false;
    }
  }
  return inSync;
}

/**
 * Checks one marker table in a skill file for value and ordering sync.
 */
function checkMarkerSync(args: {
  config: ConventionalConfig;
  marker: "scopes" | "types";
  skillContent: string;
  skillName: string;
}): boolean {
  const markerValues = readMarkerValues(args);
  if (!markerValues) {
    return false;
  }
  const { config, marker, skillName } = args;
  const { skillValues } = markerValues;
  const sourceValues = getSourceValuesForMarker({ config, marker });

  return validateMarkerValues({
    marker,
    skillName,
    skillValues,
    sourceValues,
  });
}

/**
 * Returns source values for the requested marker table type.
 */
function getSourceValuesForMarker(args: {
  config: ConventionalConfig;
  marker: "scopes" | "types";
}): string[] {
  const { config, marker } = args;
  if (marker === "types") {
    return config.types.map((type) => type.name);
  }
  return config.scopes.map((scope) => scope.name);
}

/**
 * Reads and parses the marker table values from a skill file.
 */
function readMarkerValues(args: {
  marker: "scopes" | "types";
  skillContent: string;
  skillName: string;
}): undefined | { skillValues: string[] } {
  const { marker, skillContent, skillName } = args;
  const markerContent = extractMarkerContent(skillContent, marker);
  if (!markerContent) {
    console.log(
      `❌ ${skillName} missing <!-- ${marker}-start/end --> markers\n`,
    );
    return undefined;
  }

  return {
    skillValues: parseMarkdownTableValues(markerContent),
  };
}

/**
 * Prints missing and extra values for an out-of-sync target.
 */
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

/**
 * Compares marker values for both set equality and stable ordering.
 */
function validateMarkerValues(args: {
  marker: "scopes" | "types";
  skillName: string;
  skillValues: string[];
  sourceValues: string[];
}): boolean {
  const { marker, skillName, skillValues, sourceValues } = args;
  const sortedSource = _.sortBy([...sourceValues]);
  const sortedSkill = _.sortBy([...skillValues]);
  if (!_.isEqual(sortedSource, sortedSkill)) {
    console.log(`❌ ${skillName} ${marker} table is out of sync\n`);
    showDifference(sourceValues, skillValues, skillName);
    return false;
  }
  if (!_.isEqual(sourceValues, skillValues)) {
    console.log(
      `🔀 ${skillName} ${marker} have matching values but different ordering\n`,
    );
    return false;
  }
  return true;
}
