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
      fix: `Add the missing ${node.type} to the instance file. See the template for the expected content.`,
      language: "markdown",
      message,
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
    case "blockquote": {
      return make(`Expected blockquote: "${toString(node)}"`);
    }
    case "break":
    case "definition":
    case "footnoteDefinition":
    case "footnoteReference":
    case "imageReference":
    case "inlineMath":
    case "linkReference":
    case "math":
    case "yaml": {
      return make(`Expected ${node.type}: "${toString(node)}"`);
    }
    case "code": {
      const lang = node.lang ?? "(none)";
      return make(`Expected code block (${lang}): "${node.value}"`);
    }
    case "delete": {
      return make(`Expected strikethrough text: "${toString(node)}"`);
    }
    case "emphasis": {
      return make(`Expected italic text: "${toString(node)}"`);
    }
    case "heading": {
      return make(`Expected heading (h${node.depth}): "${toString(node)}"`);
    }
    case "html": {
      return make(`Expected HTML block: "${node.value}"`);
    }
    case "image": {
      const img = node;
      return make(`Expected image "${img.alt ?? ""}" at "${img.url}"`);
    }
    case "inlineCode": {
      return make(`Expected inline code: \`${node.value}\``);
    }
    case "link": {
      return make(`Expected link to "${node.url}": "${toString(node)}"`);
    }
    case "list": {
      return make(`Expected ${node.ordered ? "ordered" : "unordered"} list`);
    }
    case "listItem": {
      return make(`Expected list item: "${toString(node)}"`);
    }
    case "paragraph": {
      return make(`Expected paragraph: "${toString(node)}"`);
    }
    case "strong": {
      return make(`Expected bold text: "${toString(node)}"`);
    }
    case "table": {
      return make(`Expected table`);
    }
    case "tableCell": {
      return make(`Expected table cell: "${toString(node)}"`);
    }
    case "tableRow": {
      return make(`Expected table row: "${toString(node)}"`);
    }
    case "text": {
      return make(`Expected text: "${node.value}"`);
    }
    case "thematicBreak": {
      return make(`Expected thematic break (---)`);
    }
  }
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
    case "blockquote":
    case "delete":
    case "emphasis":
    case "listItem":
    case "paragraph":
    case "strong":
    case "tableCell": {
      return textMatches(toString(template), toString(instance));
    }
    case "break":
    case "definition":
    case "footnoteDefinition":
    case "footnoteReference":
    case "imageReference":
    case "inlineMath":
    case "linkReference":
    case "math":
    case "yaml": {
      return textMatches(toString(template), toString(instance));
    }
    case "code": {
      if (isCode(template) && isCode(instance)) {
        return (
          template.lang === instance.lang &&
          textMatches(template.value, instance.value)
        );
      }
      return false;
    }
    case "heading": {
      if (isHeading(template) && isHeading(instance)) {
        return (
          template.depth === instance.depth &&
          textMatches(toString(template), toString(instance))
        );
      }
      return false;
    }
    case "html": {
      if (isHtml(template) && isHtml(instance)) {
        return textMatches(template.value, instance.value);
      }
      return false;
    }
    case "image": {
      if (isImage(template) && isImage(instance)) {
        return (
          textMatches(template.url, instance.url) &&
          (template.alt ?? "") === (instance.alt ?? "")
        );
      }
      return false;
    }
    case "inlineCode": {
      if (isInlineCode(template) && isInlineCode(instance)) {
        return textMatches(template.value, instance.value);
      }
      return false;
    }
    case "link": {
      if (isLink(template) && isLink(instance)) {
        return (
          textMatches(template.url, instance.url) &&
          textMatches(toString(template), toString(instance))
        );
      }
      return false;
    }
    case "list": {
      if (isList(template) && isList(instance)) {
        return template.ordered === instance.ordered;
      }
      return false;
    }
    case "table": {
      if (isTable(template) && isTable(instance)) {
        const tRow = template.children[0];
        const iRow = instance.children[0];
        if (tRow === undefined || iRow === undefined) return true;
        return tRow.children.length === iRow.children.length;
      }
      return false;
    }
    case "tableRow": {
      // Match rows by cell count so that cell-level errors surface during child
      // recursion rather than being swallowed by a whole-row text mismatch.
      return (
        getNodeChildren(template).length === getNodeChildren(instance).length
      );
    }
    case "text": {
      if (isText(template) && isText(instance)) {
        return textMatches(template.value, instance.value);
      }
      return false;
    }
    case "thematicBreak": {
      return true;
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
