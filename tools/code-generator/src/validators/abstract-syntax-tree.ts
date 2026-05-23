import { type Node, type SourceFile, SyntaxKind } from "typescript";

import { validateComments } from "./comments";
import {
  filterBySameKey,
  filterBySameKind,
  getChildren,
  getKey,
} from "./nodes";

/**
 * Builds a human-readable error message describing a template node that is
 * absent from the instance.
 *
 * The message includes:
 * - The source location (`line:character`) within the instance file, pointing
 *   at the parent node where the child was expected.
 * - The `SyntaxKind` name of the missing node, and its identity key when one
 *   exists (e.g. `ClassDeclaration "DatetimeService"`).
 * - A condensed snippet of the template node's text so the developer can see
 *   exactly what was expected (whitespace collapsed to a single space).
 */
function buildError(args: {
  instanceFile: SourceFile;
  instanceNode: Node;
  templateChild: Node;
}): string {
  const { templateChild, instanceNode, instanceFile } = args;

  const templateChildKey = getKey(templateChild);

  const { line, character } = instanceFile.getLineAndCharacterOfPosition(
    instanceNode.getStart(instanceFile),
  );
  const location = `(line ${line + 1}:${character + 1})`;

  const kind =
    (SyntaxKind[templateChild.kind] as string | undefined) ??
    `SyntaxKind(${String(templateChild.kind)})`;

  const breadcrumb =
    templateChildKey === null ? kind : `${kind} "${templateChildKey}"`;

  const snippet = templateChild
    .getText(templateChild.getSourceFile())
    .replaceAll(/\s+/gu, " ")
    .trim();
  const expected = snippet.length > 0 ? ` — expected: \`${snippet}\`` : "";

  return `${location} Missing ${breadcrumb}${expected}`;
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
  templateNode: Node;
}): string[] {
  const { templateNode, instanceNode, instanceFile } = args;

  const errors: string[] = validateComments({
    templateNode,
    instanceNode,
    side: "pos",
  });

  const instanceChildren = getChildren(instanceNode);
  const templateChildren = getChildren(templateNode);

  for (const templateChild of templateChildren) {
    if (getKey(templateChild) !== null) {
      // Keyed child: match by identity key.
      const match = filterBySameKey(instanceChildren, templateChild)[0] ?? null;
      if (match === null) {
        errors.push(buildError({ templateChild, instanceNode, instanceFile }));
      } else {
        errors.push(
          ...validateDepthFirstSearch({
            templateNode: templateChild,
            instanceNode: match,
            instanceFile,
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
      const error = buildError({
        templateChild,
        instanceNode,
        instanceFile,
      });
      errors.push(error);
    } else {
      const fewestErrors = instanceChildrenSameKind
        .map((instanceChildSameKind) =>
          validateDepthFirstSearch({
            templateNode: templateChild,
            instanceNode: instanceChildSameKind,
            instanceFile,
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

  // Only check "end" trivia when the parent node extends beyond its last
  // template child. When the last child's end equals the parent's end (e.g.,
  // Constructor.end == Block.end), the child's own "end" call already scanned
  // the same position, so skip to avoid reporting each missing comment twice.
  const lastTemplateChild = templateChildren.at(-1);
  if (
    lastTemplateChild === undefined ||
    lastTemplateChild.end < templateNode.end
  ) {
    errors.push(
      ...validateComments({ templateNode, instanceNode, side: "end" }),
    );
  }

  return errors;
}
