import {
  createSourceFile,
  type Node,
  ScriptTarget,
  type SourceFile,
} from "typescript";
import { describe, expect, it } from "vitest";

import { getComments, validateComments } from "./comments";

function parseTypescript(code: string): SourceFile {
  return createSourceFile("test.ts", code, ScriptTarget.Latest, true);
}

function firstStatement(code: string): Node {
  const stmt = parseTypescript(code).statements.at(0);
  if (stmt === undefined) throw new Error("No statement found");
  return stmt;
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

  it("excludes block comments", () => {
    expect(
      getComments(firstStatement("/* block comment */\nconst x = 1;\n"), "pos"),
    ).toEqual([]);
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
        templateNode: firstStatement("const x = 1;\n"),
        instanceNode: firstStatement("const x = 1;\n"),
        side: "pos",
      }),
    ).toEqual([]);
  });

  it("returns no errors when instance has all template comments", () => {
    expect(
      validateComments({
        templateNode: firstStatement("// section\nconst x = 1;\n"),
        instanceNode: firstStatement("// section\nconst x = 1;\n"),
        side: "pos",
      }),
    ).toEqual([]);
  });

  it("returns error for each missing template comment", () => {
    const errors = validateComments({
      templateNode: firstStatement("// section\nconst x = 1;\n"),
      instanceNode: firstStatement("const x = 1;\n"),
      side: "pos",
    });
    expect(errors).toHaveLength(1);
    expect(errors.at(0)).toContain('Missing comment: "// section"');
  });

  it("returns no errors when instance has extra comments around template comments", () => {
    expect(
      validateComments({
        templateNode: firstStatement("// required\nconst x = 1;\n"),
        instanceNode: firstStatement("// extra\n// required\nconst x = 1;\n"),
        side: "pos",
      }),
    ).toEqual([]);
  });

  it("enforces relative order — out-of-order template comment fails", () => {
    const errors = validateComments({
      templateNode: firstStatement("// first\n// second\nconst x = 1;\n"),
      instanceNode: firstStatement("// second\n// first\nconst x = 1;\n"),
      side: "pos",
    });
    expect(errors).toHaveLength(1);
    expect(errors.at(0)).toContain('Missing comment: "// second"');
  });

  it("matches any TODO comment when template comment contains TODO", () => {
    expect(
      validateComments({
        templateNode: firstStatement("// TODO: placeholder\nconst x = 1;\n"),
        instanceNode: firstStatement(
          "// TODO: completely different wording\nconst x = 1;\n",
        ),
        side: "pos",
      }),
    ).toEqual([]);
  });

  it("requires exact match for non-TODO comments", () => {
    const errors = validateComments({
      templateNode: firstStatement("// exact comment\nconst x = 1;\n"),
      instanceNode: firstStatement("// different comment\nconst x = 1;\n"),
      side: "pos",
    });
    expect(errors).toHaveLength(1);
    expect(errors.at(0)).toContain('Missing comment: "// exact comment"');
  });

  it("includes source location in error message", () => {
    const errors = validateComments({
      templateNode: firstStatement("// missing\nconst x = 1;\n"),
      instanceNode: firstStatement("const x = 1;\n"),
      side: "pos",
    });
    expect(errors.at(0)).toMatch(/\(line \d+:\d+\)/);
  });

  it("detects missing comment on new line after node when side is end", () => {
    const errors = validateComments({
      templateNode: firstStatement("const x = 1;\n// end note\nconst y = 2;\n"),
      instanceNode: firstStatement("const x = 1;\nconst y = 2;\n"),
      side: "end",
    });
    expect(errors).toHaveLength(1);
    expect(errors.at(0)).toContain('Missing comment: "// end note"');
  });

  it("returns no errors when side-end instance has the matching new-line comment", () => {
    expect(
      validateComments({
        templateNode: firstStatement(
          "const x = 1;\n// end note\nconst y = 2;\n",
        ),
        instanceNode: firstStatement(
          "const x = 1;\n// end note\nconst y = 2;\n",
        ),
        side: "end",
      }),
    ).toEqual([]);
  });
});
