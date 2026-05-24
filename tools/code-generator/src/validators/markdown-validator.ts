import remarkParse from "remark-parse";
import { unified } from "unified";

import type { ConformanceError } from "./types";

/** A node in the Markdown AST tree. */
interface MdastNode {
  type: string;
  children?: MdastNode[];
  value?: string;
  depth?: number;
  lang?: string | null;
  ordered?: boolean;
}

/** Root node type. */
interface MdastRoot {
  type: "root";
  children: MdastNode[];
}

/**
 * Validates a Markdown instance file against an expected (template-rendered) file
 * using `remark-parse` for structural comparison.
 *
 * Checks:
 * - Required headings are present with the correct text and depth, in order.
 * - Required content blocks (paragraphs, code blocks with language) are present in order.
 * - Paragraphs without template variables must match exactly; paragraphs with variables
 *   only need to be present.
 * - Required HTML comments are present.
 *
 * @param file - Relative filename (used in error `file` field).
 * @param expectedContent - The template-rendered expected file content.
 * @param actualContent - The actual instance file content.
 * @returns Array of conformance errors (empty if the file conforms).
 */
export function validateMarkdownFile(
  file: string,
  expectedContent: string,
  actualContent: string,
): ConformanceError[] {
  const errors: ConformanceError[] = [];

  const expectedAst = parseMarkdown(expectedContent);
  const actualAst = parseMarkdown(actualContent);

  const expectedNodes = expectedAst.children;
  const actualNodes = actualAst.children;

  // Walk expected nodes in order; each must appear in actuals in order
  let actualCursor = 0;

  for (const expectedNode of expectedNodes) {
    const result = findMatchingNode(expectedNode, actualNodes, actualCursor);
    if (result === -1) {
      const description = describeNode(expectedNode);
      errors.push({
        kind: "missing_section",
        file,
        expected: description,
        found: null,
        hint: `Add the ${expectedNode.type} '${description}' to the file`,
      });
    } else {
      actualCursor = result + 1;
    }
  }

  // Validate HTML comments
  validateHtmlComments(file, expectedContent, actualContent, errors);

  return errors;
}

function parseMarkdown(content: string): MdastRoot {
  return unified().use(remarkParse).parse(content) as MdastRoot;
}

/**
 * Finds the index of the first node in `actuals` at or after `startIndex` that
 * matches the `expected` node. Returns -1 if not found.
 */
function findMatchingNode(
  expected: MdastNode,
  actuals: MdastNode[],
  startIndex: number,
): number {
  for (let i = startIndex; i < actuals.length; i++) {
    const actual = actuals[i];
    // actual is always defined since i < actuals.length; undefined guard satisfies noUncheckedIndexedAccess
    if (actual !== undefined && nodesMatch(expected, actual)) {
      return i;
    }
  }
  return -1;
}

function nodesMatch(expected: MdastNode, actual: MdastNode): boolean {
  if (expected.type !== actual.type) return false;

  if (expected.type === "heading" && actual.type === "heading") {
    if (expected.depth !== actual.depth) return false;
    const expectedText = extractText(expected);
    const actualText = extractText(actual);
    return normalizeText(expectedText) === normalizeText(actualText);
  }

  if (expected.type === "paragraph" && actual.type === "paragraph") {
    const expectedText = extractText(expected);
    const actualText = extractText(actual);
    // If the template paragraph contains Mustache-style variable references
    // (leftover braces are not possible since we receive rendered content, but
    // we check if the text was purely static), require exact match.
    // Since we receive rendered content, we always require a match — but we
    // use normalized comparison to tolerate minor whitespace differences.
    return normalizeText(expectedText) === normalizeText(actualText);
  }

  if (expected.type === "code" && actual.type === "code") {
    if (expected.lang !== actual.lang) return false;
    return (
      normalizeText(expected.value ?? "") === normalizeText(actual.value ?? "")
    );
  }

  if (expected.type === "list" && actual.type === "list") {
    return extractText(expected) === extractText(actual);
  }

  if (expected.type === "html" && actual.type === "html") {
    return (
      normalizeHtmlComment(expected.value ?? "") ===
      normalizeHtmlComment(actual.value ?? "")
    );
  }

  return true;
}

/** Extract text content from a node recursively. */
function extractText(node: MdastNode): string {
  if ("value" in node && typeof node.value === "string") {
    return node.value;
  }
  if ("children" in node && Array.isArray(node.children)) {
    return node.children.map((child: MdastNode) => extractText(child)).join("");
  }
  return "";
}

function normalizeText(text: string): string {
  return text.trim().replaceAll(/\s+/g, " ");
}

function normalizeHtmlComment(html: string): string {
  return html.trim().replaceAll(/\s+/g, " ");
}

function describeNode(node: MdastNode): string {
  if (node.type === "heading" && "depth" in node) {
    return `${"#".repeat(node.depth)} ${extractText(node)}`;
  }
  if (node.type === "code" && "lang" in node) {
    return `\`\`\`${node.lang ?? ""} code block`;
  }
  const text = extractText(node);
  return text.length > 60 ? `${text.slice(0, 60)}...` : text;
}

/**
 * Validates that HTML comments in the expected content also appear in the actual.
 * TODO comments are excluded.
 */
function validateHtmlComments(
  file: string,
  expectedContent: string,
  actualContent: string,
  errors: ConformanceError[],
): void {
  const expectedComments = extractHtmlComments(expectedContent);
  const actualComments = new Set(extractHtmlComments(actualContent));

  for (const comment of expectedComments) {
    if (isTodoComment(comment)) continue;
    if (!actualComments.has(comment)) {
      errors.push({
        kind: "missing_comment",
        file,
        expected: `<!-- ${comment} -->`,
        found: null,
        hint: `Add the HTML comment '<!-- ${comment} -->' to the file`,
      });
    }
  }
}

/** Extract the inner text of all HTML comments from a markdown string. */
function extractHtmlComments(content: string): string[] {
  const regex = /<!--([\s\S]*?)-->/g;
  const comments: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    const inner = match[1];
    if (inner !== undefined) {
      comments.push(inner.trim());
    }
  }
  return comments;
}

function isTodoComment(text: string): boolean {
  return text.trimStart().toLowerCase().startsWith("todo");
}
