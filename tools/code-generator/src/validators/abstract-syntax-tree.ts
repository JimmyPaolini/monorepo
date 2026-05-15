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
  type SourceFile,
  SyntaxKind,
} from "typescript";

import { TODO_LINE_REGEX } from "./constants";

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
 * A node is **keyed** when this function returns a non-`null` string — that
 * string is the node's *identity key*. A node is **keyless** when `null` is
 * returned; it must instead be matched by its kind and structural content.
 *
 * Keyed nodes — representative TypeScript syntax and the identity key returned:
 * ```typescript
 * import { Injectable } from '@nestjs/common' // ImportDeclaration → "@nestjs/common"
 * @Injectable()                                // Decorator         → "Injectable"
 * class DatetimeService { ... }               // ClassDeclaration  → "DatetimeService"
 * getDatetime(): Date { ... }                 // MethodDeclaration → "getDatetime"
 * ```
 *
 * Keyless nodes — no name or specifier to serve as a stable identity:
 * ```typescript
 * { return this.datetime; }        // Block (method body) — anonymous container
 * constructor(private svc: S) {}   // Constructor         — no .name property
 * Date                             // TypeReference       — uses .typeName, not .name
 * () => value                      // ArrowFunction       — anonymous expression
 * ```
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
function isNamedNode(node: Node): node is Node & { name?: Node } {
  return "name" in node;
}

