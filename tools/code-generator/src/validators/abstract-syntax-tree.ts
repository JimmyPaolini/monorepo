import {
  forEachChild,
  getLeadingCommentRanges,
  isBigIntLiteral,
  isCallExpression,
  isDecorator,
  isExportDeclaration,
  isIdentifier,
  isImportDeclaration,
  isNoSubstitutionTemplateLiteral,
  isNumericLiteral,
  isPrivateIdentifier,
  isPropertyAccessExpression,
  isStringLiteral,
  type Node,
  type StringLiteral,
  SyntaxKind,
} from "typescript";

import type {
  BuildMissingNodeErrorArgs,
  FindCorrespondingNodeArgs,
  HasMatchingKeyPathArgs,
  ValidateCommentsArgs,
  ValidateDepthFirstSearchArgs,
} from "./types";

/**
 * Returns the immediate children of a TypeScript AST node as a flat array.
 *
 * Uses `forEachChild` rather than `node.getChildren()` to exclude syntax-list
 * wrapper nodes and raw tokens (punctuation, keywords), giving only the
 * semantically meaningful child nodes that the compiler API exposes.
 */
function getChildren(node: Node): Node[] {
  const children: Node[] = [];
  forEachChild(node, (child) => {
    children.push(child);
  });
  return children;
}

/**
 * Returns a stable string key that uniquely identifies a node within a set of
 * siblings of the same `SyntaxKind`, or `null` when no such key is available.
 *
 * Key sources by node type:
 * - `ImportDeclaration` → the module specifier string (e.g. `"@nestjs/common"`)
 * - `ExportDeclaration` → the module specifier string when present (e.g. `"./foo"`)
 * - `Decorator` → the decorator name or qualified name (e.g. `"Injectable"`, `"Reflect.metadata"`)
 * - `Identifier` → the identifier text
 * - `StringLiteral` / `NumericLiteral` / `BigIntLiteral` / `NoSubstitutionTemplateLiteral` → the literal value text
 * - Named declarations (class, function, method, etc.) → the `.name` text, supporting
 *   `Identifier`, `PrivateIdentifier`, `StringLiteral`, and `NumericLiteral` name nodes
 *
 * Nodes that return `null` — anonymous expressions, blocks, type nodes, and
 * other structural containers — must be matched by position or by recursive
 * subtree comparison instead.
 */
function getKey(node: Node): string | null {
  if (isImportDeclaration(node)) {
    return (node.moduleSpecifier as StringLiteral).text;
  }

  if (isExportDeclaration(node)) {
    const { moduleSpecifier } = node;
    return moduleSpecifier === undefined
      ? null
      : (moduleSpecifier as StringLiteral).text;
  }

  if (isDecorator(node)) {
    const callee = isCallExpression(node.expression)
      ? node.expression.expression
      : node.expression;
    const parts: string[] = [];
    let current: Node = callee;
    while (isPropertyAccessExpression(current)) {
      parts.unshift(current.name.text);
      current = current.expression;
    }
    if (!isIdentifier(current)) return null;
    parts.unshift(current.text);
    return parts.join(".");
  }

  if (isIdentifier(node)) {
    return node.text;
  }

  if (isStringLiteral(node)) {
    return node.text;
  }

  if (isNumericLiteral(node)) {
    return node.text;
  }

  if (isBigIntLiteral(node)) {
    return node.text;
  }

  if (isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }

  const nameNode = (node as { name?: Node }).name;
  if (nameNode !== undefined) {
    if (isIdentifier(nameNode)) return nameNode.text;
    if (isPrivateIdentifier(nameNode)) return nameNode.text;
    if (isStringLiteral(nameNode)) return nameNode.text;
    if (isNumericLiteral(nameNode)) return nameNode.text;
  }

  return null;
}

const TODO_LINE_REGEX = /\bTODO\b/u;

/**
 * Checks that every single-line comment in the template node's trivia at
 * `side` also appears in the instance node's trivia at the same position,
 * in the same relative order.
 *
 * Matching is sequential: a cursor advances through the instance comments so
 * that each template comment is found at or after the previous match, preserving
 * comment ordering without requiring the instance to have no extra comments
 * between them.
 *
 * TODO comments are matched loosely — any `// ... TODO ...` line in the
 * instance satisfies a `// ... TODO ...` line in the template, so developers
 * may reword TODO placeholders freely. All other comments must match exactly.
 *
 * @param templateNode - The AST node from the rendered template.
 * @param instanceNode - The corresponding AST node from the generated file.
 * @param side - `"pos"` to inspect leading trivia (start of node), `"end"` for trailing trivia.
 * @param errors - Mutable array to which missing-comment error messages are appended.
 */
