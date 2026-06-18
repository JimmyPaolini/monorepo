import {
  forEachChild,
  getLeadingCommentRanges,
  getTrailingCommentRanges,
  type Node,
  type SourceFile,
} from "typescript";

import { TODO_LINE_REGEX } from "./constants";

import type { ConformanceError, ConformanceErrorLanguage } from "./types";

/**
 * Comment info.
 */
interface CommentInfo {
  column: number;
  line: number;
  pos: number;
  text: string;
}

/**
 * Validates that every comment in the template file also appears in the
 * instance file in the same relative sequential order.
 *
 * TODO comments are matched loosely — a template comment containing `TODO`
 * matches **any** comment in the instance (whether still a TODO or replaced
 * with real content). All other comments must match exactly.
 */
export function validateAllComments(args: {
  instanceFile: SourceFile;
  language: ConformanceErrorLanguage;
  templateFile: SourceFile;
}): ConformanceError[] {
  const { instanceFile, language, templateFile } = args;
  const errors: ConformanceError[] = [];
  const templateComments = extractAllComments(templateFile);
  const instanceComments = extractAllComments(instanceFile);
  let startPosition = 0;
  for (const templateComment of templateComments) {
    const endPosition = instanceComments
      .slice(startPosition)
      .findIndex((c) => matchesTemplateComment(templateComment, c));
    if (endPosition === -1) {
      errors.push(createMissingCommentError(templateComment, language));
    } else {
      startPosition += endPosition + 1;
    }
  }
  return errors;
}

/**
 * Create missing comment error.
 */
function createMissingCommentError(
  templateComment: CommentInfo,
  language: ConformanceErrorLanguage,
): ConformanceError {
  return {
    errorType: "comment",
    expected: templateComment.text,
    fix: `Add the comment \`${templateComment.text}\` to the instance file.`,
    instanceColumn: 1,
    instanceLine: 1,
    language,
    message: `Missing comment: "${templateComment.text}"`,
    templateColumn: templateComment.column,
    templateLine: templateComment.line,
  };
}

/**
 * Walks the AST to extract all genuine comments in the file, avoiding string literals.
 */
function extractAllComments(
  sourceFile: SourceFile,
): { column: number; line: number; pos: number; text: string }[] {
  const text = sourceFile.text;
  const commentsMap = new Map<
    number,
    { column: number; line: number; pos: number; text: string }
  >();

  /**
   * Extract.
   */
  function extract(node: Node): void {
    const leading = getLeadingCommentRanges(text, node.pos) ?? [];
    const trailing = getTrailingCommentRanges(text, node.end) ?? [];

    for (const range of [...leading, ...trailing]) {
      if (!commentsMap.has(range.pos)) {
        const { character, line } = sourceFile.getLineAndCharacterOfPosition(
          range.pos,
        );
        commentsMap.set(range.pos, {
          column: character + 1,
          line: line + 1,
          pos: range.pos,
          text: text.slice(range.pos, range.end).trim(),
        });
      }
    }
    forEachChild(node, extract);
  }

  extract(sourceFile);

  return [...commentsMap.values()].toSorted((a, b) => a.pos - b.pos);
}

/**
 * Matches template comment.
 */
function matchesTemplateComment(
  templateComment: CommentInfo,
  instanceComment: CommentInfo,
): boolean {
  return TODO_LINE_REGEX.test(templateComment.text)
    ? true
    : instanceComment.text === templateComment.text;
}
