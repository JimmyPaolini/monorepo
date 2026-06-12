import { parse } from "jsonc-parser";
import mustache from "mustache";

import { validateComments } from "./comments";

import type { ConformanceError } from "../types";

type JsonValue =
  | boolean
  | JsonValue[]
  | null
  | number
  | string
  | { [key: string]: JsonValue };

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
  errors: ConformanceError[];
} {
  const { data, instance, template } = args;

  const renderedTemplate = mustache.render(template, data);

  // Structural validation
  const templateObject = parse(renderedTemplate) as JsonValue;
  const instanceObject = parse(instance) as JsonValue;

  const structuralErrors = validateDepthFirstSearch(
    templateObject,
    instanceObject,
  );

  // Comment validation
  const commentErrors = validateComments({
    instanceText: instance,
    templateText: renderedTemplate,
  });

  return { errors: [...structuralErrors, ...commentErrors] };
}

/**
 * Formats a path array as a readable string (e.g. `["a", "b", 0]` → `"a.b[0]"`).
 */
function formatPath(path: (number | string)[]): string {
  return path.reduce<string>((accumulator, segment) => {
    if (typeof segment === "number")
      return `${accumulator}[${String(segment)}]`;
    return accumulator === "" ? segment : `${accumulator}.${segment}`;
  }, "");
}

function isJsonObject(value: JsonValue): value is Record<string, JsonValue> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Recursively compares `template` against `instance`, returning structured
 * `ConformanceError` objects for any missing keys or mismatched values. Extra
 * keys in the instance are silently allowed (superset semantics).
 */
function validateDepthFirstSearch(
  template: JsonValue,
  instance: JsonValue,
  path: (number | string)[] = [],
): ConformanceError[] {
  if (Array.isArray(template) && Array.isArray(instance)) {
    return template.flatMap((item, index) => {
      const itemPath = formatPath([...path, index]);
      return index >= instance.length
        ? [
            {
              errorType: "code" as const,
              fix: `Add the missing array element at index ${String(index)} (path: "${itemPath}") to the instance file.`,
              instancePath: itemPath,
              language: "json" as const,
              message: `Missing required key: "${itemPath}"`,
              templatePath: itemPath,
            },
          ]
        : validateDepthFirstSearch(item, instance[index] ?? null, [
            ...path,
            index,
          ]);
    });
  }

  if (isJsonObject(template) && isJsonObject(instance)) {
    return Object.keys(template).flatMap((key) => {
      const keyPath = formatPath([...path, key]);
      return key in instance
        ? validateDepthFirstSearch(
            template[key] ?? null,
            instance[key] ?? null,
            [...path, key],
          )
        : [
            {
              errorType: "code" as const,
              fix: `Add the missing key "${keyPath}" to the instance file.`,
              instancePath: keyPath,
              language: "json" as const,
              message: `Missing required key: "${keyPath}"`,
              templatePath: keyPath,
            },
          ];
    });
  }

  if (template !== instance) {
    const currentPath = formatPath(path);
    return [
      {
        actual: JSON.stringify(instance),
        errorType: "code" as const,
        expected: JSON.stringify(template),
        fix: `Change the value at "${currentPath}" in the instance file to ${JSON.stringify(template)}.`,
        instancePath: currentPath,
        language: "json" as const,
        message: `Key "${currentPath}": expected ${JSON.stringify(template)}, got ${JSON.stringify(instance)}`,
        templatePath: currentPath,
      },
    ];
  }

  return [];
}