function validateComments(args: ValidateCommentsArgs): void {
  const { templateNode, instanceNode, side, errors } = args;
  const templateFile = templateNode.getSourceFile();
  const instanceFile = instanceNode.getSourceFile();
  const templateText = templateFile.text;
  const instanceText = instanceFile.text;
  const templatePos = templateNode[side];
  const instancePos = instanceNode[side];

  const templateComments = (
    getLeadingCommentRanges(templateText, templatePos) ?? []
  )
    .filter((range) => range.kind === SyntaxKind.SingleLineCommentTrivia)
    .map((range) => templateText.slice(range.pos, range.end).trim());
  const instanceComments = (
    getLeadingCommentRanges(instanceText, instancePos) ?? []
  )
    .filter((range) => range.kind === SyntaxKind.SingleLineCommentTrivia)
    .map((range) => instanceText.slice(range.pos, range.end).trim());

  let cursorIndex = 0;
  for (const templateComment of templateComments) {
    const foundIndex = instanceComments
      .slice(cursorIndex)
      .findIndex((instanceComment: string): boolean =>
        TODO_LINE_REGEX.test(templateComment)
          ? TODO_LINE_REGEX.test(instanceComment)
          : instanceComment === templateComment,
      );
    if (foundIndex === -1) {
      const { line, character } =
        instanceFile.getLineAndCharacterOfPosition(instancePos);
      errors.push(
        `Missing template comment: "${templateComment}" (line ${line + 1}:${character + 1})`,
      );
    } else {
      cursorIndex += foundIndex + 1;
    }
  }
}

/**
 * Returns `true` if every identity-keyed node reachable by following
 * unique-kind paths through the template subtree is also present in the
 * instance subtree at the same relative position.
 *
 * Used to distinguish a *close structural match* (outer shape correct, only
 * deep content missing) from a *fundamentally wrong instance node* (identity
 * keys differ along the path). When multiple same-kind instance nodes exist
 * and none is a perfect superset, we only surface inner errors from the
 * closest instance when this function returns `true`.
 *
 * Traversal rules:
 * - **Keyed template child**: the instance must contain a child of the same
 *   kind with the same key; if not found, returns `false` immediately.
 * - **Keyless template child with one same-kind instance child**: recurses into
 *   that unambiguous pair. If recursion returns `false`, the whole function
 *   returns `false`.
 * - **Keyless template child with zero or multiple same-kind instance children**:
 *   the fork is ambiguous and is skipped — neither a match nor a mismatch.
 */
function hasMatchingKeyPath(args: HasMatchingKeyPathArgs): boolean {
  const { templateNode, instanceNode } = args;
  const templateChildren = getChildren(templateNode);
  const instanceChildren = getChildren(instanceNode);

  for (const templateChild of templateChildren) {
    const key = getKey(templateChild);
    if (key === null) {
      // Follow unique-kind paths recursively; skip ambiguous forks.
      const instanceChildrenSameKind = instanceChildren.filter(
        (instanceChild) => instanceChild.kind === templateChild.kind,
      );
      if (
        instanceChildrenSameKind.length === 1 &&
        instanceChildrenSameKind[0] !== undefined
      ) {
        if (
          hasMatchingKeyPath({
            templateNode: templateChild,
            instanceNode: instanceChildrenSameKind[0],
          })
        )
          continue;
        return false;
      }
    } else {
      const found = instanceChildren.some(
        (instanceChild) =>
          instanceChild.kind === templateChild.kind &&
          getKey(instanceChild) === key,
      );
      if (!found) return false;
    }
  }
  return true;
}

/**
 * Recursively walks the template and instance ASTs in lock-step, verifying
 * that every node present in the template also exists somewhere in the instance
 * at the same depth (superset semantics — the instance may contain extra nodes).
 *
 * At each level:
 * 1. Leading comments on `templateNode` are validated against `instanceNode`
 *    via {@link validateComments}.
 * 2. Each template child is matched to an instance child via
 *    {@link findCorrespondingNode}. A match triggers recursion into that pair.
 * 3. When no match is found and the template child is keyless with multiple
 *    same-kind instance candidates, the candidates are each tested by a
 *    throwaway recursive call and the one with the fewest inner errors is
 *    selected as the "best" match. Its inner errors are propagated only if
 *    {@link hasMatchingKeyPath} confirms it shares the template's identity-key
 *    structure — otherwise a single generic "Missing X" error is emitted instead.
 * 4. Trailing comments on `templateNode` are validated when the template node
 *    extends beyond its last child (to avoid double-reporting).
 *
 * Recursion bottoms out wherever the template has no children, so empty
 * method bodies and array literals in the instance are never checked.
 */
