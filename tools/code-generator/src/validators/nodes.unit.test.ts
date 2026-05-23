import {
  type ClassDeclaration,
  createSourceFile,
  forEachChild,
  isClassDeclaration,
  isDecorator,
  isVariableStatement,
  type Node,
  ScriptTarget,
  type SourceFile,
  SyntaxKind,
  type VariableStatement,
} from "typescript";
import { describe, expect, it } from "vitest";

import {
  filterBySameKey,
  filterBySameKind,
  getChildren,
  getKey,
} from "./nodes";

function parseTypescript(code: string): SourceFile {
  return createSourceFile("test.ts", code, ScriptTarget.Latest, true);
}

function statementsOf(code: string): Node[] {
  return getChildren(parseTypescript(code));
}

function defined<T>(value: T | undefined): T {
  if (value === undefined) throw new Error("Expected defined value");
  return value;
}

function assertVariableStatement(node: Node): VariableStatement {
  if (!isVariableStatement(node)) throw new Error("Expected VariableStatement");
  return node;
}

function assertClassDeclaration(node: Node): ClassDeclaration {
  if (!isClassDeclaration(node)) throw new Error("Expected ClassDeclaration");
  return node;
}

function findDecorator(classCode: string): Node {
  const source = parseTypescript(classCode);
  const classDecl = defined(source.statements.at(0));
  let found: Node | undefined;
  forEachChild(classDecl, (child) => {
    if (isDecorator(child)) {
      found = child;
      return child;
    }
    return undefined;
  });
  if (found === undefined) throw new Error("No decorator found");
  return found;
}

describe("getChildren", () => {
  it("returns one child per top-level statement", () => {
    expect(statementsOf("const x = 1;\nconst y = 2;\n")).toHaveLength(2);
  });

  it("returns empty array for source file with no statements", () => {
    expect(statementsOf("")).toHaveLength(0);
  });

  it("never includes EndOfFileToken", () => {
    const children = statementsOf("const x = 1;\n");
    expect(children.every((c) => c.kind !== SyntaxKind.EndOfFileToken)).toBe(
      true,
    );
  });

  it("returns method declarations as children of a class", () => {
    const source = parseTypescript(
      "class Foo { alpha(): void {} beta(): void {} }\n",
    );
    const methods = getChildren(defined(source.statements.at(0))).filter(
      (c) => c.kind === SyntaxKind.MethodDeclaration,
    );
    expect(methods).toHaveLength(2);
  });
});

