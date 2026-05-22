import { type Node, type SourceFile, SyntaxKind } from "typescript";

import { validateComments } from "./comments";
import {
  filterBySameKey,
  filterBySameKind,
  getChildren,
  getKey,
} from "./nodes";

type KeylessMatch =
  | { outcome: "found"; node: Node }
  | { outcome: "closest-with-errors"; errors: string[] }
  | { outcome: "absent" };

/**
 * Returns `true` when every keyed descendant of the template node is also
 * present in the instance subtree; returns `false` if any is missing.
 *
 * Used as a "structural fingerprint" check: confirms a candidate instance node
 * has the right keyed descendants to be considered the intended match for the
 * template, rather than a structurally unrelated node of the same kind.
 */
function hasMatchingKeyedStructure(args: {
  templateNode: Node;
  instanceNode: Node;
}): boolean {
  const { templateNode, instanceNode } = args;

  const templateChildren = getChildren(templateNode);
  const instanceChildren = getChildren(instanceNode);

  for (const templateChild of templateChildren) {
    const templateChildKey = getKey(templateChild);

    // keyed child: instance must contain one of the same kind and key.
    if (templateChildKey !== null) {
      if (filterBySameKey(instanceChildren, templateChild).length === 0)
        return false;
      continue;
    }

    // keyless child: recurse only when exactly one same-kind instance child exists.
    const sameKind = filterBySameKind(instanceChildren, templateChild);
    if (sameKind.length === 1) {
      const only = sameKind[0];
      if (
        only !== undefined &&
        !hasMatchingKeyedStructure({
          templateNode: templateChild,
          instanceNode: only,
        })
      ) {
        return false;
      }
    }
    // zero or multiple same-kind: cannot determine which to check — skip.
  }

  return true;
}

function findBestCandidate(args: {
  instanceNodes: Node[];
  templateNode: Node;
  instanceFile: SourceFile;
}): { best: Node | undefined; errors: string[] } {
  const { instanceNodes, templateNode, instanceFile } = args;
  let best: Node | undefined;
  let bestErrors: string[] = [];
  let fewest = Infinity;

  for (const instanceNode of instanceNodes) {
    const errors = validateDepthFirstSearch({
      templateNode,
      instanceNode,
      instanceFile,
    });
    if (errors.length < fewest) {
      fewest = errors.length;
      bestErrors = errors;
      best = instanceNode;
    }
  }

  return { best, errors: bestErrors };
}

function findKeyedMatch(
  templateNode: Node,
  instanceNodes: Node[],
): Node | null {
  const sameKey = filterBySameKey(instanceNodes, templateNode);
  return sameKey[0] ?? null;
}

/**
 * Matches a keyless template node against a list of same-depth instance nodes,
 * returning one of three outcomes:
 *
 * - **`found`** — one unambiguous match: either the only same-kind node, or the
 *   first that is a complete structural superset (zero validation errors).
 * - **`closest-with-errors`** — no perfect match, but the candidate with the
 *   fewest errors shares the template's keyed structural fingerprint, meaning it
 *   is the right node with missing content rather than a wrong node entirely.
 *   Its specific errors are propagated in place of a generic "Missing X".
 * - **`absent`** — no viable match: either no same-kind nodes exist, or none
 *   shares the template's keyed structure. Caller should emit "Missing X".
 */
