import {
  forEachChild,
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
  SyntaxKind,
} from "typescript";

/**
 * Returns all nodes from `nodes` whose identity key matches `templateNode`,
 * which must be keyed. The length of the result signals path ambiguity:
 * zero or one
 */
export function filterBySameKey(
  instanceNodes: Node[],
  templateNode: Node,
): Node[] {
  const templateNodeKey = getKey(templateNode);
  return instanceNodes.filter(
    (instanceNode) => getKey(instanceNode) === templateNodeKey,
  );
}

/**
 * Returns all nodes from `nodes` whose `SyntaxKind` matches `templateNode`.
 */
export function filterBySameKind(
  instanceNodes: Node[],
  templateNode: Node,
): Node[] {
  return instanceNodes.filter(
    (instanceNode) => instanceNode.kind === templateNode.kind,
  );
}

/**
 * Returns the immediate children of a TypeScript AST node as a flat array.
 *
 * Uses `forEachChild` rather than `node.getChildren()` to exclude syntax-list
 * wrapper nodes and raw tokens (punctuation, keywords), giving only the
 * semantically meaningful child nodes that the compiler API exposes.
 *
 * `EndOfFileToken` is excluded because it carries no semantic content. When a
 * template contains only comments (no statements), those comments become
 * leading trivia of the `EndOfFileToken` (pos = 0). The corresponding instance
 * file *does* have statements, so its `EndOfFileToken` sits near the end of
 * the file. Comparing comment positions across the two EOF tokens produces
 * false negatives — the file-level comment appears to be missing even though
 * it is present at position 0. File-level leading comments are already
 * validated at the `SourceFile` node level (both files have pos = 0 there),
 * so skipping the EOF token is safe.
 */
export function getChildren(node: Node): Node[] {
  const children: Node[] = [];
  forEachChild(node, (child) => {
    if (child.kind !== SyntaxKind.EndOfFileToken) {
      children.push(child);
    }
  });
  return children;
}

/**
 * Extracts a canonical string key from a TypeScript AST node — the module
 * specifier for imports/exports, the dotted decorator name, the literal text
 * for literals, or the name identifier for named declarations. Returns `null`
 * when no key can be derived.
 */
export function getKey(node: Node): null | string {
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
