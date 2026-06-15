#!/usr/bin/env tsx

/**
 * Sync PR template from .github/PULL_REQUEST_TEMPLATE.md into:
 * - documentation/skills/create-pull-request/SKILL.md
 * - .github/prompts/create-pull-request.prompt.md
 * - .github/prompts/update-pull-request.prompt.md
 *
 * Usage: tsx scripts/sync-pull-request-template.ts [check|write]
 *   check (default): Validate that targets are in sync, exit 1 if not
 *   write: Update targets from PULL_REQUEST_TEMPLATE.md
 */

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORKSPACE_ROOT = path.join(__dirname, "..");

export const SYNC_PULL_REQUEST_TEMPLATE_TARGET_FILES = [
  "documentation/skills/create-pull-request/SKILL.md",
  "documentation/skills/update-pull-request/SKILL.md",
];

export const SYNC_PULL_REQUEST_TEMPLATE_FILES = [
  ".github/PULL_REQUEST_TEMPLATE.md",
  ...SYNC_PULL_REQUEST_TEMPLATE_TARGET_FILES,
];

const TEMPLATE_FILE = path.join(
  WORKSPACE_ROOT,
  ".github/PULL_REQUEST_TEMPLATE.md",
);
const TARGET_FILES = SYNC_PULL_REQUEST_TEMPLATE_TARGET_FILES.map((f) =>
  path.join(WORKSPACE_ROOT, f),
);
const MODE = process.argv[2] ?? "check";
const MARKER = "pr-template";

// ─── Template Loading ─────────────────────────────────────────────────────────

function checkTargetSync(templateContent: string, targetFile: string): boolean {
  const targetName = path.relative(WORKSPACE_ROOT, targetFile);
  const fileContent = readFileSync(targetFile, "utf8");
  const markerContent = extractMarkerContent(fileContent, MARKER);

  if (markerContent === undefined) {
    console.log(
      `❌ ${targetName} missing <!-- ${MARKER}-start/end --> markers\n`,
    );
    return false;
  }

  const expectedCodeBlock = wrapInCodeBlock(templateContent);

  if (markerContent.trim() !== expectedCodeBlock.trim()) {
    console.log(`❌ ${targetName} PR template is out of sync\n`);
    return false;
  }

  return true;
}

/**
 * Extract content between marker comments in a file.
 * Markers are HTML comments like `<!-- pr-template-start -->`.
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

// ─── Marker Utilities ─────────────────────────────────────────────────────────

function handleCheckMode(templateContent: string): void {
  let allInSync = true;
  for (const targetFile of TARGET_FILES) {
    if (!checkTargetSync(templateContent, targetFile)) {
      allInSync = false;
    }
  }
  if (!allInSync) {
    console.log(
      "💡 Run 'nx run monorepo:sync-pull-request-template:write' to sync",
    );
    process.exit(1);
  }
  console.log("✅ PR template is in sync");
}

function handleWriteMode(templateContent: string): void {
  const outOfSyncTargets = TARGET_FILES.filter(
    (targetFile) => !checkTargetSync(templateContent, targetFile),
  );
  if (outOfSyncTargets.length === 0) {
    console.log("✅ Already in sync");
  } else {
    for (const targetFile of outOfSyncTargets) {
      writeTargetSync(templateContent, targetFile);
    }
  }
}

function loadTemplate(): string {
  return readFileSync(TEMPLATE_FILE, "utf8").trimEnd();
}

function main(): void {
  const templateContent = loadTemplate();
  if (MODE === "check") {
    handleCheckMode(templateContent);
  } else if (MODE === "write") {
    handleWriteMode(templateContent);
  } else {
    console.error(`❌ Invalid mode: ${MODE}`);
    console.error(
      "💡 Usage: tsx scripts/sync-pull-request-template.ts [check|write]",
    );
    process.exit(1);
  }
}

// ─── Check / Write Logic ──────────────────────────────────────────────────────

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

function wrapInCodeBlock(content: string): string {
  return `\`\`\`markdown\n${content}\n\`\`\``;
}

function writeTargetSync(templateContent: string, targetFile: string): void {
  const targetName = path.relative(WORKSPACE_ROOT, targetFile);
  console.log(`🔄 Syncing ${targetName} PR template...`);

  const fileContent = readFileSync(targetFile, "utf8");
  const codeBlock = wrapInCodeBlock(templateContent);
  const updatedContent = replaceMarkerContent(fileContent, MARKER, codeBlock);

  writeFileSync(targetFile, updatedContent, "utf8");
  console.log(`✅ ${targetName} PR template synced`);
}

if (process.argv[1]?.endsWith("sync-pull-request-template.ts")) {
  main();
}