function matchInstanceNodeByKind(args: {
  templateNode: Node;
  instanceNodes: Node[];
  instanceFile: SourceFile;
}): KeylessMatch {
  const { templateNode, instanceNodes, instanceFile } = args;
  const instanceNode = filterBySameKind(instanceNodes, templateNode);

  if (instanceNode.length === 0) return { outcome: "absent" };

  if (instanceNode.length === 1) {
    const only = instanceNode[0];
    if (only === undefined) return { outcome: "absent" };
    return { outcome: "found", node: only };
  }

  // Multiple same-kind candidates: find one that is a complete structural superset.
  const perfectMatch = instanceNode.find(
    (candidate) =>
      validateDepthFirstSearch({
        templateNode,
        instanceNode: candidate,
        instanceFile,
      }).length === 0,
  );
  if (perfectMatch !== undefined)
    return { outcome: "found", node: perfectMatch };

  // No perfect match: propagate the closest candidate's errors only when it
  // shares the template's keyed structural fingerprint.
  const { best, errors } = findBestCandidate({
    instanceNodes: instanceNode,
    templateNode,
    instanceFile,
  });
  if (
    best !== undefined &&
    hasMatchingKeyedStructure({ templateNode, instanceNode: best }) &&
    errors.length > 0
  ) {
    return { outcome: "closest-with-errors", errors };
  }

  return { outcome: "absent" };
}

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
function buildMissingNodeError(args: {
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
      const match = findKeyedMatch(templateChild, instanceChildren);
      if (match === null) {
        errors.push(
          buildMissingNodeError({ templateChild, instanceNode, instanceFile }),
        );
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

    const match = matchInstanceNodeByKind({
      templateNode: templateChild,
      instanceNodes: instanceChildren,
      instanceFile,
    });

    switch (match.outcome) {
      case "found": {
        errors.push(
          ...validateDepthFirstSearch({
            templateNode: templateChild,
            instanceNode: match.node,
            instanceFile,
          }),
        );
        break;
      }
      case "closest-with-errors": {
        errors.push(...match.errors);
        break;
      }
      case "absent": {
        errors.push(
          buildMissingNodeError({ templateChild, instanceNode, instanceFile }),
        );
        break;
      }
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

/**
 * Generic depth-first tree walk that checks every node in `templateNode`'s
 * subtree has a corresponding match in `instanceNode`'s subtree at the same
 * depth (superset semantics — the instance may contain extra nodes).
 *
 * The matching strategy — how to get children, how to match a template child
 * against a set of instance children, and what errors to emit when no match is
 * found — is injected via `options`. Both `findMatch` and `onMissing` receive a
 * `recurse` callback so they can call back into the walk for disambiguation
 * (e.g. running a throwaway pass to find the closest candidate).
 *
 * This function is the reusable skeleton behind {@link validateDepthFirstSearch},
 * which binds the concrete matching strategy into these callbacks.
 *
 * @example
 * ```typescript
 * // Re-expressing validateDepthFirstSearch using walkMatchedPairs:
 * walkMatchedPairs(templateFile, instanceFile, {
 *   getChildren,
 *
 *   findMatch: (templateChild, instanceChildren) => {
 *     if (getKey(templateChild) !== null)
 *       return findKeyedMatch(templateChild, instanceChildren);
 *     const match = matchInstanceNodeByKind({ templateNode: templateChild, instanceNodes: instanceChildren, instanceFile });
 *     return match.outcome === "found" ? match.node : null;
 *   },
 *
 *   onMissing: (templateChild, instanceParent) => {
 *     const match = matchInstanceNodeByKind({
 *       templateNode: templateChild,
 *       instanceNodes: getChildren(instanceParent),
 *       instanceFile,
 *     });
 *     if (match.outcome === "closest-with-errors") return match.errors;
 *     return [buildMissingNodeError({ templateChild, instanceNode: instanceParent, instanceFile })];
 *   },
 *
 *   beforeChildren: (template, instance) =>
 *     validateComments({ templateNode: template, instanceNode: instance, side: "pos" }),
 *
 *   afterChildren: (template, instance) => {
 *     const templateChildren = getChildren(template);
 *     const lastChild = templateChildren.at(-1);
 *     if (lastChild === undefined || lastChild.end < template.end) {
 *       return validateComments({ templateNode: template, instanceNode: instance, side: "end" });
 *     }
 *     return [];
 *   },
 * });
 * ```
 */
export function walkMatchedPairs(
  templateNode: Node,
  instanceNode: Node,
  options: {
    getChildren: (node: Node) => Node[];
    findMatch: (
      template: Node,
      instanceChildren: Node[],
      recurse: (template: Node, instance: Node) => string[],
    ) => Node | null;
    onMissing: (
      template: Node,
      instanceParent: Node,
      recurse: (template: Node, instance: Node) => string[],
    ) => string[];
    beforeChildren?: (template: Node, instance: Node) => string[];
    afterChildren?: (template: Node, instance: Node) => string[];
  },
): string[] {
  const { getChildren, findMatch, onMissing, beforeChildren, afterChildren } =
    options;

  const recurse = (template: Node, instance: Node): string[] =>
    walkMatchedPairs(template, instance, options);

  const errors: string[] = beforeChildren?.(templateNode, instanceNode) ?? [];

  const templateChildren = getChildren(templateNode);
  const instanceChildren = getChildren(instanceNode);

  for (const templateChild of templateChildren) {
    const instanceChild = findMatch(templateChild, instanceChildren, recurse);
    if (instanceChild === null) {
      errors.push(...onMissing(templateChild, instanceNode, recurse));
    } else {
      errors.push(...recurse(templateChild, instanceChild));
    }
  }

  errors.push(...(afterChildren?.(templateNode, instanceNode) ?? []));

  return errors;
}
