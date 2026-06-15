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
  const { instanceText, templateText } = args;
  const errors: ConformanceError[] = [];

  const templateComments = getCommentsWithOffsets(templateText);
  const instanceComments = getComments(instanceText);

  let startPosition = 0;
  for (const templateComment of templateComments) {
    const index = findMatchingComment(
      instanceComments,
      startPosition,
      templateComment.text,
    );

    if (index === -1) {
      errors.push(buildMissingCommentError(templateText, templateComment));
    } else {
      startPosition += index + 1;
    }
  }

  return errors;
}

/**
 * Builds a ConformanceError for a template comment that could not be found in the instance.
 */
function buildMissingCommentError(
  templateText: string,
  templateComment: { offset: number; text: string },
): ConformanceError {
  const templateLine = offsetToLine(templateText, templateComment.offset);
  return {
    errorType: "comment",
    expected: templateComment.text,
    fix: `Add the comment \`${templateComment.text}\` to the instance file.`,
    language: "json",
    message: `Missing comment: "${templateComment.text}"`,
    templateLine,
  };
}

/**
 * Finds the first comment in `instanceComments` at or after `startPosition`
 * that matches `templateText`, using loose matching for TODO comments.
 */
function findMatchingComment(
  instanceComments: string[],
  startPosition: number,
  templateText: string,
): number {
  return instanceComments
    .slice(startPosition)
    .findIndex((instanceComment): boolean =>
      TODO_LINE_REGEX.test(templateText)
        ? TODO_LINE_REGEX.test(instanceComment)
        : instanceComment === templateText,
    );
}

/**
 * Extracts all comments from a JSONC string together with their byte offsets.
 */
function getCommentsWithOffsets(
  text: string,
): { offset: number; text: string }[] {
  const comments: { offset: number; text: string }[] = [];
  visit(text, {
    onComment: (offset: number, length: number) => {
      comments.push({
        offset,
        text: text.slice(offset, offset + length).trim(),
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
