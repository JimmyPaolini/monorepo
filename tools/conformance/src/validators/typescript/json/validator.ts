import { parse } from "jsonc-parser";
import { diff } from "just-diff";
import mustache from "mustache";

import { validateComments } from "./comments";

type JsonValue =
  | boolean
  | null
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

/**
 * Retrieves the value at a path within a JSON-like object.
 */
function getValueAtPath(obj: JsonValue, path: (number | string)[]): JsonValue {
  let current: JsonValue = obj;
  for (const key of path) {
    if (current === null || typeof current !== "object") return null;
    current = Array.isArray(current)
      ? (current[key as number] ?? null)
      : (current[key as string] ?? null);
  }
  return current;
}

/**
 * Formats a diff path array as a readable string (e.g. `["a", "b", 0]` → `"a.b[0]"`).
 */
function formatPath(path: (number | string)[]): string {
  return path.reduce<string>((acc, segment) => {
    if (typeof segment === "number") return `${acc}[${String(segment)}]`;
    return acc === "" ? segment : `${acc}.${segment}`;
  }, "");
}

/**
 * Validates that a generated JSON or JSONC file is a structural superset of
 * its Mustache template and that all template comments are preserved in the
 * instance.
 *
 * **Structural check**: The template is rendered with Mustache then parsed with
 * `jsonc-parser`. Both the rendered template and the instance are compared with
 * `just-diff`. Missing keys (`remove`) and changed values (`replace`) produce
 * errors; extra keys in the instance (`add`) are allowed (superset semantics).
 *
 * **Comment check**: All JSONC comments in the rendered template must appear in
 * the instance in the same relative order. TODO comments match loosely; all
 * others must match exactly.
 */
export function validateJsonConformance(args: {
  data: Record<string, unknown>;
  filename: string;
  instance: string;
  template: string;
}): {
  errors: string[];
} {
  const { instance, template, data } = args;

  const renderedTemplate = mustache.render(template, data);

  // Structural validation
  const templateObj = parse(renderedTemplate) as JsonValue;
  const instanceObj = parse(instance) as JsonValue;

  const structuralErrors: string[] = [];

  for (const { op, path, value } of diff(
    templateObj as Record<string, unknown>,
    instanceObj as Record<string, unknown>,
  )) {
    const pathStr = formatPath(path);
    if (op === "remove") {
      structuralErrors.push(`Missing required key: "${pathStr}"`);
    } else if (op === "replace") {
      const expected = getValueAtPath(templateObj, path);
      structuralErrors.push(
        `Key "${pathStr}": expected ${JSON.stringify(expected)}, got ${JSON.stringify(value)}`,
      );
    }
    // "add" ops are superset — allowed
  }

  // Comment validation
  const commentErrors = validateComments({
    templateText: renderedTemplate,
    instanceText: instance,
  });

  return { errors: [...structuralErrors, ...commentErrors] };
}
