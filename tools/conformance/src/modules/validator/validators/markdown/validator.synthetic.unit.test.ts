import { beforeEach, describe, expect, it, vi } from "vitest";

const { parseMock } = vi.hoisted(() => ({
  parseMock: vi.fn<(markdown: string) => unknown>(),
}));

vi.mock("remark", () => {
  const processor = {
    parse: parseMock,
    use: vi.fn<() => unknown>().mockReturnThis(),
  };

  return {
    remark: () => processor,
  };
});

vi.mock("remark-gfm", () => ({
  default: {},
}));

describe("validateMarkdownConformance synthetic branches", () => {
  beforeEach(() => {
    parseMock.mockReset();
    vi.resetModules();
  });

  it("uses fallback error messaging and omits instance line when hint end line is missing", async () => {
    const templateAst = {
      children: [
        {
          children: [{ type: "text", value: "Title" }],
          depth: 1,
          position: {
            start: { column: 1, line: 1 },
          },
          type: "heading",
        },
        {
          position: {
            start: { column: 1, line: 3 },
          },
          type: "mystery",
          value: "template mystery",
        },
      ],
      type: "root",
    };
    const instanceAst = {
      children: [
        {
          children: [{ type: "text", value: "Title" }],
          depth: 1,
          position: {
            start: { column: 1, line: 1 },
          },
          type: "heading",
        },
        {
          type: "mystery",
          value: "instance mystery",
        },
      ],
      type: "root",
    };

    parseMock.mockReturnValueOnce(templateAst).mockReturnValueOnce(instanceAst);

    const importedModule = await import("./validator");
    const result = importedModule.validateMarkdownConformance({
      data: {},
      filename: "example.md",
      instance: "instance",
      template: "template",
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      message: 'Expected mystery: "template mystery"',
      templateColumn: 1,
      templateLine: 3,
    });
    expect(result.errors[0]?.instanceLine).toBeUndefined();
    expect(result.errors[0]?.instanceColumn).toBeUndefined();
  });
});