describe("getKey", () => {
  it("returns module specifier for ImportDeclaration", () => {
    expect(
      getKey(
        defined(
          statementsOf('import { Injectable } from "@nestjs/common";\n').at(0),
        ),
      ),
    ).toBe("@nestjs/common");
  });

  it("returns module specifier for ExportDeclaration with specifier", () => {
    expect(
      getKey(defined(statementsOf('export { x } from "./foo";\n').at(0))),
    ).toBe("./foo");
  });

  it("returns null for ExportDeclaration without module specifier", () => {
    const nodes = statementsOf("const x = 1;\nexport { x };\n");
    expect(getKey(defined(nodes.at(1)))).toBeNull();
  });

  it("returns decorator name for simple Decorator", () => {
    expect(getKey(findDecorator("@Injectable()\nclass Foo {}\n"))).toBe(
      "Injectable",
    );
  });

  it("returns decorator name for non-call Decorator", () => {
    expect(getKey(findDecorator("@Injectable\nclass Foo {}\n"))).toBe(
      "Injectable",
    );
  });

  it("returns qualified name for property-access Decorator", () => {
    expect(
      getKey(findDecorator("@Reflect.metadata('key', 'val')\nclass Foo {}\n")),
    ).toBe("Reflect.metadata");
  });

  it("returns text for Identifier node", () => {
    const source = parseTypescript("class Foo {}\n");
    const identifier = getChildren(defined(source.statements.at(0))).find(
      (c) => c.kind === SyntaxKind.Identifier,
    );
    expect(getKey(defined(identifier))).toBe("Foo");
  });

  it("returns text for StringLiteral node", () => {
    const source = parseTypescript('import { x } from "@nestjs/common";\n');
    const stringLiteral = getChildren(defined(source.statements.at(0))).find(
      (c) => c.kind === SyntaxKind.StringLiteral,
    );
    expect(getKey(defined(stringLiteral))).toBe("@nestjs/common");
  });

  it("returns text for NumericLiteral node", () => {
    const source = parseTypescript("const x = 42;\n");
    const stmt = assertVariableStatement(defined(source.statements.at(0)));
    const decl = defined(stmt.declarationList.declarations.at(0));
    const numLiteral = defined(decl.initializer);
    expect(numLiteral.kind).toBe(SyntaxKind.NumericLiteral);
    expect(getKey(numLiteral)).toBe("42");
  });

  it("returns non-null text for BigIntLiteral node", () => {
    const source = parseTypescript("const x = 42n;\n");
    const stmt = assertVariableStatement(defined(source.statements.at(0)));
    const decl = defined(stmt.declarationList.declarations.at(0));
    const bigIntLiteral = defined(decl.initializer);
    expect(bigIntLiteral.kind).toBe(SyntaxKind.BigIntLiteral);
    expect(getKey(bigIntLiteral)).not.toBeNull();
  });

  it("returns content text for NoSubstitutionTemplateLiteral node", () => {
    const source = parseTypescript("const x = `hello`;\n");
    const stmt = assertVariableStatement(defined(source.statements.at(0)));
    const decl = defined(stmt.declarationList.declarations.at(0));
    const templateLiteral = defined(decl.initializer);
    expect(templateLiteral.kind).toBe(SyntaxKind.NoSubstitutionTemplateLiteral);
    expect(getKey(templateLiteral)).toBe("hello");
  });

  it("returns class name for ClassDeclaration", () => {
    expect(
      getKey(defined(statementsOf("export class DatetimeService {}\n").at(0))),
    ).toBe("DatetimeService");
  });

  it("returns method name for MethodDeclaration", () => {
    const source = parseTypescript("class Foo { getBar(): void {} }\n");
    const classDecl = assertClassDeclaration(defined(source.statements.at(0)));
    const method = defined(classDecl.members.at(0));
    expect(method.kind).toBe(SyntaxKind.MethodDeclaration);
    expect(getKey(method)).toBe("getBar");
  });

  it("returns null for Block node (anonymous container)", () => {
    const source = parseTypescript("class Foo { bar(): void {} }\n");
    const classDecl = assertClassDeclaration(defined(source.statements.at(0)));
    const method = defined(classDecl.members.at(0));
    const block = getChildren(method).find((c) => c.kind === SyntaxKind.Block);
    expect(getKey(defined(block))).toBeNull();
  });

  it("returns null for Constructor node", () => {
    const source = parseTypescript("class Foo { constructor() {} }\n");
    const classDecl = assertClassDeclaration(defined(source.statements.at(0)));
    const ctor = defined(classDecl.members.at(0));
    expect(ctor.kind).toBe(SyntaxKind.Constructor);
    expect(getKey(ctor)).toBeNull();
  });
});

describe("filterBySameKey", () => {
  it("returns nodes whose key matches the template node's key", () => {
    const nodes = statementsOf(
      'import { A } from "@nestjs/common";\nimport { B } from "@nestjs/core";\n',
    );
    const templateNode = defined(
      statementsOf('import { X } from "@nestjs/common";\n').at(0),
    );
    const result = filterBySameKey(nodes, templateNode);
    expect(result).toHaveLength(1);
    expect(getKey(defined(result.at(0)))).toBe("@nestjs/common");
  });

  it("returns empty array when no node matches the template key", () => {
    const nodes = statementsOf('import { A } from "@nestjs/common";\n');
    const templateNode = defined(
      statementsOf('import { X } from "other-module";\n').at(0),
    );
    expect(filterBySameKey(nodes, templateNode)).toHaveLength(0);
  });

  it("returns all nodes that share the same key", () => {
    const nodes = statementsOf(
      'import { A } from "shared";\nimport { B } from "shared";\nimport { C } from "other";\n',
    );
    const templateNode = defined(
      statementsOf('import { X } from "shared";\n').at(0),
    );
    expect(filterBySameKey(nodes, templateNode)).toHaveLength(2);
  });
});

describe("filterBySameKind", () => {
  it("returns only nodes of the same SyntaxKind as the template node", () => {
    const nodes = statementsOf(
      'import { A } from "a";\nconst x = 1;\nimport { B } from "b";\n',
    );
    const templateNode = defined(
      statementsOf('import { X } from "x";\n').at(0),
    );
    const result = filterBySameKind(nodes, templateNode);
    expect(result).toHaveLength(2);
    expect(result.every((n) => n.kind === SyntaxKind.ImportDeclaration)).toBe(
      true,
    );
  });

  it("returns empty array when no node shares the template kind", () => {
    const nodes = statementsOf("const x = 1;\n");
    const templateNode = defined(statementsOf("class Foo {}\n").at(0));
    expect(filterBySameKind(nodes, templateNode)).toHaveLength(0);
  });

  it("returns all nodes when all share the same kind", () => {
    const nodes = statementsOf(
      'import { A } from "a";\nimport { B } from "b";\nimport { C } from "c";\n',
    );
    const templateNode = defined(
      statementsOf('import { X } from "x";\n').at(0),
    );
    expect(filterBySameKind(nodes, templateNode)).toHaveLength(3);
  });
});
