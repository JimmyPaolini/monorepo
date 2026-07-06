import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MdastNode } from "./validators/markdown/nodes";

interface RemarkRoot {
  children: MdastNode[];
  type: "root";
}

const createPositionedNode = (node: MdastNode, line: number): MdastNode => ({
  ...node,
  position: {
    end: {
      column: 1,
      line,
    },
    start: {
      column: 1,
      line,
    },
  },
});

const createRoot = (children: MdastNode[]): RemarkRoot => ({
  children,
  type: "root",
});

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

  it("covers uncommon markdown error builders using synthetic mdast nodes", async () => {
    const templateRoot = createRoot([
      createPositionedNode({ type: "inlineMath", value: "x+y" }, 1),
      createPositionedNode({ type: "linkReference" }, 2),
      createPositionedNode({ type: "math" }, 3),
      createPositionedNode({ type: "yaml", value: "title: sample" }, 4),
    ]);

    vi.doMock("remark", () => {
      const processor = {
        parse: vi
          .fn<(markdown: string) => unknown>()
          .mockReturnValueOnce(templateRoot)
          .mockReturnValueOnce(createRoot([])),
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

    expect(result.errors).toHaveLength(4);
    expect(result.errors.map((error) => error.message)).toStrictEqual(
      expect.arrayContaining([
        'Expected inlineMath: "x+y"',
        'Expected linkReference: ""',
        'Expected math: ""',
        'Expected yaml: "title: sample"',
      ]),
    );
  });
});
