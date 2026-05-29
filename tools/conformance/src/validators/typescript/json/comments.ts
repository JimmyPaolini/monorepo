import { visit } from "jsonc-parser";

import { TODO_LINE_REGEX } from "../constants";

import type { ConformanceError } from "../types";

/**
 * Extracts all single-line and block comments from a JSONC string in document
 * order, using the `jsonc-parser` visitor API.
 */
export function getComments(text: string): string[] {
  const comments: string[] = [];
  visit(text, {
    onComment: (offset: number, length: number) => {
      comments.push(text.slice(offset, offset + length).trim());
    },
  });
  return comments;
}

/**
 * Extracts all comments from a JSONC string together with their byte offsets.
 */
function getCommentsWithOffsets(
  text: string,
): { text: string; offset: number }[] {
  const comments: { text: string; offset: number }[] = [];
  visit(text, {
    onComment: (offset: number, length: number) => {
      comments.push({
        text: text.slice(offset, offset + length).trim(),
        offset,
      });
    },
  });
  return comments;
}

/**
 * Converts a byte offset within `text` to a 1-based line number.
 */
function offsetToLine(text: string, offset: number): number {
  return text.slice(0, offset).split("\n").length;
}

/**
 * Validates that every comment present in the rendered template text also
 * appears in the instance text, in the same relative order.
 *
 * Matching is sequential: a cursor advances through the instance comments so
 * that each template comment is found at or after the previous match, preserving
 * ordering without requiring the instance to have no extra comments between them.
 *
 * TODO comments match loosely — any comment containing the word `TODO` in the
 * instance satisfies a template comment that also contains `TODO`. All other
 * comments must match exactly.
 */
export function validateComments(args: {
  instanceText: string;
  templateText: string;
}): ConformanceError[] {
  const { templateText, instanceText } = args;
  const errors: ConformanceError[] = [];

  const templateComments = getCommentsWithOffsets(templateText);
  const instanceComments = getComments(instanceText);

  let startPosition = 0;
  for (const templateComment of templateComments) {
    const index = instanceComments
      .slice(startPosition)
      .findIndex((instanceComment): boolean =>
        TODO_LINE_REGEX.test(templateComment.text)
          ? TODO_LINE_REGEX.test(instanceComment)
          : instanceComment === templateComment.text,
      );

    if (index === -1) {
      const templateLine = offsetToLine(templateText, templateComment.offset);
      errors.push({
        errorType: "comment",
        language: "json",
        message: `Missing comment: "${templateComment.text}"`,
        templateLine,
        expected: templateComment.text,
        fix: `Add the comment \`${templateComment.text}\` to the instance file.`,
      });
    } else {
      startPosition += index + 1;
    }
  }

  return errors;
}
