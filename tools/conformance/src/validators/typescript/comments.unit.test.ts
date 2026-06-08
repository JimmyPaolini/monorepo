import {
  createSourceFile,
  isCallExpression,
  isClassDeclaration,
  isDecorator,
  isIdentifier,
  type Node,
  ScriptTarget,
  type SourceFile,
} from "typescript";
import { describe, expect, it } from "vitest";

import { getComments, validateComments } from "./comments";

function firstStatement(code: string): Node {
  const stmt = parseTypescript(code).statements.at(0);
  if (stmt === undefined) throw new Error("No statement found");
  return stmt;
}

/**
 * Returns the decorator with the given name from the first class declaration
 * in the source, or throws if not found.
 */
function namedDecorator(code: string, decoratorName: string): Node {
  const sf = parseTypescript(code);
  const classDecl = sf.statements.find((s) => isClassDeclaration(s));
  if (classDecl === undefined) throw new Error("No class declaration found");
  const modifiers = classDecl.modifiers;
  if (modifiers === undefined) throw new Error("No modifiers found");
  const decorator = modifiers.find(
    (m) =>
      isDecorator(m) &&
      (() => {
        const expr = m.expression;
        if (isIdentifier(expr)) return expr.text === decoratorName;
        if (isCallExpression(expr)) {
          const callee = expr.expression;
          return isIdentifier(callee) && callee.text === decoratorName;
        }
        return false;
      })(),
  );
  if (decorator === undefined)
    throw new Error(`Decorator @${decoratorName} not found`);
  return decorator;
}

function parseTypescript(code: string): SourceFile {
  return createSourceFile("test.ts", code, ScriptTarget.Latest, true);
}

describe("getComments", () => {
  it("returns empty array when node has no leading comments", () => {
    expect(getComments(firstStatement("const x = 1;\n"), "pos")).toEqual([]);
  });

  it("returns single-line comment in leading trivia", () => {
    expect(
      getComments(firstStatement("// hello\nconst x = 1;\n"), "pos"),
    ).toEqual(["// hello"]);
  });

  it("returns multiple single-line comments in order", () => {
    expect(
      getComments(firstStatement("// first\n// second\nconst x = 1;\n"), "pos"),
    ).toEqual(["// first", "// second"]);
  });

  it("includes block comments", () => {
    expect(
      getComments(firstStatement("/* block comment */\nconst x = 1;\n"), "pos"),
    ).toEqual(["/* block comment */"]);
  });

  it("trims trailing whitespace from comment text", () => {
    expect(
      getComments(firstStatement("//   spaced   \nconst x = 1;\n"), "pos"),
    ).toEqual(["//   spaced"]);
  });

  it("returns comment on a new line after node end position", () => {
    expect(
      getComments(
        firstStatement("const x = 1;\n// end note\nconst y = 2;\n"),
        "end",
      ),
    ).toEqual(["// end note"]);
  });

  it("returns empty array when no comment follows on a new line", () => {
    expect(
      getComments(firstStatement("const x = 1;\nconst y = 2;\n"), "end"),
    ).toEqual([]);
  });

  it("does not return inline trailing comments (not on a new line)", () => {
    expect(
      getComments(
        firstStatement("const x = 1; // inline\nconst y = 2;\n"),
        "end",
      ),
    ).toEqual([]);
  });
});

