import { toString } from "mdast-util-to-string";
import mustache from "mustache";
import { remark } from "remark";
import remarkGfm from "remark-gfm";

import {
  CONTAINER_TYPES,
  getNodeChildren,
  isCode,
  isHeading,
  isHtml,
  isImage,
  isInlineCode,
  isLink,
  isList,
  isTable,
  isText,
  type MdastNode,
  textMatches,
} from "./nodes";

import type { ConformanceError } from "../types";

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
  const { data, instance, template } = args;

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

// ---------------------------------------------------------------------------
// buildError helpers
// ---------------------------------------------------------------------------

/**
 * Lookup map: node type → function that returns the human-readable error
 * message for a missing node of that type.  Using a map avoids a large
 * switch statement, keeping `buildErrorMessage` below the complexity limit.
 */
const ERROR_MESSAGE_BUILDERS: Partial<
  Record<MdastNode["type"], (node: MdastNode) => string>
> = {
  blockquote: (n) => `Expected blockquote: "${toString(n)}"`,
  break: (n) => `Expected break: "${toString(n)}"`,
  code: (n) =>
    isCode(n)
      ? `Expected code block (${n.lang ?? "(none)"}): "${n.value}"`
      : `Expected code block`,
  definition: (n) => `Expected definition: "${toString(n)}"`,
  delete: (n) => `Expected strikethrough text: "${toString(n)}"`,
  emphasis: (n) => `Expected italic text: "${toString(n)}"`,
  footnoteDefinition: (n) => `Expected footnoteDefinition: "${toString(n)}"`,
  footnoteReference: (n) => `Expected footnoteReference: "${toString(n)}"`,
  heading: (n) =>
    isHeading(n)
      ? `Expected heading (h${n.depth}): "${toString(n)}"`
      : `Expected heading: "${toString(n)}"`,
  html: (n) =>
    isHtml(n) ? `Expected HTML block: "${n.value}"` : `Expected HTML block`,
  image: (n) =>
    isImage(n)
      ? `Expected image "${n.alt ?? ""}" at "${n.url}"`
      : `Expected image`,
  imageReference: (n) => `Expected imageReference: "${toString(n)}"`,
  inlineCode: (n) =>
    isInlineCode(n)
      ? `Expected inline code: \`${n.value}\``
      : `Expected inline code`,
  inlineMath: (n) => `Expected inlineMath: "${toString(n)}"`,
  link: (n) =>
    isLink(n)
      ? `Expected link to "${n.url}": "${toString(n)}"`
      : `Expected link: "${toString(n)}"`,
  linkReference: (n) => `Expected linkReference: "${toString(n)}"`,
  list: (n) =>
    isList(n)
      ? `Expected ${n.ordered ? "ordered" : "unordered"} list`
      : `Expected list`,
  listItem: (n) => `Expected list item: "${toString(n)}"`,
  math: (n) => `Expected math: "${toString(n)}"`,
  paragraph: (n) => `Expected paragraph: "${toString(n)}"`,
  strong: (n) => `Expected bold text: "${toString(n)}"`,
  table: (_n) => `Expected table`,
  tableCell: (n) => `Expected table cell: "${toString(n)}"`,
  tableRow: (n) => `Expected table row: "${toString(n)}"`,
  text: (n) => (isText(n) ? `Expected text: "${n.value}"` : `Expected text`),
  thematicBreak: (_n) => `Expected thematic break (---)`,
  yaml: (n) => `Expected yaml: "${toString(n)}"`,
};

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
  return {
    errorType: "code",
    fix: `Add the missing ${node.type} to the instance file. See the template for the expected content.`,
    language: "markdown",
    message: buildErrorMessage(node),
    ...buildErrorPositions(node, instanceHint),
  };
}

/** Returns the human-readable error message for a missing node. */
function buildErrorMessage(node: MdastNode): string {
  const builder = ERROR_MESSAGE_BUILDERS[node.type];
  return builder ? builder(node) : `Expected ${node.type}: "${toString(node)}"`;
}

