import { getNodeValue, parseTree } from "jsonc-parser";
import { diff } from "just-diff";

import type { ConformanceError } from "./types";

/**
 * Validates a JSON or JSONC instance file against an expected (template-rendered) file.
 *
 * Uses `jsonc-parser` for comment-aware parsing and `just-diff` to compute a
 * JSON Patch operation list. Maps:
 * - `remove` → `missing_key` (key present in expected, absent in instance)
 * - `replace` → `wrong_value`
 * - `add` → ignored (extra keys in instance are allowed)
 *
 * For JSONC files, also validates that comments present in the expected output
 * exist in the instance at the same structural path.
 *
 * @param file - Relative filename (used in error `file` field).
 * @param expectedContent - The template-rendered expected file content.
 * @param actualContent - The actual instance file content.
 * @returns Array of conformance errors (empty if the file conforms).
 */
export function validateJsonFile(
  file: string,
  expectedContent: string,
  actualContent: string,
): ConformanceError[] {
  const errors: ConformanceError[] = [];

  const expectedValue = parseJsoncValue(expectedContent);
  const actualValue = parseJsoncValue(actualContent);

  if (
    expectedValue === undefined ||
    actualValue === undefined ||
    typeof expectedValue !== "object" ||
    expectedValue === null ||
    typeof actualValue !== "object" ||
    actualValue === null
  ) {
    return errors;
  }

  // Use just-diff to compute the JSON Patch between expected and actual.
  // We diff in the direction expected→actual to get what's missing/changed.
  const patches = diff(
    expectedValue as object | unknown[],
    actualValue as object | unknown[],
  );

  for (const patch of patches) {
    if (patch.op === "add") {
      // Extra keys in the instance are allowed — skip
      continue;
    }

    const keyPath = patch.path.join(".");

    if (patch.op === "remove") {
      errors.push({
        kind: "missing_key",
        file,
        expected: `key "${keyPath}" with value ${JSON.stringify(patch.value)}`,
        found: null,
        hint: `Add the key "${keyPath}" to the file`,
      });
    } else {
      errors.push({
        kind: "wrong_value",
        file,
        expected: `"${keyPath}": ${JSON.stringify(patch.value)}`,
        found: `"${keyPath}": ${JSON.stringify(getNestedValue(actualValue, patch.path))}`,
        hint: `Change the value of "${keyPath}" to ${JSON.stringify(patch.value)}`,
      });
    }
  }

  // Validate JSONC comments for .jsonc files
  if (file.endsWith(".jsonc")) {
    validateJsoncComments(file, expectedContent, actualContent, errors);
  }

  return errors;
}

/** Parse a JSONC string to a plain JS value, returning undefined on parse error. */
function parseJsoncValue(content: string): unknown {
  const errors: unknown[] = [];
  const tree = parseTree(content, errors as Parameters<typeof parseTree>[1]);
  if (errors.length > 0 || !tree) return undefined;
  return getNodeValue(tree);
}

/** Get a nested value by a JSON Patch path array. */
function getNestedValue(obj: unknown, path: (string | number)[]): unknown {
  let current: unknown = obj;
  for (const key of path) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string | number, unknown>)[key];
  }
  return current;
}

/** Validate that JSONC comments in expected content exist in the instance. */
function validateJsoncComments(
  file: string,
  expectedContent: string,
  actualContent: string,
  errors: ConformanceError[],
): void {
  const parseErrors: unknown[] = [];

  const expectedTree = parseTree(
    expectedContent,
    parseErrors as Parameters<typeof parseTree>[1],
    { disallowComments: false },
  );
  const actualTree = parseTree(
    actualContent,
    parseErrors as Parameters<typeof parseTree>[1],
    { disallowComments: false },
  );

  if (!expectedTree || !actualTree) return;

  // Walk all string nodes in expected; find comment-like preceding trivia
  // by scanning the raw text for comment patterns above key-value pairs.
  const expectedLines = expectedContent.split("\n");
  const actualLines = actualContent.split("\n");

  const expectedComments = extractCommentLines(expectedLines);
  const actualComments = new Set(extractCommentLines(actualLines));

  for (const comment of expectedComments) {
    if (isTodoComment(comment)) continue;
    if (!actualComments.has(comment)) {
      errors.push({
        kind: "missing_comment",
        file,
        expected: comment,
        found: null,
        hint: `Add the comment '${comment}' in the JSONC file`,
      });
    }
  }
}

/** Extract comment lines (line and block comment style) from an array of source lines. */
function extractCommentLines(lines: string[]): string[] {
  return lines
    .map((line) => line.trim())
    .filter((line) => line.startsWith("//") || line.startsWith("/*"));
}

function isTodoComment(text: string): boolean {
  return text
    .replace(/^\/\/+\s*|^\/\*+\s*/, "")
    .trimStart()
    .toLowerCase()
    .startsWith("todo");
}

// Re-export for use in tests
export { findNodeAtLocation } from "jsonc-parser";
