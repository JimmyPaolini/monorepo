import { beforeEach, describe, expect, it, vi } from "vitest";

describe("validatorMarkdownService synthetic branches", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doUnmock("remark");
    vi.doUnmock("remark-gfm");
  });

  it("uses fallback error messaging and omits instance line when hint end line is missing", async () => {
    const parseMock = vi
      .fn<(markdown: string) => unknown>()
      .mockReturnValueOnce({
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
      })
      .mockReturnValueOnce({
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
      });

    vi.doMock("remark", () => {
      const processor = {
        parse: parseMock,
        use: vi.fn<() => unknown>().mockReturnThis(),
      };

      return {
        remark: () => processor,
      };
    });

    vi.doMock("remark-gfm", () => ({
      default: {},
    }));

    const importedModule = await import("./validator-markdown.service");
    const syntheticService = new importedModule.ValidatorMarkdownService();

    const result = syntheticService.validateMarkdownConformance({
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
