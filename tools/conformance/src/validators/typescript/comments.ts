import { getLeadingCommentRanges, type Node, SyntaxKind } from "typescript";

import { TODO_LINE_REGEX } from "./constants";

import type { ConformanceError, ConformanceErrorLanguage } from "./types";

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
 * Retrieves single-line comments at `side` together with their 1-based line
 * and column positions within the source file.
 */
function getCommentsWithPositions(
  node: Node,
  side: "pos" | "end",
): { text: string; line: number; column: number }[] {
  const sourceFile = node.getSourceFile();
  const text = sourceFile.text;
  const position = node[side];
  const ranges = getLeadingCommentRanges(text, position) ?? [];
  return ranges
    .filter((range) => range.kind === SyntaxKind.SingleLineCommentTrivia)
    .map((range) => {
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(
        range.pos,
      );
      return {
        text: text.slice(range.pos, range.end).trim(),
        line: line + 1,
        column: character + 1,
      };
    });
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
 * @param language - The language of the file being validated.
 * @param side - `"pos"` to inspect leading trivia (start of node), `"end"` for trailing trivia.
 */
export function validateComments(args: {
  instanceNode: Node;
  language: ConformanceErrorLanguage;
  side: "pos" | "end";
  templateNode: Node;
}): ConformanceError[] {
  const { templateNode, instanceNode, language, side } = args;
  const errors: ConformanceError[] = [];

  const templateComments = getCommentsWithPositions(templateNode, side);
  const instanceComments = getComments(instanceNode, side);

  const instanceFile = instanceNode.getSourceFile();
  const instancePosition = instanceNode[side];
  const { line: instanceLine, character: instanceCharacter } =
    instanceFile.getLineAndCharacterOfPosition(instancePosition);

  let startPosition = 0;
  for (const templateComment of templateComments) {
    const endPosition = instanceComments
      .slice(startPosition)
      .findIndex((instanceComment: string): boolean => {
        return TODO_LINE_REGEX.test(templateComment.text)
          ? TODO_LINE_REGEX.test(instanceComment)
          : instanceComment === templateComment.text;
      });

    if (endPosition === -1) {
      errors.push({
        errorType: "comment",
        language,
        message: `Missing comment: "${templateComment.text}"`,
        instanceLine: instanceLine + 1,
        instanceColumn: instanceCharacter + 1,
        templateLine: templateComment.line,
        templateColumn: templateComment.column,
        expected: templateComment.text,
        fix: `Add the comment \`${templateComment.text}\` to the instance file at or near line ${instanceLine + 1}.`,
      });
    } else {
      startPosition += endPosition + 1;
    }
  }

  return errors;
}