function getKey(node: Node): string | null {
  if (isImportDeclaration(node)) {
    const { moduleSpecifier } = node;
    return isStringLiteral(moduleSpecifier) ? moduleSpecifier.text : null;
  }

  if (isExportDeclaration(node)) {
    const { moduleSpecifier } = node;
    if (moduleSpecifier === undefined) return null;
    return isStringLiteral(moduleSpecifier) ? moduleSpecifier.text : null;
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

  const nameNode = isNamedNode(node) ? node.name : undefined;
  if (nameNode !== undefined) {
    if (isIdentifier(nameNode)) return nameNode.text;
    if (isPrivateIdentifier(nameNode)) return nameNode.text;
    if (isStringLiteral(nameNode)) return nameNode.text;
    if (isNumericLiteral(nameNode)) return nameNode.text;
  }

  return null;
}

/**
 * Returns all nodes from `nodes` whose identity key matches `templateNode`,
 * which must be keyed. The length of the result signals path ambiguity:
 * zero or one
 */
function filterBySameKey(instanceNodes: Node[], templateNode: Node): Node[] {
  const templateNodeKey = getKey(templateNode);
  return instanceNodes.filter(
    (instanceNode) => getKey(instanceNode) === templateNodeKey,
  );
}

/**
 * Returns all nodes from `nodes` whose `SyntaxKind` matches `templateNode`.
 */
function filterBySameKind(instanceNodes: Node[], templateNode: Node): Node[] {
  return instanceNodes.filter(
    (instanceNode) => instanceNode.kind === templateNode.kind,
  );
}

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
function validateComments(args: {
  errors: string[];
  instanceNode: Node;
  side: "pos" | "end";
  templateNode: Node;
}): void {
  const { templateNode, instanceNode, side, errors } = args;
  const templateFile = templateNode.getSourceFile();
  const instanceFile = instanceNode.getSourceFile();
  const templateText = templateFile.text;
  const instanceText = instanceFile.text;
  const templatePosition = templateNode[side];
  const instancePosition = instanceNode[side];

  const templateComments = (
    getLeadingCommentRanges(templateText, templatePosition) ?? []
  )
    .filter((range) => range.kind === SyntaxKind.SingleLineCommentTrivia)
    .map((range) => templateText.slice(range.pos, range.end).trim());
  const instanceComments = (
    getLeadingCommentRanges(instanceText, instancePosition) ?? []
  )
    .filter((range) => range.kind === SyntaxKind.SingleLineCommentTrivia)
    .map((range) => instanceText.slice(range.pos, range.end).trim());

  let startPosition = 0;
  for (const templateComment of templateComments) {
    const endPosition = instanceComments
      .slice(startPosition)
      .findIndex((instanceComment: string): boolean =>
        TODO_LINE_REGEX.test(templateComment)
          ? TODO_LINE_REGEX.test(instanceComment)
          : instanceComment === templateComment,
      );

    if (endPosition === -1) {
      const { line, character } =
        instanceFile.getLineAndCharacterOfPosition(instancePosition);
      errors.push(
        `Missing template comment: "${templateComment}" (line ${line + 1}:${character + 1})`,
      );
    } else {
      startPosition += endPosition + 1;
    }
  }
}

/**
 * Returns `true` when every keyed descendant of the template node is also
 * present in the instance subtree; returns `false` if any is missing.
 *
 * Traverses the template subtree recursively:
 * - **Keyed child**: the instance children must contain a child of the same
 *   kind with the same identity key; if none is found, returns `false`.
 * - **Keyless child, exactly one same-kind instance child**: recurse into that
 *   pair; if recursion returns `false`, returns `false`.
 * - **Keyless child, zero or more than one same-kind instance children**: skip
 *   — which child to recurse into cannot be determined.
 *
 * Used to distinguish a *close structural match* (outer shape correct, only
 * deep content missing) from a *fundamentally wrong instance node* (keyed
 * descendants differ). When multiple same-kind instance children exist and
 * none is a structural superset, inner errors from the closest instance child
 * are only propagated when this function returns `true`.
 */
function allKeyedDescendantsMatch(args: {
  templateNode: Node;
  instanceNode: Node;
}): boolean {
  const { templateNode, instanceNode } = args;
  const templateChildren = getChildren(templateNode);
  const instanceChildren = getChildren(instanceNode);

  for (const templateChild of templateChildren) {
    const templateChildKey = getKey(templateChild);

    // template is keyed: instance children must include one of the same kind and key.
    if (templateChildKey !== null) {
      const sameKeyInstanceChildren = filterBySameKey(
        instanceChildren,
        templateChild,
      );
      if (sameKeyInstanceChildren.length === 0) return false;
      continue;
    }

    // template is keyless: only recurse when exactly one same-kind instance child exists.
    const sameKindInstanceChildren = filterBySameKind(
      instanceChildren,
      templateChild,
    );

    if (sameKindInstanceChildren.length === 1) {
      const singleInstanceChild = sameKindInstanceChildren[0];
      if (
        singleInstanceChild !== undefined &&
        !allKeyedDescendantsMatch({
          templateNode: templateChild,
          instanceNode: singleInstanceChild,
        })
      ) {
        return false;
      }
    }
    // Zero or more than one same-kind instance children: skip.
  }
  return true;
}

/**
 * Finds the instance node that corresponds to `templateNode` within a flat
 * list of same-depth instance nodes.
 *
 * Two nodes are the *same kind* when their `SyntaxKind` values are equal —
 * they represent the same grammatical category of TypeScript syntax (e.g.
 * both `ClassDeclaration`, both `MethodDeclaration`). Kind equality is always
 * a prerequisite before comparing identity keys or structure.
 *
 * Representative `SyntaxKind` values and the TypeScript syntax they correspond to:
 * ```typescript
 * import { Injectable } from '@nestjs/common' // SyntaxKind.ImportDeclaration
 * @Injectable()                                // SyntaxKind.Decorator
 * class DatetimeService { ... }               // SyntaxKind.ClassDeclaration
 * getDatetime(): Date { ... }                 // SyntaxKind.MethodDeclaration
 * DatetimeService                             // SyntaxKind.Identifier (the name token)
 * { return this.datetime; }                   // SyntaxKind.Block
 * ```
 * A `ClassDeclaration` and a `MethodDeclaration` are different kinds even if
 * both are named. Two `MethodDeclaration` nodes are the same kind even if they
 * have different names — their identity keys distinguish them, not their kind.
 *
 * Matching strategy, applied in priority order:
 *
 * 1. **Keyed** — if the template node has an identity key ({@link getKey}
 *    returns non-null), find the first instance node of the same kind with
 *    the same key. This covers named declarations, imports, decorators, and
 *    literals.
 * 2. **Keyless, zero or one same-kind** — return directly: zero → `null`
 *    (absent), one → that node unconditionally.
 * 3. **Keyless, more than one same-kind** — run a throwaway
 *    {@link validateDepthFirstSearch} against each; return the first that
 *    produces zero errors (i.e. is a complete structural superset of the
 *    template subtree).
 *
 * Returns `null` if no strategy finds a match, signalling a missing node to
 * the caller.
 */
function findInstanceNode(args: {
  instanceFile: SourceFile;
  instanceNodes: Node[];
  templateNode: Node;
}): Node | null {
  const { templateNode, instanceNodes, instanceFile } = args;
  const templateNodeKey = getKey(templateNode);

  // template is keyed: find the first same-key instance node.
  if (templateNodeKey !== null) {
    const sameKeyInstanceNodes = filterBySameKey(instanceNodes, templateNode);
    return sameKeyInstanceNodes.length > 0
      ? (sameKeyInstanceNodes[0] ?? null)
      : null;
  }

  // template is keyless: fall back to kind-based matching.
  const sameKindInstanceNodes = filterBySameKind(instanceNodes, templateNode);

  if (sameKindInstanceNodes.length === 0) {
    // Zero same-kind instance nodes: return null (missing).
    return null;
  }

  if (sameKindInstanceNodes.length === 1) {
    // One same-kind instance node: return it directly, no need for structural validation.
    return sameKindInstanceNodes[0] ?? null;
  }

  // More than one same-kind instance node: find any structural superset.
  return (
    sameKindInstanceNodes.find((sameKindInstanceNode) => {
      const errors: string[] = [];
      validateDepthFirstSearch({
        templateNode,
        instanceNode: sameKindInstanceNode,
        errors,
        instanceFile,
      });
      return errors.length === 0;
    }) ?? null
  );
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
 *    {@link findInstanceNode}. A match triggers recursion into that pair.
 * 3. When no match is found and the template child is keyless with more than
 *    one same-kind instance child, each instance child is tested by
 *    a throwaway recursive call and the one with the fewest inner errors is
 *    selected as the closest match. Its inner errors are propagated only if
 *    {@link allKeyedDescendantsMatch} confirms the instance child shares all
 *    of the template's keyed descendants — otherwise a single generic "Missing X" error is
 *    emitted instead.
 * 4. Trailing comments on `templateNode` are validated when the template node
 *    extends beyond its last child (to avoid double-reporting).
 *
 * Recursion bottoms out wherever the template has no children, so empty
 * method bodies and array literals in the instance are never checked.
 */
export function validateDepthFirstSearch(args: {
  errors: string[];
  instanceFile: SourceFile;
  instanceNode: Node;
  templateNode: Node;
}): void {
  const { templateNode, instanceNode, errors, instanceFile } = args;

  validateComments({ templateNode, instanceNode, side: "pos", errors });

  const instanceChildren = getChildren(instanceNode);
  const templateChildren = getChildren(templateNode);

  for (const templateChild of templateChildren) {
    const instanceChild = findInstanceNode({
      templateNode: templateChild,
      instanceNodes: instanceChildren,
      instanceFile,
    });

    if (instanceChild !== null) {
      validateDepthFirstSearch({
        templateNode: templateChild,
        instanceNode: instanceChild,
        errors,
        instanceFile,
      });
      continue;
    }

    const templateChildKey = getKey(templateChild);

    if (templateChildKey === null) {
      // Keyless template child with more than one same-kind instance child:
      // findInstanceNode found no structural superset. Test each instance child
      // of the same kind, then propagate inner errors from the closest match
      // so the error points to the actual mismatch rather than a generic "Missing X".
      const sameKindInstanceChildren = filterBySameKind(
        instanceChildren,
        templateChild,
      );
      if (sameKindInstanceChildren.length > 1) {
        let closestInstanceChild: Node | undefined;
        let closestInstanceChildErrors: string[] = [];
        let fewestErrors = Infinity;
        for (const instanceChildSameKind of sameKindInstanceChildren) {
          const instanceChildErrors: string[] = [];
          validateDepthFirstSearch({
            templateNode: templateChild,
            instanceNode: instanceChildSameKind,
            errors: instanceChildErrors,
            instanceFile,
          });
          if (instanceChildErrors.length < fewestErrors) {
            fewestErrors = instanceChildErrors.length;
            closestInstanceChildErrors = instanceChildErrors;
            closestInstanceChild = instanceChildSameKind;
          }
        }
        // Only propagate inner errors when the closest instance child
        // shares all keyed descendants of the template child. If any keyed
        // descendant is absent the instance child is fundamentally wrong;
        // fall through to a single generic "Missing X" error instead.
        if (
          closestInstanceChild !== undefined &&
          allKeyedDescendantsMatch({
            templateNode: templateChild,
            instanceNode: closestInstanceChild,
          }) &&
          closestInstanceChildErrors.length > 0
        ) {
          errors.push(...closestInstanceChildErrors);
          continue;
        }
      }
    }

    errors.push(
      buildMissingNodeError({ templateChild, instanceNode, instanceFile }),
    );
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

  const error = `${location} Missing ${breadcrumb}${expected}`;
  return error;
}
