import { getLeadingCommentRanges, type Node, SyntaxKind } from "typescript";

import { TODO_LINE_REGEX } from "./constants";

/**
 * Retrieves the single-line comments in the trivia of a node at a given position.
 */
export function getComments(node: Node, side: "pos" | "end"): string[] {
  const text = node.getSourceFile().text;
  const position = node[side];
  const ranges = getLeadingCommentRanges(text, position) ?? [];
  const comments = ranges
    .filter((range) => range.kind === SyntaxKind.SingleLineCommentTrivia)
    .map((range) => text.slice(range.pos, range.end).trim());
  return comments;
}

/**
 * Checks that every single-line comment in the template node's trivia at
 * `side` also appears in the instance node's trivia at the same position,
 * in the same relative order.
 *
 * Matching is sequential: a cursor advances through the instance comments so
 * that each template comment is found at or after the previous match, preserving
 * comment ordering without requiring the instance to have no extra comments
 * between them.
 *
 * TODO comments are matched loosely — any `// ... TODO ...` line in the
 * instance satisfies a `// ... TODO ...` line in the template, so developers
 * may reword TODO placeholders freely. All other comments must match exactly.
 *
 * @param templateNode - The AST node from the rendered template.
 * @param instanceNode - The corresponding AST node from the generated file.
 * @param side - `"pos"` to inspect leading trivia (start of node), `"end"` for trailing trivia.
 */
export function validateComments(args: {
  instanceNode: Node;
  side: "pos" | "end";
  templateNode: Node;
}): string[] {
  const { templateNode, instanceNode, side } = args;
  const errors: string[] = [];

  const templateComments = getComments(templateNode, side);
  const instanceComments = getComments(instanceNode, side);

  let startPosition = 0;
  for (const templateComment of templateComments) {
    const endPosition = instanceComments
      .slice(startPosition)
      .findIndex((instanceComment: string): boolean => {
        return TODO_LINE_REGEX.test(templateComment)
          ? TODO_LINE_REGEX.test(instanceComment)
          : instanceComment === templateComment;
      });

    if (endPosition === -1) {
      const instanceFile = instanceNode.getSourceFile();
      const instancePosition = instanceNode[side];
      const { line, character } =
        instanceFile.getLineAndCharacterOfPosition(instancePosition);
      const location = `(line ${line + 1}:${character + 1})`;
      errors.push(`${location} Missing comment: "${templateComment}"`);
    } else {
      startPosition += endPosition + 1;
    }
  }

  return errors;
}
