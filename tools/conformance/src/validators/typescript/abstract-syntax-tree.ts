import { type Node, type SourceFile, SyntaxKind } from "typescript";

import { validateComments } from "./comments";
import {
  filterBySameKey,
  filterBySameKind,
  getChildren,
  getKey,
} from "./nodes";

import type { ConformanceError, ConformanceErrorLanguage } from "./types";

/**
 * Recursively walks the template and instance ASTs in lock-step, verifying
 * that every node present in the template also exists somewhere in the instance
 * at the same depth (superset semantics — the instance may contain extra nodes).
 *
 * For keyed template children the instance is searched by identity key.
 * For keyless template children all same-kind instance candidates are evaluated
 * by recursing into each; the candidate with the fewest errors is chosen and
 * its errors are propagated.
 *
 * Recursion bottoms out wherever the template has no children, so empty
 * method bodies and array literals in the instance are never checked.
 */
export function validateDepthFirstSearch(args: {
  instanceFile: SourceFile;
  instanceNode: Node;
  language: ConformanceErrorLanguage;
  templateNode: Node;
}): ConformanceError[] {
  const { instanceFile, instanceNode, language, templateNode } = args;

  const errors: ConformanceError[] = validateComments({
    instanceNode,
    language,
    side: "pos",
    templateNode,
  });

  const instanceChildren = getChildren(instanceNode);
  const templateChildren = getChildren(templateNode);

  for (const templateChild of templateChildren) {
    if (getKey(templateChild) !== null) {
      // Keyed child: match by identity key.
      const match = filterBySameKey(instanceChildren, templateChild)[0] ?? null;
      if (match === null) {
        errors.push(
          buildError({ instanceFile, instanceNode, language, templateChild }),
        );
      } else {
        errors.push(
          ...validateDepthFirstSearch({
            instanceFile,
            instanceNode: match,
            language,
            templateNode: templateChild,
          }),
        );
      }
      continue;
    }

    // Keyless child: match by kind, picking the candidate with the fewest errors.
    const instanceChildrenSameKind = filterBySameKind(
      instanceChildren,
      templateChild,
    );

    if (instanceChildrenSameKind.length === 0) {
      errors.push(
        buildError({ instanceFile, instanceNode, language, templateChild }),
      );
    } else {
      const fewestErrors = instanceChildrenSameKind
        .map((instanceChildSameKind) =>
          validateDepthFirstSearch({
            instanceFile,
            instanceNode: instanceChildSameKind,
            language,
            templateNode: templateChild,
          }),
        )
        .reduce((fewestErrors, instanceChildErrors) =>
          instanceChildErrors.length < fewestErrors.length
            ? instanceChildErrors
            : fewestErrors,
        );

      errors.push(...fewestErrors);
    }
  }

  // Only scan "end" trivia for empty blocks (no template children). When a
  // node has children, its trailing comments are either covered by the last
  // child's own "end" scan or the next sibling's "pos" scan. Scanning from
  // `templateNode.end` for non-empty nodes would re-check the same trivia
  // region (e.g. Constructor.end == Block.end), reporting the same missing
  // comments twice.
  const lastTemplateChild = templateChildren.at(-1);
  if (lastTemplateChild === undefined) {
    errors.push(
      ...validateComments({
        instanceNode,
        language,
        side: "end",
        templateNode,
      }),
    );
  }

  return errors;
}

/**
 * Builds a structured `ConformanceError` describing a template node that is
 * absent from the instance.
 *
 * Captures:
 * - The source location within the instance file (where the child was expected).
 * - The source location within the template file (where the missing node lives).
 * - The `SyntaxKind` name of the missing node and its identity key when present.
 * - A condensed snippet of the template node's text as the `expected` value.
 */
function buildError(args: {
  instanceFile: SourceFile;
  instanceNode: Node;
  language: ConformanceErrorLanguage;
  templateChild: Node;
}): ConformanceError {
  const { instanceFile, instanceNode, language, templateChild } = args;

  const templateChildKey = getKey(templateChild);

  const { character: instanceCharacter, line: instanceLine } =
    instanceFile.getLineAndCharacterOfPosition(
      instanceNode.getStart(instanceFile),
    );

  const templateFile = templateChild.getSourceFile();
  const { character: templateCharacter, line: templateLine } =
    templateFile.getLineAndCharacterOfPosition(templateChild.getStart());

  const kind =
    (SyntaxKind[templateChild.kind] as string | undefined) ??
    `SyntaxKind(${String(templateChild.kind)})`;

  const breadcrumb =
    templateChildKey === null ? kind : `${kind} "${templateChildKey}"`;

  const snippet = templateChild
    .getText(templateFile)
    .replaceAll(/\s+/gu, " ")
    .trim();

  const error: ConformanceError = {
    errorType: "code",
    fix: `Add the missing ${breadcrumb} to the instance file. See the template for the expected structure.`,
    instanceColumn: instanceCharacter + 1,
    instanceLine: instanceLine + 1,
    language,
    message: `Missing ${breadcrumb}`,
    templateColumn: templateCharacter + 1,
    templateLine: templateLine + 1,
    ...(snippet.length > 0 ? { expected: snippet } : {}),
  };
  return error;
}