/** Assembles the optional position fields for a `ConformanceError`. */
function buildErrorPositions(
  node: MdastNode,
  instanceHint: MdastNode | undefined,
): Partial<ConformanceError> {
  const templateLine = node.position?.start.line;
  const templateColumn = node.position?.start.column;
  const instanceLine =
    instanceHint === undefined
      ? undefined
      : (instanceHint.position?.end.line ?? 1) + 1;
  const instanceColumn = instanceLine === undefined ? undefined : 1;
  return definedEntries({
    instanceColumn,
    instanceLine,
    templateColumn,
    templateLine,
  });
}

/** Filters out undefined values from a record of optional position fields. */
function definedEntries(
  fields: Record<string, number | undefined>,
): Partial<ConformanceError> {
  return Object.fromEntries(
    Object.entries(fields).filter(([, v]) => v !== undefined),
  );
}

// ---------------------------------------------------------------------------
// nodesMatch helpers
// ---------------------------------------------------------------------------

/** Matches node types whose equality is determined purely by text content. */
function matchByText(template: MdastNode, instance: MdastNode): boolean {
  return textMatches(toString(template), toString(instance));
}

/** Matches a code node by language and value. */
function matchCode(template: MdastNode, instance: MdastNode): boolean {
  if (isCode(template) && isCode(instance)) {
    return (
      template.lang === instance.lang &&
      textMatches(template.value, instance.value)
    );
  }
  return false;
}

/** Matches a heading node by depth and text. */
function matchHeading(template: MdastNode, instance: MdastNode): boolean {
  if (isHeading(template) && isHeading(instance)) {
    return (
      template.depth === instance.depth &&
      textMatches(toString(template), toString(instance))
    );
  }
  return false;
}

/** Matches an html node by value. */
function matchHtml(template: MdastNode, instance: MdastNode): boolean {
  if (isHtml(template) && isHtml(instance)) {
    return textMatches(template.value, instance.value);
  }
  return false;
}

/** Matches an image node by url and alt text. */
function matchImage(template: MdastNode, instance: MdastNode): boolean {
  if (isImage(template) && isImage(instance)) {
    return (
      textMatches(template.url, instance.url) &&
      (template.alt ?? "") === (instance.alt ?? "")
    );
  }
  return false;
}

/** Matches an inlineCode node by value. */
function matchInlineCode(template: MdastNode, instance: MdastNode): boolean {
  if (isInlineCode(template) && isInlineCode(instance)) {
    return textMatches(template.value, instance.value);
  }
  return false;
}

/** Matches a link node by url and text content. */
function matchLink(template: MdastNode, instance: MdastNode): boolean {
  if (isLink(template) && isLink(instance)) {
    return (
      textMatches(template.url, instance.url) &&
      textMatches(toString(template), toString(instance))
    );
  }
  return false;
}

/** Matches a list node by ordered flag. */
function matchList(template: MdastNode, instance: MdastNode): boolean {
  if (isList(template) && isList(instance)) {
    return template.ordered === instance.ordered;
  }
  return false;
}

/** Matches a table node by first-row column count. */
function matchTable(template: MdastNode, instance: MdastNode): boolean {
  if (isTable(template) && isTable(instance)) {
    const templateRow = template.children[0];
    const instanceRow = instance.children[0];
    if (templateRow === undefined || instanceRow === undefined) return true;
    return templateRow.children.length === instanceRow.children.length;
  }
  return false;
}

/** Matches a tableRow by child count so cell-level errors surface during recursion. */
function matchTableRow(template: MdastNode, instance: MdastNode): boolean {
  return getNodeChildren(template).length === getNodeChildren(instance).length;
}

/** Matches a text node by value. */
function matchText(template: MdastNode, instance: MdastNode): boolean {
  if (isText(template) && isText(instance)) {
    return textMatches(template.value, instance.value);
  }
  return false;
}

/**
 * Lookup map: node type → matcher function used by `nodesMatch`.
 * Using a map instead of a switch avoids cyclomatic-complexity accumulation.
 */
const NODE_MATCHERS: Partial<
  Record<MdastNode["type"], (t: MdastNode, index: MdastNode) => boolean>
