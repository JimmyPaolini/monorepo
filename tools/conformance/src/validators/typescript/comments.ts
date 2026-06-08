import { getLeadingCommentRanges, type Node } from "typescript";

import { TODO_LINE_REGEX } from "./constants";

import type { ConformanceError, ConformanceErrorLanguage } from "./types";

/** Regex that matches both `//` single-line and `/* ... *\/` multi-line comments. */
const COMMENT_PATTERN = /\/\/[^\n]*|\/\*[\s\S]*?\*\//g;

/**
 * Retrieves single-line and multi-line comments in the trivia of a node at a
 * given position.
 */
export function getComments(node: Node, side: "end" | "pos"): string[] {
  const text = node.getSourceFile().text;
  const position = node[side];
  const ranges = getLeadingCommentRanges(text, position) ?? [];
  const comments = ranges.map((range) =>
    text.slice(range.pos, range.end).trim(),
  );
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
 * TODO comments are matched loosely — a template comment containing `TODO`
 * matches **any** comment in the instance (whether still a TODO or replaced
 * with real content), so developers may freely reword or replace TODO
 * placeholders. All other comments must match exactly.
 *
 * @param templateNode - The AST node from the rendered template.
 * @param instanceNode - The corresponding AST node from the generated file.
 * @param language - The language of the file being validated.
 * @param side - `"pos"` to inspect leading trivia (start of node), `"end"` for trailing trivia.
 */
export function validateComments(args: {
  instanceNode: Node;
  language: ConformanceErrorLanguage;
  side: "end" | "pos";
  templateNode: Node;
}): ConformanceError[] {
  const { instanceNode, language, side, templateNode } = args;
  const errors: ConformanceError[] = [];

  const templateComments = getCommentsWithPositions(templateNode, side);
  const instanceText = instanceNode.getSourceFile().text;
  const instanceStart = instanceNode[side];
  const instanceScopeEnd = findEnclosingScopeEnd(instanceNode, instanceStart);
  const instanceComments = getAllCommentsInRange(
    instanceText,
    instanceStart,
    instanceScopeEnd,
  );

  // For TODO template comments not found in the node's immediate trivia range,
  // also search the region between the parent node's start and this node's start.
  // This handles the case where a JSDoc is placed before an intermediary
  // decorator (e.g. `@Global()` between the JSDoc and `@Module()`): the JSDoc
  // lives in the class's leading trivia, not in `@Module`'s direct trivia, yet
  // it still satisfies the TODO placeholder in the template.
  const parentStart = (instanceNode.parent as Node | undefined)?.pos ?? -1;
  const ancestorRangeComments =
    parentStart >= 0 && parentStart < instanceStart
      ? getAllCommentsInRange(instanceText, parentStart, instanceStart)
      : [];

  const instanceFile = instanceNode.getSourceFile();
  const instancePosition = instanceNode[side];
  const { character: instanceCharacter, line: instanceLine } =
    instanceFile.getLineAndCharacterOfPosition(instancePosition);

  let startPosition = 0;
  for (const templateComment of templateComments) {
    const endPosition = instanceComments
      .slice(startPosition)
      .findIndex((instanceComment: string): boolean => {
        // A TODO template comment matches any comment — the developer may have
        // reworded the TODO or replaced it with real documentation entirely.
        return TODO_LINE_REGEX.test(templateComment.text)
          ? true
          : instanceComment === templateComment.text;
      });

    if (endPosition === -1) {
      // For TODO template comments, also check comments in the ancestor's
      // leading trivia range (before this node's own trivia starts). This
      // satisfies the case where the developer placed a JSDoc before an
      // intermediary decorator rather than directly before this node.
      if (
        TODO_LINE_REGEX.test(templateComment.text) &&
        ancestorRangeComments.length > 0
      ) {
        continue;
      }

      errors.push({
        errorType: "comment",
        expected: templateComment.text,
        fix: `Add the comment \`${templateComment.text}\` to the instance file at or near line ${instanceLine + 1}.`,
        instanceColumn: instanceCharacter + 1,
        instanceLine: instanceLine + 1,
        language,
        message: `Missing comment: "${templateComment.text}"`,
        templateColumn: templateComment.column,
        templateLine: templateComment.line,
      });
    } else {
      startPosition += endPosition + 1;
    }
  }

  return errors;
}

/**
 * Walks up the parent chain from `node` to find the `end` position of the
 * nearest ancestor that extends beyond `position`. Falls back to the source
 * file length when no such ancestor exists.
 */
function findEnclosingScopeEnd(node: Node, position: number): number {
  for (
    let current = node.parent as Node | undefined;
    current !== undefined;
    current = current.parent as Node | undefined
  ) {
    if (current.end > position) return current.end;
  }
  return node.getSourceFile().text.length;
}

/**
 * Collects all single-line `//` and multi-line `/* ... *\/` comments appearing
 * in the text range [start, end], regardless of any intervening non-comment code.
 */
function getAllCommentsInRange(
  text: string,
  start: number,
  end: number,
): string[] {
  const slice = text.slice(start, end);
  const comments: string[] = [];
  for (const match of slice.matchAll(COMMENT_PATTERN)) {
    comments.push(match[0].trim());
  }
  return comments;
}

/**
 * Retrieves single-line and multi-line comments at `side` together with their
 * 1-based line and column positions within the source file.
 */
function getCommentsWithPositions(
  node: Node,
  side: "end" | "pos",
): { column: number; line: number; text: string }[] {
  const sourceFile = node.getSourceFile();
  const text = sourceFile.text;
  const position = node[side];
  const ranges = getLeadingCommentRanges(text, position) ?? [];
  return ranges.map((range) => {
    const { character, line } = sourceFile.getLineAndCharacterOfPosition(
      range.pos,
    );
    return {
      column: character + 1,
      line: line + 1,
      text: text.slice(range.pos, range.end).trim(),
    };
  });
}
