import { parse } from "jsonc-parser";
import mustache from "mustache";

import type { ConformanceError } from "../../validator.types";

/**
 * Describes behavior.
 */
type JsonValue =
  | boolean
  | JsonValue[]
  | null
  | number
  | string
  | { [key: string]: JsonValue };

/**
 * Validates that a generated JSON or JSONC file is a structural superset of
 * its Mustache template.
 *
 * **Structural check**: The template is rendered with Mustache then parsed with
 * `jsonc-parser`. Both the rendered template and the instance are compared with
 * `just-diff`. Missing keys (`remove`) and changed values (`replace`) produce
 * errors; extra keys in the instance (`add`) are allowed (superset semantics).
 */
export function validateJsonConformance(args: {
  data: Record<string, unknown>;
  filename: string;
  instance: string;
  template: string;
}): {
  errors: ConformanceError[];
} {
  const { instance, template } = args;

  const renderedTemplate = mustache.render(template, args.data);

  // Structural validation
  const templateObject = parse(renderedTemplate) as JsonValue;
  const instanceObject = parse(instance) as JsonValue;

  const structuralErrors = validateDepthFirstSearch(
    templateObject,
    instanceObject,
  );

  return { errors: structuralErrors };
}

/**
 * Build mismatch error.
 */
function buildMismatchError(
  path: string,
  template: JsonValue,
  instance: JsonValue,
): ConformanceError {
  return {
    actual: JSON.stringify(instance),
    errorType: "code",
    expected: JSON.stringify(template),
    fix: `Change the value at "${path}" in the instance file to ${JSON.stringify(template)}.`,
    instancePath: path,
    language: "json",
    message: `Key "${path}": expected ${JSON.stringify(template)}, got ${JSON.stringify(instance)}`,
    templatePath: path,
  };
}

/**
 * Build missing error.
 */
function buildMissingError(itemPath: string): ConformanceError {
  return {
    errorType: "code",
    fix: `Add the missing value at "${itemPath}" to the instance file.`,
    instancePath: itemPath,
    language: "json",
    message: `Missing required value: "${itemPath}"`,
    templatePath: itemPath,
  };
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

/**
 * Is json object.
 */
function isJsonObject(value: JsonValue): value is Record<string, JsonValue> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Is json primitive.
 */
function isJsonPrimitive(
  value: JsonValue,
): value is boolean | null | number | string {
  return value === null || typeof value !== "object";
}

/**
 * Recursively compares `template` against `instance`, returning structured
 * `ConformanceError` objects for any missing keys or mismatched values. Extra
 * keys in the instance are silently allowed (superset semantics). Arrays use
 * membership semantics: every template item must appear in the instance, but
 * order and extra items are allowed.
 */
function validateDepthFirstSearch(
  template: JsonValue,
  instance: JsonValue,
  path: (number | string)[] = [],
): ConformanceError[] {
  if (Array.isArray(template) && Array.isArray(instance)) {
    return validateJsonArrays(template, instance, path);
  }

  if (isJsonObject(template) && isJsonObject(instance)) {
    return validateJsonObjects(template, instance, path);
  }

  if (template !== instance) {
    return [buildMismatchError(formatPath(path), template, instance)];
  }

  return [];
}

/**
 * Validate json arrays.
 */
function validateJsonArrays(
  template: JsonValue[],
  instance: JsonValue[],
  path: (number | string)[],
): ConformanceError[] {
  return template.flatMap((templateItem) => {
    const p = formatPath(path);
    if (isJsonPrimitive(templateItem)) {
      return instance.includes(templateItem)
        ? []
        : [buildMissingError(`${p}[${JSON.stringify(templateItem)}]`)];
    }
    // For objects/arrays, find an instance element with the fewest errors
    if (instance.length === 0) {
      return [buildMissingError(p)];
    }
    const candidateErrors = instance.map((instanceItem, index) =>
      validateDepthFirstSearch(templateItem, instanceItem, [...path, index]),
    );
    const best = candidateErrors.reduce((minimum, current) =>
      current.length < minimum.length ? current : minimum,
    );
    return best;
  });
}

/**
 * Validate json objects.
 */
function validateJsonObjects(
  template: Record<string, JsonValue>,
  instance: Record<string, JsonValue>,
  path: (number | string)[],
): ConformanceError[] {
  return Object.keys(template).flatMap((key) => {
    const p = formatPath([...path, key]);
    return key in instance
      ? validateDepthFirstSearch(template[key] ?? null, instance[key] ?? null, [
          ...path,
          key,
        ])
      : [buildMissingError(p)];
  });
}