> = {
  blockquote: matchByText,
  break: matchByText,
  code: matchCode,
  definition: matchByText,
  delete: matchByText,
  emphasis: matchByText,
  footnoteDefinition: matchByText,
  footnoteReference: matchByText,
  heading: matchHeading,
  html: matchHtml,
  image: matchImage,
  imageReference: matchByText,
  inlineCode: matchInlineCode,
  inlineMath: matchByText,
  link: matchLink,
  linkReference: matchByText,
  list: matchList,
  listItem: matchByText,
  math: matchByText,
  paragraph: matchByText,
  strong: matchByText,
  table: matchTable,
  tableCell: matchByText,
  tableRow: matchTableRow,
  text: matchText,
  thematicBreak: () => true,
  yaml: matchByText,
};

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
  const matcher = NODE_MATCHERS[template.type];
  return matcher ? matcher(template, instance) : false;
}

// ---------------------------------------------------------------------------
// validateMdastChildren helpers
// ---------------------------------------------------------------------------

/**
 * Among `candidates`, pick the one whose children produce the fewest errors
 * when validated against `templateGrandchildren`.
 * Returns `{ bestCandidate, minimumErrors }`.
 */
function pickBestCandidate(
  templateGrandchildren: readonly MdastNode[],
  candidates: readonly MdastNode[],
): { bestCandidate: MdastNode; minimumErrors: ConformanceError[] } {
  let minimumErrors: ConformanceError[] = [];
  let minimumErrorCount = Infinity;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  let bestCandidate: MdastNode = candidates[0]!;

  for (const candidate of candidates) {
    const childErrors = validateMdastChildren(
      templateGrandchildren,
      getNodeChildren(candidate),
    );
    if (childErrors.length < minimumErrorCount) {
      minimumErrorCount = childErrors.length;
      minimumErrors = childErrors;
      bestCandidate = candidate;
    }
  }

  return { bestCandidate, minimumErrors };
}

/**
 * Processes a single container `templateChild` against `instanceChildren`,
 * returning the errors produced by the best-matching candidate and updating
 * `lastMatchedInstanceNode`.
 */
function processContainerChild(
  templateChild: MdastNode,
  instanceChildren: readonly MdastNode[],
  lastMatchedInstanceNode: MdastNode | undefined,
): {
  errors: ConformanceError[];
  lastMatched: MdastNode | undefined;
} {
  const candidates = instanceChildren.filter((ic) =>
    nodesMatch(templateChild, ic),
  );

  if (candidates.length === 0) {
    return {
      errors: [buildError(templateChild, lastMatchedInstanceNode)],
      lastMatched: lastMatchedInstanceNode,
    };
  }

  const templateGrandchildren = getNodeChildren(templateChild);
  if (templateGrandchildren.length === 0) {
    return { errors: [], lastMatched: candidates.at(-1) };
  }

  const { bestCandidate, minimumErrors } = pickBestCandidate(
    templateGrandchildren,
    candidates,
  );
  return { errors: minimumErrors, lastMatched: bestCandidate };
}

/** Processes a single leaf `templateChild` and returns updated match state. */
function processLeafChild(
  templateChild: MdastNode,
  instanceChildren: readonly MdastNode[],
  lastMatchedInstanceNode: MdastNode | undefined,
): {
  errors: ConformanceError[];
  lastMatched: MdastNode | undefined;
} {
  const candidates = instanceChildren.filter((ic) =>
    nodesMatch(templateChild, ic),
  );
  if (candidates.length === 0) {
    return {
      errors: [buildError(templateChild, lastMatchedInstanceNode)],
      lastMatched: lastMatchedInstanceNode,
    };
  }
  return { errors: [], lastMatched: candidates.at(-1) };
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
  let lastMatchedInstanceNode: MdastNode | undefined;

  for (const templateChild of templateChildren) {
    if (templateChild.type === "text") continue;

    const isContainer = CONTAINER_TYPES.has(templateChild.type);
    const result = isContainer
      ? processContainerChild(
          templateChild,
          instanceChildren,
          lastMatchedInstanceNode,
        )
      : processLeafChild(
          templateChild,
          instanceChildren,
          lastMatchedInstanceNode,
        );

    errors.push(...result.errors);
    lastMatchedInstanceNode = result.lastMatched;
  }

  return errors;
}
