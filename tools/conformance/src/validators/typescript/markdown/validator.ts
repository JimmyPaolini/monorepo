import { toString } from "mdast-util-to-string";
import mustache from "mustache";
import { remark } from "remark";
import remarkGfm from "remark-gfm";

import { TODO_LINE_REGEX } from "../constants";

import type { ConformanceError } from "../types";
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
type MdastNode =
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
const CONTAINER_TYPES = new Set([
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
function textMatches(templateText: string, instanceText: string): boolean {
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
function getNodeChildren(node: MdastNode): MdastNode[] {
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
 * Returns `true` when `instance` is a valid match for `template`. Matching
 * requires the same `type` and, for most node types, matching identity content
 * (heading depth + text, code language + value, link URL, etc.).
 *
 * `list` nodes match by `ordered` flag only — their items are validated
 * during child recursion. `thematicBreak` nodes match by type alone.
 */
function nodesMatch(template: MdastNode, instance: MdastNode): boolean {
  if (template.type !== instance.type) return false;

  switch (template.type) {
    case "heading": {
      const i = instance as Heading;
      return (
        template.depth === i.depth &&
        textMatches(toString(template), toString(instance))
      );
    }
    case "paragraph":
    case "blockquote":
    case "listItem":
    case "tableCell":
    case "strong":
    case "emphasis":
    case "delete": {
      return textMatches(toString(template), toString(instance));
    }
    case "tableRow": {
      // Match rows by cell count so that cell-level errors surface during child
      // recursion rather than being swallowed by a whole-row text mismatch.
      return (
        getNodeChildren(template).length === getNodeChildren(instance).length
      );
    }
    case "code": {
      const t = template;
      const i = instance as Code;
      return t.lang === i.lang && textMatches(t.value, i.value);
    }
    case "list": {
      const i = instance as List;
      return template.ordered === i.ordered;
    }
    case "table": {
      const t = template as { children: { children: unknown[] }[] };
      const i = instance as { children: { children: unknown[] }[] };
      const tRow = t.children[0];
      const iRow = i.children[0];
      if (tRow === undefined || iRow === undefined) return true;
      return tRow.children.length === iRow.children.length;
    }
    case "thematicBreak": {
      return true;
    }
    case "link": {
      const t = template;
      const i = instance as Link;
      return textMatches(t.url, i.url) && textMatches(toString(t), toString(i));
    }
    case "image": {
      const t = template;
      const i = instance as Image;
      return textMatches(t.url, i.url) && (t.alt ?? "") === (i.alt ?? "");
    }
    case "inlineCode": {
      const i = instance as InlineCode;
      return textMatches(template.value, i.value);
    }
    case "html": {
      const i = instance as Html;
      return textMatches(template.value, i.value);
    }
    case "text": {
      const i = instance as Text;
      return textMatches(template.value, i.value);
    }
    case "yaml":
    case "math":
    case "break":
    case "footnoteReference":
    case "imageReference":
    case "linkReference":
    case "inlineMath":
    case "definition":
    case "footnoteDefinition": {
      return textMatches(toString(template), toString(instance));
    }
  }
}

/**
 * Builds a structured `ConformanceError` for a template node that could not be
 * found in the instance.
 *
 * When `instanceHint` is provided (the last instance node that was matched
 * before this missing node), its end position is used as an "insert after"
 * indicator for the instance file location.
 */
function buildError(
  node: MdastNode,
  instanceHint?: MdastNode,
): ConformanceError {
  const templateLine = node.position?.start.line;
  const templateColumn = node.position?.start.column;

  // Point to the line after the last matched instance node as an insertion hint.
  const instanceLine =
    instanceHint === undefined
      ? undefined
      : (instanceHint.position?.end.line ?? 1) + 1;
  const instanceColumn = instanceLine === undefined ? undefined : 1;

  function make(message: string): ConformanceError {
    const base: ConformanceError = {
      errorType: "code",
      language: "markdown",
      message,
      fix: `Add the missing ${node.type} to the instance file. See the template for the expected content.`,
    };
    return {
      ...base,
      ...(instanceLine === undefined ? {} : { instanceLine }),
      ...(instanceColumn === undefined ? {} : { instanceColumn }),
      ...(templateLine === undefined ? {} : { templateLine }),
      ...(templateColumn === undefined ? {} : { templateColumn }),
    };
  }

  switch (node.type) {
    case "heading": {
      return make(`Expected heading (h${node.depth}): "${toString(node)}"`);
    }
    case "paragraph": {
      return make(`Expected paragraph: "${toString(node)}"`);
    }
    case "code": {
      const lang = node.lang ?? "(none)";
      return make(`Expected code block (${lang}): "${node.value}"`);
    }
    case "blockquote": {
      return make(`Expected blockquote: "${toString(node)}"`);
    }
    case "list": {
      return make(`Expected ${node.ordered ? "ordered" : "unordered"} list`);
    }
    case "listItem": {
      return make(`Expected list item: "${toString(node)}"`);
    }
    case "table": {
      return make(`Expected table`);
    }
    case "tableRow": {
      return make(`Expected table row: "${toString(node)}"`);
    }
    case "tableCell": {
      return make(`Expected table cell: "${toString(node)}"`);
    }
    case "thematicBreak": {
      return make(`Expected thematic break (---)`);
    }
    case "link": {
      return make(`Expected link to "${node.url}": "${toString(node)}"`);
    }
    case "image": {
      const img = node;
      return make(`Expected image "${img.alt ?? ""}" at "${img.url}"`);
    }
    case "strong": {
      return make(`Expected bold text: "${toString(node)}"`);
    }
    case "emphasis": {
      return make(`Expected italic text: "${toString(node)}"`);
    }
    case "delete": {
      return make(`Expected strikethrough text: "${toString(node)}"`);
    }
    case "inlineCode": {
      return make(`Expected inline code: \`${node.value}\``);
    }
    case "html": {
      return make(`Expected HTML block: "${node.value}"`);
    }
    case "text": {
      return make(`Expected text: "${node.value}"`);
    }
    case "yaml":
    case "math":
    case "break":
    case "footnoteReference":
    case "imageReference":
    case "linkReference":
    case "inlineMath":
    case "definition":
    case "footnoteDefinition": {
      return make(`Expected ${node.type}: "${toString(node)}"`);
    }
  }
}

/**
 * Recursively validates that every template child node is present in the
 * corresponding instance children list (superset semantics — the instance may
 * contain extra nodes at every level).
 *
 * Plain `text` nodes are skipped: their content is already captured by the
 * parent node's `textMatches` comparison. Only structurally significant nodes
 * (headings, code, lists, links, inline formatting, etc.) generate errors.
 *
 * For container nodes (blockquote, list, listItem, paragraph, table, tableRow,
 * tableCell), the match with the fewest child-level errors is chosen and its
 * errors are propagated, mirroring the behavior of `validateDepthFirstSearch`
 * in the TypeScript AST validator.
 */
function validateMdastChildren(
  templateChildren: readonly MdastNode[],
  instanceChildren: readonly MdastNode[],
): ConformanceError[] {
  const errors: ConformanceError[] = [];

  // Track the last instance node that was successfully matched so that missing
  // nodes can report a meaningful "insert after" instance location.
  let lastMatchedInstanceNode: MdastNode | undefined;

  for (const templateChild of templateChildren) {
    // Plain text nodes are captured by the parent's textMatches — skip them.
    if (templateChild.type === "text") continue;

    const candidates = instanceChildren.filter((ic) =>
      nodesMatch(templateChild, ic),
    );

    if (candidates.length === 0) {
      errors.push(buildError(templateChild, lastMatchedInstanceNode));
      continue;
    }

    // For leaf node types, a match is sufficient — no child recursion needed.
    if (!CONTAINER_TYPES.has(templateChild.type)) {
      lastMatchedInstanceNode = candidates.at(-1);
      continue;
    }

    const templateGrandchildren = getNodeChildren(templateChild);
    if (templateGrandchildren.length === 0) {
      lastMatchedInstanceNode = candidates.at(-1);
      continue;
    }

    // Pick the candidate whose children produce the fewest errors.
    let minErrors: ConformanceError[] = [];
    let minErrorCount = Infinity;
    const firstCandidate = candidates.at(0);
    if (!firstCandidate) {
      return [];
    }
    let bestCandidate: MdastNode = firstCandidate;

    for (const candidate of candidates) {
      const candidateChildren = getNodeChildren(candidate);
      const childErrors = validateMdastChildren(
        templateGrandchildren,
        candidateChildren,
      );
      if (childErrors.length < minErrorCount) {
        minErrorCount = childErrors.length;
        minErrors = childErrors;
        bestCandidate = candidate;
      }
    }

    lastMatchedInstanceNode = bestCandidate;
    errors.push(...minErrors);
  }

  return errors;
}

/**
 * Validates that a generated Markdown file is a structural superset of its
 * Mustache template by comparing their parsed mdast ASTs node-by-node.
 *
 * The template is rendered with Mustache first, then both the rendered
 * template and the instance are parsed with `remark` into mdast trees. A
 * depth-first walk checks that every significant node in the template exists
 * somewhere in the instance at the same depth (superset semantics — the
 * instance may contain extra headings, sections, lists, etc.).
 *
 * Validated node types include: headings (with depth), fenced code blocks
 * (with language), paragraphs, blockquotes, ordered/unordered lists and their
 * items, tables (column count and cell content), thematic breaks, links
 * (URL + text), images (URL + alt), bold, italic, strikethrough, inline code,
 * and raw HTML blocks.
 *
 * Lines in the template that match `TODO_LINE_REGEX` accept any content in
 * the corresponding instance line (TODO placeholders may be filled with
 * anything).
 */
export function validateMarkdownConformance(args: {
  data: Record<string, unknown>;
  filename: string;
  instance: string;
  template: string;
}): { errors: ConformanceError[] } {
  const { instance, template, data } = args;

  const renderedTemplate = mustache.render(template, data);

  const processor = remark().use(remarkGfm);
  const templateAst = processor.parse(renderedTemplate);
  const instanceAst = processor.parse(instance);

  const errors = validateMdastChildren(
    templateAst.children,
    instanceAst.children,
  );

  return { errors };
}
