import { TODO_LINE_REGEX } from "../constants";

import type {
  Code,
  Heading,
  Html,
  Image,
  InlineCode,
  Link,
  List,
  ListItem,
  PhrasingContent,
  RootContent,
  TableCell,
  TableRow,
  Text,
} from "mdast";

/**
 * Union of all mdast node types that can appear at any level of the tree,
 * including block-level content, inline (phrasing) content, and structural
 * nodes that are only valid inside tables and lists.
 */
export type MdastNode =
  | PhrasingContent
  | RootContent
  | ListItem
  | TableRow
  | TableCell;

/**
 * Node types that act as containers: after a matching node is found in the
 * instance, validation recurses into their children to check sub-structure.
 * Leaf nodes (heading, code, link, etc.) are only checked at the current
 * level — their text content is already captured by the parent match.
 */
export const CONTAINER_TYPES = new Set([
  "blockquote",
  "list",
  "listItem",
  "paragraph",
  "table",
  "tableRow",
  "tableCell",
]);

/**
 * Compares two strings line-by-line. Lines in `templateText` that match
 * TODO_LINE_REGEX are accepted regardless of the corresponding instance line
 * (TODO placeholders may be filled with any content). All other lines must
 * match exactly.
 */
export function textMatches(
  templateText: string,
  instanceText: string,
): boolean {
  const templateLines = templateText.split("\n");
  const instanceLines = instanceText.split("\n");
  if (templateLines.length !== instanceLines.length) return false;
  return templateLines.every((tLine, i) => {
    const iLine = instanceLines[i] ?? "";
    return TODO_LINE_REGEX.test(tLine) || tLine === iLine;
  });
}

/**
 * Returns the children of an mdast node as a `MdastNode[]`, or an empty
 * array for leaf nodes.
 */
export function getNodeChildren(node: MdastNode): MdastNode[] {
  if (
    typeof node === "object" &&
    "children" in node &&
    Array.isArray(node.children)
  ) {
    return node.children;
  }
  return [];
}

/**
 * Type guard functions for narrowing MdastNode types within switch statements.
 * These replace type assertions with proper TypeScript type predicates.
 */

/** Type guard to check if a node is a Heading. */
export function isHeading(node: MdastNode): node is Heading {
  return node.type === "heading";
}

/** Type guard to check if a node is a Code block. */
export function isCode(node: MdastNode): node is Code {
  return node.type === "code";
}

/** Type guard to check if a node is a List. */
export function isList(node: MdastNode): node is List {
  return node.type === "list";
}

/** Type guard to check if a node is a Table. */
export function isTable(node: MdastNode): node is MdastNode & {
  type: "table";
} & { children: { children: unknown[] }[] } {
  return node.type === "table";
}

/** Type guard to check if a node is a Link. */
export function isLink(node: MdastNode): node is Link {
  return node.type === "link";
}

/** Type guard to check if a node is an Image. */
export function isImage(node: MdastNode): node is Image {
  return node.type === "image";
}

/** Type guard to check if a node is inline code. */
export function isInlineCode(node: MdastNode): node is InlineCode {
  return node.type === "inlineCode";
}

/** Type guard to check if a node is raw HTML. */
export function isHtml(node: MdastNode): node is Html {
  return node.type === "html";
}

/** Type guard to check if a node is plain text. */
export function isText(node: MdastNode): node is Text {
  return node.type === "text";
}
