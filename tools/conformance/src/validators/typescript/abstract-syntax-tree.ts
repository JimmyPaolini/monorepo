import { type Node, type SourceFile, SyntaxKind } from "typescript";

import {
  filterBySameKey,
  filterBySameKind,
  getChildren,
  getKey,
} from "./nodes";

import type { ConformanceError, ConformanceErrorLanguage } from "./types";

/**
 * Resolved error location.
 */
interface ResolvedErrorLocation {
  breadcrumb: string;
  instanceCharacter: number;
  instanceLine: number;
  snippet: string;
  templateCharacter: number;
  templateLine: number;
}

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
  const instanceChildren = getChildren(instanceNode);
  const templateChildren = getChildren(templateNode);
  const errors: ConformanceError[] = [];
  for (const templateChild of templateChildren) {
    errors.push(
      ...validateTemplateChild({
        instanceChildren,
        instanceFile,
        instanceNode,
        language,
        templateChild,
      }),
    );
  }
  return errors;
}

/**
 * Build error.
 */
function buildError(args: {
  instanceFile: SourceFile;
  instanceNode: Node;
  language: ConformanceErrorLanguage;
  templateChild: Node;
}): ConformanceError {
  const { instanceFile, instanceNode, language, templateChild } = args;
  const {
    breadcrumb,
    instanceCharacter,
    instanceLine,
    snippet,
    templateCharacter,
    templateLine,
  } = resolveErrorLocations({ instanceFile, instanceNode, templateChild });
  return {
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
function resolveErrorLocations(args: {
  instanceFile: SourceFile;
  instanceNode: Node;
  templateChild: Node;
}): ResolvedErrorLocation {
  const { instanceFile, instanceNode, templateChild } = args;
  const templateFile = templateChild.getSourceFile();
  const instancePos = instanceFile.getLineAndCharacterOfPosition(
    instanceNode.getStart(instanceFile),
  );
  const templatePos = templateFile.getLineAndCharacterOfPosition(
    templateChild.getStart(),
  );
  const kind =
    (SyntaxKind[templateChild.kind] as string | undefined) ??
    `SyntaxKind(${String(templateChild.kind)})`;
  const key = getKey(templateChild);
  return {
    breadcrumb: key === null ? kind : `${kind} "${key}"`,
    instanceCharacter: instancePos.character,
    instanceLine: instancePos.line,
    snippet: templateChild
      .getText(templateFile)
      .replaceAll(/\s+/gu, " ")
      .trim(),
    templateCharacter: templatePos.character,
    templateLine: templatePos.line,
  };
}

/**
 * Validate keyed child.
 */
function validateKeyedChild(args: {
  instanceChildren: Node[];
  instanceFile: SourceFile;
  instanceNode: Node;
  language: ConformanceErrorLanguage;
  templateChild: Node;
}): ConformanceError[] {
  const {
    instanceChildren,
    instanceFile,
    instanceNode,
    language,
    templateChild,
  } = args;

  const match = filterBySameKey(instanceChildren, templateChild)[0] ?? null;
  if (match === null) {
    return [
      buildError({ instanceFile, instanceNode, language, templateChild }),
    ];
  }

  return validateDepthFirstSearch({
    instanceFile,
    instanceNode: match,
    language,
    templateNode: templateChild,
  });
}

/**
 * Validate keyless child.
 */
function validateKeylessChild(args: {
  instanceChildren: Node[];
  instanceFile: SourceFile;
  instanceNode: Node;
  language: ConformanceErrorLanguage;
  templateChild: Node;
}): ConformanceError[] {
  const sameKind = filterBySameKind(args.instanceChildren, args.templateChild);

  if (sameKind.length === 0) {
    return [buildError(args)];
  }

  return sameKind
    .map((child) =>
      validateDepthFirstSearch({
        instanceFile: args.instanceFile,
        instanceNode: child,
        language: args.language,
        templateNode: args.templateChild,
      }),
    )
    .reduce((minimumErrors, currentErrors) =>
      currentErrors.length < minimumErrors.length
        ? currentErrors
        : minimumErrors,
    );
}

/**
 * Validate template child.
 */
function validateTemplateChild(args: {
  instanceChildren: Node[];
  instanceFile: SourceFile;
  instanceNode: Node;
  language: ConformanceErrorLanguage;
  templateChild: Node;
}): ConformanceError[] {
  const {
    instanceChildren,
    instanceFile,
    instanceNode,
    language,
    templateChild,
  } = args;
  if (getKey(templateChild) !== null) {
    return validateKeyedChild({
      instanceChildren,
      instanceFile,
      instanceNode,
      language,
      templateChild,
    });
  }
  return validateKeylessChild({
    instanceChildren,
    instanceFile,
    instanceNode,
    language,
    templateChild,
  });
}
