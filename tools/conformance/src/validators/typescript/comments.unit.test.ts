import { createSourceFile, ScriptKind, ScriptTarget } from "typescript";
import { describe, expect, it } from "vitest";

import { validateAllComments } from "./comments";

describe("validateAllComments", () => {
  function runValidation(
    templateText: string,
    instanceText: string,
  ): ReturnType<typeof validateAllComments> {
    const templateFile = createSourceFile(
      "template.ts",
      templateText,
      ScriptTarget.Latest,
      true,
      ScriptKind.TS,
    );
    const instanceFile = createSourceFile(
      "instance.ts",
      instanceText,
      ScriptTarget.Latest,
      true,
      ScriptKind.TS,
    );
    return validateAllComments({
      instanceFile,
      language: "typescript",
      templateFile,
    });
  }

  it("returns no errors when all comments match exactly in order", () => {
    const template = `
      // First comment
      const a = 1;
      // Second comment
      const b = 2;
    `;
    const instance = `
      // First comment
      const a = 1;
      const x = "extra";
      // Second comment
      const b = 2;
    `;
    expect(runValidation(template, instance)).toEqual([]);
  });

  it("reports missing comment when a comment is absent", () => {
    const template = `// Required comment`;
    const instance = `const a = 1;`;
    const errors = runValidation(template, instance);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.expected).toBe("// Required comment");
    expect(errors[0]?.message).toBe('Missing comment: "// Required comment"');
  });

  it("matches TODO comments loosely against any comment", () => {
    const template = `
      // TODO: Document me
      const a = 1;
    `;
    const instance = `
      // This is documented now!
      const a = 1;
    `;
    expect(runValidation(template, instance)).toEqual([]);
  });

  it("fails if comments are out of order", () => {
    const template = `
      // First
      // Second
    `;
    const instance = `
      // Second
      // First
    `;
    const errors = runValidation(template, instance);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.expected).toBe("// Second");
  });

  it("supports multi-line comments", () => {
    const template = `/* Block */`;
    const instance = `/* Block */`;
    expect(runValidation(template, instance)).toEqual([]);
  });

  it("ignores urls inside string literals", () => {
    const template = `// A comment`;
    const instance = `
      const url = "https://example.com";
      // A comment
    `;
    expect(runValidation(template, instance)).toEqual([]);
  });
});
