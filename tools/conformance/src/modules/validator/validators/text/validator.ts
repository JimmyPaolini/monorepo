import {
  prepareConformanceTexts,
  type TemplateConformanceArguments,
} from "../common";

import type { ConformanceError } from "../../validator.types";

/**
 * Validates that each rendered template line appears in the instance text,
 * preserving duplicate-line counts.
 */
export function validateTextConformance(args: {
  data: TemplateConformanceArguments["data"];
  filename: TemplateConformanceArguments["filename"];
  instance: TemplateConformanceArguments["instance"];
  template: TemplateConformanceArguments["template"];
}): {
  errors: ConformanceError[];
} {
  const { instance, renderedTemplate } = prepareConformanceTexts(args);
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
 * Builds a multiset of exact lines for duplicate-aware conformance checks.
 */
function buildLineCounts(text: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const line of text.split("\n")) {
    counts.set(line, (counts.get(line) ?? 0) + 1);
  }
  return counts;
}
