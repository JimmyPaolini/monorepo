import mustache from "mustache";

import type { ConformanceError } from "../types";

/**
 *
 */
export function validateTextConformance(args: {
  data: Record<string, unknown>;
  filename: string;
  instance: string;
  template: string;
}): {
  errors: ConformanceError[];
} {
  const { data, instance, template } = args;

  const renderedTemplate = mustache.render(template, data);
  const instanceLineCounts = buildLineCounts(instance);

  const errors: ConformanceError[] = [];
  const templateLines = renderedTemplate.split("\n");
  for (const [index, line] of templateLines.entries()) {
    const count = instanceLineCounts.get(line) ?? 0;
    if (count === 0) {
      errors.push({
        errorType: "code",
        expected: line,
        fix: `Add the line \`${line}\` to the instance file.`,
        language: "text",
        message: `Missing line: ${line}`,
        templateLine: index + 1,
      });
    } else {
      instanceLineCounts.set(line, count - 1);
    }
  }

  return { errors };
}

/**
 * Validates that a generated text file is a superset of its Mustache template
 * by checking that every line in the rendered template is present in the
 * instance.
 *
 * **Line semantics**: Lines are compared verbatim — no trimming is applied and
 * blank lines in the template are treated as required. The instance may contain
 * additional lines not in the template (superset), but it must include every
 * template line at least as many times as the template contains it (multiset
 * semantics, so duplicate template lines each require a corresponding instance
 * line).
 *
 * Use this function when `template` and `instance` are already in memory.
 */
function buildLineCounts(text: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const line of text.split("\n")) {
    counts.set(line, (counts.get(line) ?? 0) + 1);
  }
  return counts;
}
