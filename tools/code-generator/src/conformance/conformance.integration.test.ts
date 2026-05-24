import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import mustache from "mustache";
import { afterAll, describe, it } from "vitest";

import { TEMPLATES_DIRECTORY_PATH as NESTJS_TEMPLATES_PATH } from "../generators/nestjs-service-module/generator";
import { nameVariables } from "../name-variables";

import { validateJsonFile } from "./json-validator";
import { validateMarkdownFile } from "./markdown-validator";
import { formatConformanceErrors } from "./types";
import { validateTypeScriptFile } from "./typescript-validator";

import type { ConformanceError } from "./types";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

/**
 * Workspace root resolved relative to this test file location:
 * tools/code-generator/src/conformance → ../../../../ = workspace root
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
    .filter(
      (entry) =>
        entry.isDirectory() &&
        !entry.name.startsWith(".") &&
        !entry.name.endsWith(".test.ts"),
    )
    .map((entry) => path.join(directoryPath, entry.name));
}

/**
 * Read all template files from a directory and return a map from
 * the resolved output filename to the raw template content.
 */
function loadTemplates(
  templateDir: string,
  vars: Record<string, string>,
): Map<string, string> {
  const result = new Map<string, string>();
  for (const entry of fs.readdirSync(templateDir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const outputFilename = entry.name.replaceAll(
      /__(\w+)__/g,
      (_: string, field: string) => vars[field] ?? "",
    );
    const templateContent = fs.readFileSync(
      path.join(templateDir, entry.name),
      "utf8",
    );
    const rendered = mustache.render(templateContent, vars);
    result.set(outputFilename, rendered);
  }
  return result;
}

/** Validate folder structure (missing / unexpected files). */
function validateFolderStructure(
  folderPath: string,
  expectedFiles: Set<string>,
  actualFiles: Set<string>,
): ConformanceError[] {
  const errors: ConformanceError[] = [];

  for (const expected of expectedFiles) {
    if (!actualFiles.has(expected)) {
      errors.push({
        kind: "missing_file",
        file: expected,
        expected: `file ${expected} to be present in ${path.basename(folderPath)}`,
        found: null,
        hint: `Create the file '${expected}' in the folder`,
      });
    }
  }

  for (const actual of actualFiles) {
    if (!expectedFiles.has(actual)) {
      errors.push({
        kind: "unexpected_file",
        file: actual,
        expected: `no file named ${actual} in ${path.basename(folderPath)}`,
        found: actual,
        hint: `Remove or rename '${actual}' — it is not produced by the generator`,
      });
    }
  }

  return errors;
}

/** Validate a single file using the appropriate per-language validator. */
function validateFile(
  file: string,
  expectedContent: string,
  actualContent: string,
): ConformanceError[] {
  if (file.endsWith(".ts") || file.endsWith(".tsx")) {
    return validateTypeScriptFile(file, expectedContent, actualContent);
  }
  if (file.endsWith(".json") || file.endsWith(".jsonc")) {
    return validateJsonFile(file, expectedContent, actualContent);
  }
  if (file.endsWith(".md") || file.endsWith(".mdx")) {
    return validateMarkdownFile(file, expectedContent, actualContent);
  }
  return [];
}

/**
 * Run full conformance validation for an instance folder against a set of templates.
 * Returns all errors found.
 */
function validateInstanceFolder(
  folderPath: string,
  templateDir: string,
): ConformanceError[] {
  const folderName = path.basename(folderPath);
  const vars = nameVariables(folderName);

  // Load and render templates
  const expectedTemplates = loadTemplates(templateDir, vars);

  // Discover actual files (only the file types the templates produce)
  const templateExtensions = new Set(
    [...expectedTemplates.keys()].map((f) => path.extname(f)),
  );
  const actualFiles = new Set(
    fs
      .readdirSync(folderPath, { withFileTypes: true })
      .filter((e) => e.isFile() && templateExtensions.has(path.extname(e.name)))
      .map((e) => e.name),
  );

  const allErrors: ConformanceError[] = [];

  // 1. Folder structure validation
  const structureErrors = validateFolderStructure(
    folderPath,
    new Set(expectedTemplates.keys()),
    actualFiles,
  );
  allErrors.push(...structureErrors);

  // 2. File content validation
  const missingFiles = new Set(
    structureErrors.filter((e) => e.kind === "missing_file").map((e) => e.file),
  );

  for (const [filename, expectedContent] of expectedTemplates) {
    if (missingFiles.has(filename)) continue;
    const actualFilePath = path.join(folderPath, filename);
    if (!fs.existsSync(actualFilePath)) continue;
    const actualContent = fs.readFileSync(actualFilePath, "utf8");
    const fileErrors = validateFile(filename, expectedContent, actualContent);
    allErrors.push(...fileErrors);
  }

  return allErrors;
}

// ─── Test suite ──────────────────────────────────────────────────────────────

const nestjsInstances = discoverInstanceFolders(CAELUNDAS_MODULES_PATH);

/** Accumulated results across all folders — written to JSON output after all tests run. */
const allResults: Record<string, ConformanceError[]> = {};

describe("nestjs-service-module template conformance", () => {
  for (const folderPath of nestjsInstances) {
    const folderName = path.basename(folderPath);

    describe(folderName, () => {
      let errors: ConformanceError[];

      it("structure: all expected files are present", () => {
        errors = validateInstanceFolder(folderPath, NESTJS_TEMPLATES_PATH);
        allResults[folderName] = errors;

        // Only fail on missing_file — unexpected extra files are reported
        // in the JSON output but do not break CI (modules legitimately grow
        // beyond the generator template).
        const failureErrors = errors.filter((e) => e.kind === "missing_file");

        if (failureErrors.length > 0) {
          throw new Error(
            formatConformanceErrors(
              path.relative(WORKSPACE_ROOT, folderPath),
              failureErrors,
            ),
          );
        }
      });

      it("content: all files conform to the template", () => {
        const contentErrors = (allResults[folderName] ?? []).filter(
          (e) => e.kind !== "missing_file" && e.kind !== "unexpected_file",
        );

        if (contentErrors.length > 0) {
          throw new Error(
            formatConformanceErrors(
              path.relative(WORKSPACE_ROOT, folderPath),
              contentErrors,
            ),
          );
        }
      });
    });
  }
});

// Write machine-readable output after all tests
afterAll(() => {
  const outputDir = path.dirname(RESULTS_OUTPUT_PATH);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(RESULTS_OUTPUT_PATH, JSON.stringify(allResults, null, 2));
});
