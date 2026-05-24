import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, describe, expect, it } from "vitest";

import { TEMPLATES_DIRECTORY_PATH as NESTJS_TEMPLATES_PATH } from "../generators/nestjs-service-module/generator";

import {
  collectConformanceErrors,
  validateInstanceDirectory,
  validateInstancesDirectory,
} from "./validator";

import type { InstanceDirectoryValidationResult } from "./types";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

/**
 * Workspace root resolved relative to this test file location:
 * tools/code-generator/src/validators → ../../../../ = workspace root
 */
const WORKSPACE_ROOT = path.resolve(__dirname, "../../../..");

/**
 * All discovered NestJS generator instances in the caelundas project.
 * Path derived from the generator's own MODULES_DIRECTORY constant.
 */
const CAELUNDAS_MODULES_PATH = path.join(
  WORKSPACE_ROOT,
  "applications/caelundas/src/modules",
);

/** Output path for machine-readable conformance results. */
const RESULTS_OUTPUT_PATH = path.join(
  WORKSPACE_ROOT,
  "tools/code-generator/tmp/conformance-results.json",
);

/** Discover all instance folders under a given directory. */
function discoverInstanceFolders(directoryPath: string): string[] {
  if (!fs.existsSync(directoryPath)) return [];
  return fs
    .readdirSync(directoryPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => path.join(directoryPath, entry.name));
}

// ─── Test suite ──────────────────────────────────────────────────────────────

const nestjsInstances = discoverInstanceFolders(CAELUNDAS_MODULES_PATH);

/** Accumulated results across all folders — written to JSON output after all tests run. */
const allResults: Record<string, InstanceDirectoryValidationResult["results"]> =
  {};

describe("nestjs-service-module template conformance", () => {
  for (const folderPath of nestjsInstances) {
    const folderName = path.basename(folderPath);

    it(folderName, () => {
      const result = validateInstanceDirectory({
        instanceDirectoryPath: folderPath,
        templateDirectoryPath: NESTJS_TEMPLATES_PATH,
      });
      allResults[folderName] = result.results;

      const errors = collectConformanceErrors([result]);
      expect(errors).toBeNull();
    });
  }
});

// Write machine-readable output after all tests
afterAll(() => {
  const outputDir = path.dirname(RESULTS_OUTPUT_PATH);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(RESULTS_OUTPUT_PATH, JSON.stringify(allResults, null, 2));
});
