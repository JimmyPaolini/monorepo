/**
 * Markdown AST node types supported by the validator.
 */
export const CONTAINER_TYPES = new Set([
  "blockquote",
  "document",
  "list",
  "listItem",
  "root",
  "table",
  "tableCell",
  "tableRow",
]);

/**
 * Markdown AST node.
 */
export interface MdastNode {
  [key: string]: unknown;
  alt?: string;
  children?: MdastNode[];
  depth?: number;
  lang?: null | string;
  language?: null | string;
  meta?: null | string;
  ordered?: boolean;
  position?: {
    end?: { column?: number; line?: number };
    start?: { column?: number; line?: number };
  };
  spread?: boolean;
  start?: number;
  title?: null | string;
  type: string;
  url?: string;
  value?: string;
}

/**
 * Get node children.
 */
export function getNodeChildren(node: MdastNode): MdastNode[] {
  return node.children ?? [];
}

/**
 * Check if node is code.
 */
export function isCode(node: MdastNode): boolean {
  return node.type === "code";
}

/**
 * Check if node is heading.
 */
export function isHeading(node: MdastNode): boolean {
  return node.type === "heading";
}

/**
 * Check if node is HTML.
 */
export function isHtml(node: MdastNode): boolean {
  return node.type === "html";
}

/**
 * Check if node is image.
 */
export function isImage(node: MdastNode): boolean {
  return node.type === "image";
}

/**
 * Check if node is inline code.
 */
export function isInlineCode(node: MdastNode): boolean {
  return node.type === "inlineCode";
}

/**
 * Check if node is link.
 */
export function isLink(node: MdastNode): boolean {
  return node.type === "link";
}

/**
 * Check if node is list.
 */
export function isList(node: MdastNode): boolean {
  return node.type === "list";
}

/**
 * Check if node is table.
 */
export function isTable(node: MdastNode): boolean {
  return node.type === "table";
}

/**
 * Check if node is text.
 */
export function isText(node: MdastNode): boolean {
  return node.type === "text";
}