export function validateDepthFirstSearch(
  args: ValidateDepthFirstSearchArgs,
): void {
  const { templateNode, instanceNode, errors, instanceFile } = args;

  validateComments({ templateNode, instanceNode, side: "pos", errors });

  const instanceChildren = getChildren(instanceNode);
  const templateChildren = getChildren(templateNode);

  for (const templateChild of templateChildren) {
    const instanceChild = findCorrespondingNode({
      templateNode: templateChild,
      instanceNodes: instanceChildren,
      instanceFile,
    });
    const templateChildKey = getKey(templateChild);

    if (instanceChild === null) {
      // When no identity key is available and multiple same-kind instance
      // nodes exist, findCorrespondingNode uses a structural superset check.
      // If all instance nodes fail, surface the inner errors from the
      // closest-matching instance node so the error points to the actual
      // mismatch rather than reporting a generic "Missing X" at the parent.
      if (templateChildKey === null) {
        const instanceChildrenSameKind = instanceChildren.filter(
          (instanceChild) => instanceChild.kind === templateChild.kind,
        );
        if (instanceChildrenSameKind.length > 1) {
          let bestInstance: Node | undefined;
          let bestErrors: string[] = [];
          let bestErrorCount = Infinity;
          for (const instanceChildSameKind of instanceChildrenSameKind) {
            const instanceErrors: string[] = [];
            validateDepthFirstSearch({
              templateNode: templateChild,
              instanceNode: instanceChildSameKind,
              errors: instanceErrors,
              instanceFile,
            });
            if (instanceErrors.length < bestErrorCount) {
              bestErrorCount = instanceErrors.length;
              bestErrors = instanceErrors;
              bestInstance = instanceChildSameKind;
            }
          }
          // Only propagate inner errors when the closest instance node is a
          // close structural match — every identity-keyed node in the template
          // spine is present in it. If any keyed node is absent the instance
          // node is fundamentally wrong; fall through to a single generic
          // "Missing X" error.
          if (
            bestInstance !== undefined &&
            hasMatchingKeyPath({
              templateNode: templateChild,
              instanceNode: bestInstance,
            }) &&
            bestErrors.length > 0
          ) {
            errors.push(...bestErrors);
            continue;
          }
        }
      }

      errors.push(
        buildMissingNodeError({ templateChild, instanceNode, instanceFile }),
      );
    } else {
      validateDepthFirstSearch({
        templateNode: templateChild,
        instanceNode: instanceChild,
        errors,
        instanceFile,
      });
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
    validateComments({ templateNode, instanceNode, side: "end", errors });
  }
}

/**
 * Finds the instance node that best corresponds to a given template node within
 * a flat list of same-depth candidate nodes.
 *
 * Matching strategy, applied in priority order:
 *
 * 1. **Identity key match** — if {@link getKey} returns a non-null key for the
 *    template node, the first candidate with the same `SyntaxKind` and equal
 *    key is returned. This covers named declarations, imports, decorators, and
 *    literals.
 * 2. **Unique kind** — if exactly one candidate shares the template node's
 *    `SyntaxKind` and no identity key is available, that sole candidate is
 *    returned unconditionally.
 * 3. **Structural superset** — when multiple candidates share the same kind
 *    and no identity key is available, a throwaway {@link validateDepthFirstSearch}
 *    is run against each candidate. The first candidate that produces zero errors
 *    (i.e. is a complete structural superset of the template subtree) is returned.
 *
 * Returns `null` if no strategy finds a match, signalling a missing node to
 * the caller.
 */
function findCorrespondingNode(args: FindCorrespondingNodeArgs): Node | null {
  const { templateNode, instanceNodes, instanceFile } = args;
  const templateNodeKey = getKey(templateNode);

  if (templateNodeKey !== null) {
    return (
      instanceNodes.find((instanceNode) => {
        const isKindMatch = instanceNode.kind === templateNode.kind;
        const instanceNodeKey = getKey(instanceNode);
        const isKeyMatch = instanceNodeKey === templateNodeKey;
        return isKindMatch && isKeyMatch;
      }) ?? null
    );
  }

  const instanceNodesSameKind = instanceNodes.filter((instanceNode) => {
    return instanceNode.kind === templateNode.kind;
  });

  if (instanceNodesSameKind.length <= 1) {
    return instanceNodesSameKind[0] ?? null;
  }

  // Multiple candidates of the same kind with no identity key: find any superset
  return (
    instanceNodesSameKind.find((instanceNodeSameKind) => {
      const errors: string[] = [];
      validateDepthFirstSearch({
        templateNode,
        instanceNode: instanceNodeSameKind,
        errors,
        instanceFile,
      });
      return errors.length === 0;
    }) ?? null
  );
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
function buildMissingNodeError(args: BuildMissingNodeErrorArgs): string {
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

  const error = `${location} Missing ${breadcrumb}${expected}`;
  return error;
}
