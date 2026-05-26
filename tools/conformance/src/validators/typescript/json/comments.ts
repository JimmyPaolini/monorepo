import { visit } from "jsonc-parser";

import { TODO_LINE_REGEX } from "../constants";

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
}): string[] {
  const { templateText, instanceText } = args;
  const errors: string[] = [];

  const templateComments = getComments(templateText);
  const instanceComments = getComments(instanceText);

  let startPosition = 0;
  for (const templateComment of templateComments) {
    const index = instanceComments
      .slice(startPosition)
      .findIndex((instanceComment): boolean =>
        TODO_LINE_REGEX.test(templateComment)
          ? TODO_LINE_REGEX.test(instanceComment)
          : instanceComment === templateComment,
      );

    if (index === -1) {
      errors.push(`Missing comment: "${templateComment}"`);
    } else {
      startPosition += index + 1;
    }
  }

  return errors;
}
