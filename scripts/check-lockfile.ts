#!/usr/bin/env node

/**
 * Check if pnpm-lock.yaml is in sync with package.json files
 * Exits with code 1 if out of sync, 0 if in sync
 */

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const lockfilePath = resolve(process.cwd(), "pnpm-lock.yaml");

if (!existsSync(lockfilePath)) {
  console.error("❌ pnpm-lock.yaml not found");
  process.exit(1);
}

try {
  console.log(
    "🔍 Checking if pnpm-lock.yaml is in sync with package.json files...",
  );

  // Try to install with frozen lockfile - this will fail if out of sync
  execSync("pnpm install --frozen-lockfile --prefer-offline", {
    stdio: "pipe",
  });

  console.log("✅ pnpm-lock.yaml is in sync");
  process.exit(0);
} catch {
  console.error("❌ pnpm-lock.yaml is out of sync with package.json files");
  console.error(
    "💡 Run 'pnpm install' to update the lockfile and try committing again",
  );
  process.exit(1);
}