describe("validateComments", () => {
  it("returns no errors when template has no comments", () => {
    expect(
      validateComments({
        instanceNode: firstStatement("const x = 1;\n"),
        language: "typescript",
        side: "pos",
        templateNode: firstStatement("const x = 1;\n"),
      }),
    ).toEqual([]);
  });

  it("returns no errors when instance has all template comments", () => {
    expect(
      validateComments({
        instanceNode: firstStatement("// section\nconst x = 1;\n"),
        language: "typescript",
        side: "pos",
        templateNode: firstStatement("// section\nconst x = 1;\n"),
      }),
    ).toEqual([]);
  });

  it("returns error for each missing template comment", () => {
    const errors = validateComments({
      instanceNode: firstStatement("const x = 1;\n"),
      language: "typescript",
      side: "pos",
      templateNode: firstStatement("// section\nconst x = 1;\n"),
    });
    expect(errors).toHaveLength(1);
    expect(errors.at(0)?.message).toContain('Missing comment: "// section"');
  });

  it("returns no errors when instance has extra comments around template comments", () => {
    expect(
      validateComments({
        instanceNode: firstStatement("// extra\n// required\nconst x = 1;\n"),
        language: "typescript",
        side: "pos",
        templateNode: firstStatement("// required\nconst x = 1;\n"),
      }),
    ).toEqual([]);
  });

  it("enforces relative order — out-of-order template comment fails", () => {
    const errors = validateComments({
      instanceNode: firstStatement("// second\n// first\nconst x = 1;\n"),
      language: "typescript",
      side: "pos",
      templateNode: firstStatement("// first\n// second\nconst x = 1;\n"),
    });
    expect(errors).toHaveLength(1);
    expect(errors.at(0)?.message).toContain('Missing comment: "// second"');
  });

  it("matches any TODO comment when template comment contains TODO", () => {
    expect(
      validateComments({
        instanceNode: firstStatement(
          "// TODO: completely different wording\nconst x = 1;\n",
        ),
        language: "typescript",
        side: "pos",
        templateNode: firstStatement("// TODO: placeholder\nconst x = 1;\n"),
      }),
    ).toEqual([]);
  });

  it("requires exact match for non-TODO comments", () => {
    const errors = validateComments({
      instanceNode: firstStatement("// different comment\nconst x = 1;\n"),
      language: "typescript",
      side: "pos",
      templateNode: firstStatement("// exact comment\nconst x = 1;\n"),
    });
    expect(errors).toHaveLength(1);
    expect(errors.at(0)?.message).toContain(
      'Missing comment: "// exact comment"',
    );
  });

  it("includes source location in error object", () => {
    const errors = validateComments({
      instanceNode: firstStatement("const x = 1;\n"),
      language: "typescript",
      side: "pos",
      templateNode: firstStatement("// missing\nconst x = 1;\n"),
    });
    const error = errors.at(0);
    expect(error?.instanceLine).toBeTypeOf("number");
    expect(error?.templateLine).toBeTypeOf("number");
  });

  it("detects missing comment on new line after node when side is end", () => {
    const errors = validateComments({
      instanceNode: firstStatement("const x = 1;\nconst y = 2;\n"),
      language: "typescript",
      side: "end",
      templateNode: firstStatement("const x = 1;\n// end note\nconst y = 2;\n"),
    });
    expect(errors).toHaveLength(1);
    expect(errors.at(0)?.message).toContain('Missing comment: "// end note"');
  });

  it("returns no errors when side-end instance has the matching new-line comment", () => {
    expect(
      validateComments({
        instanceNode: firstStatement(
          "const x = 1;\n// end note\nconst y = 2;\n",
        ),
        language: "typescript",
        side: "end",
        templateNode: firstStatement(
          "const x = 1;\n// end note\nconst y = 2;\n",
        ),
      }),
    ).toEqual([]);
  });

  it("satisfies TODO comment on a decorator when JSDoc is placed before an intermediary decorator", () => {
    // Template has: /** TODO: ... */ @Module({}) export class Foo {}
    // Instance has: /** Real JSDoc */ @Global() @Module({}) export class Foo {}
    // The TODO on @Module should be satisfied by the JSDoc before @Global().
    const templateCode = `
/** TODO: Document the foo module. */
@Module({})
export class FooModule {}
`.trim();
    const instanceCode = `
/**
 * Real documentation for the foo module.
 */
@Global()
@Module({})
export class FooModule {}
`.trim();

    const templateModuleDecorator = namedDecorator(templateCode, "Module");
    const instanceModuleDecorator = namedDecorator(instanceCode, "Module");

    const errors = validateComments({
      instanceNode: instanceModuleDecorator,
      language: "typescript",
      side: "pos",
      templateNode: templateModuleDecorator,
    });

    expect(errors).toEqual([]);
  });

  it("still reports error when TODO comment on a decorator has no comment anywhere in ancestor range", () => {
    const templateCode = `
/** TODO: Document the foo module. */
@Module({})
export class FooModule {}
`.trim();
    const instanceCode = `
@Global()
@Module({})
export class FooModule {}
`.trim();

    const templateModuleDecorator = namedDecorator(templateCode, "Module");
    const instanceModuleDecorator = namedDecorator(instanceCode, "Module");

    const errors = validateComments({
      instanceNode: instanceModuleDecorator,
      language: "typescript",
      side: "pos",
      templateNode: templateModuleDecorator,
    });

    expect(errors).toHaveLength(1);
    expect(errors.at(0)?.message).toContain(
      'Missing comment: "/** TODO: Document the foo module. */"',
    );
  });
});
