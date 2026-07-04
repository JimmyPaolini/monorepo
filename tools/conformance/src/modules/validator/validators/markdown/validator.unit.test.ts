import { describe, expect, it } from "vitest";

import { validateMarkdownConformance } from "./validator";

describe(validateMarkdownConformance, () => {
  it("accepts a structural superset with extra markdown around the template", () => {
    const result = validateMarkdownConformance({
      data: {},
      filename: "example.md",
      instance: [
        "Intro paragraph.",
        "",
        "# Extra heading",
        "",
        "# Title",
        "",
        "Paragraph with [link](https://example.com), ![alt](https://example.com/image.png), and `inline`.",
        "",
        "> Quote",
        "",
        "- item",
        "",
        "```ts",
        'console.log("hello");',
        "```",
        "",
        "| A | B |",
        "| - | - |",
        "| 1 | 2 |",
        "",
        "Tail paragraph.",
      ].join("\n"),
      template: [
        "# Title",
        "",
        "Paragraph with [link](https://example.com), ![alt](https://example.com/image.png), and `inline`.",
        "",
        "> Quote",
        "",
        "- item",
        "",
        "```ts",
        'console.log("hello");',
        "```",
        "",
        "| A | B |",
        "| - | - |",
        "| 1 | 2 |",
      ].join("\n"),
    });

    expect(result.errors).toStrictEqual([]);
  });

  it("reports a missing code block with location metadata", () => {
    const result = validateMarkdownConformance({
      data: {},
      filename: "example.md",
      instance: "Intro paragraph.",
      template: [
        "Intro paragraph.",
        "",
        "```ts",
        'console.log("hello");',
        "```",
      ].join("\n"),
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      errorType: "code",
      language: "markdown",
      message: 'Expected code block (ts): "console.log("hello");"',
      templateLine: 3,
    });
    expect(result.errors[0]?.instanceLine).toBe(2);
    expect(result.errors[0]?.instanceColumn).toBe(1);
  });

  it("chooses the best matching container candidate", () => {
    const result = validateMarkdownConformance({
      data: {},
      filename: "example.md",
      instance: ["- [alpha](https://example.com)", "- alpha"].join("\n"),
      template: ["- [alpha](https://example.com)"].join("\n"),
    });

    expect(result.errors).toStrictEqual([]);
  });

  it("reports first missing node without instance location hint", () => {
    const result = validateMarkdownConformance({
      data: {},
      filename: "example.md",
      instance: "Different content.",
      template: "# Required heading",
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      errorType: "code",
      language: "markdown",
      message: 'Expected heading (h1): "Required heading"',
      templateLine: 1,
    });
    expect(result.errors[0]?.instanceLine).toBeUndefined();
    expect(result.errors[0]?.instanceColumn).toBeUndefined();
  });

  it("reports HTML block mismatches", () => {
    const result = validateMarkdownConformance({
      data: {},
      filename: "example.md",
      instance: "<div>instance</div>",
      template: "<div>template</div>",
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.message).toBe(
      'Expected HTML block: "<div>template</div>"',
    );
  });

  it("reports ordered and unordered list mismatches", () => {
    const orderedTemplateResult = validateMarkdownConformance({
      data: {},
      filename: "example.md",
      instance: "- one",
      template: "1. one",
    });

    expect(orderedTemplateResult.errors).toHaveLength(1);
    expect(orderedTemplateResult.errors[0]?.message).toBe(
      "Expected ordered list",
    );

    const unorderedTemplateResult = validateMarkdownConformance({
      data: {},
      filename: "example.md",
      instance: "1. one",
      template: "- one",
    });

    expect(unorderedTemplateResult.errors).toHaveLength(1);
    expect(unorderedTemplateResult.errors[0]?.message).toBe(
      "Expected unordered list",
    );
  });

  it("reports table column-count mismatches", () => {
    const result = validateMarkdownConformance({
      data: {},
      filename: "example.md",
      instance: ["| A |", "| - |", "| 1 |"].join("\n"),
      template: ["| A | B |", "| - | - |", "| 1 | 2 |"].join("\n"),
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.message).toBe("Expected table");
  });

  it("reports heading depth and code language mismatches", () => {
    const result = validateMarkdownConformance({
      data: {},
      filename: "example.md",
      instance: ["# Same title", "", "```js", "value", "```"].join("\n"),
      template: ["## Same title", "", "```ts", "value", "```"].join("\n"),
    });

    expect(result.errors).toHaveLength(2);
    expect(result.errors).toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: 'Expected heading (h2): "Same title"',
        }),
        expect.objectContaining({
          message: 'Expected code block (ts): "value"',
        }),
      ]),
    );
  });

  it("treats missing footnote references as normalized content", () => {
    const result = validateMarkdownConformance({
      data: {},
      filename: "example.md",
      instance: ["Use this claim.", "", "[^1]: Source note."].join("\n"),
      template: ["Use this claim[^1].", "", "[^1]: Source note."].join("\n"),
    });

    expect(result.errors).toStrictEqual([]);
  });

  it("reports combined paragraph and footnote-definition differences", () => {
    const result = validateMarkdownConformance({
      data: {},
      filename: "example.md",
      instance: "Use this claim[^1].",
      template: ["Use this claim[^1].", "", "[^1]: Source note."].join("\n"),
    });

    expect(result.errors).toHaveLength(2);

    const messages = result.errors.map((error) => error.message);

    expect(
      messages.some((message) =>
        message.includes("Expected footnoteDefinition"),
      ),
    ).toBe(true);
    expect(
      messages.some((message) => message.includes("Expected paragraph")),
    ).toBe(true);
  });

  it("treats missing link references as normalized content", () => {
    const result = validateMarkdownConformance({
      data: {},
      filename: "example.md",
      instance: ["See Guide.", "", "[guide]: https://example.com/guide"].join(
        "\n",
      ),
      template: [
        "See [Guide][guide].",
        "",
        "[guide]: https://example.com/guide",
      ].join("\n"),
    });

    expect(result.errors).toStrictEqual([]);
  });

  it("reports paragraph mismatch for image reference content changes", () => {
    const result = validateMarkdownConformance({
      data: {},
      filename: "example.md",
      instance: ["Logo image", "", "[logo]: https://example.com/logo.png"].join(
        "\n",
      ),
      template: [
        "![Logo][logo]",
        "",
        "[logo]: https://example.com/logo.png",
      ].join("\n"),
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.message).toBe('Expected paragraph: "Logo"');
  });

  it("reports paragraph mismatch when hard line breaks are collapsed", () => {
    const result = validateMarkdownConformance({
      data: {},
      filename: "example.md",
      instance: "first line second line",
      template: ["first line  ", "second line"].join("\n"),
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.message).toBe(
      'Expected paragraph: "first linesecond line"',
    );
  });

  it("accepts thematic breaks matched by node type", () => {
    const result = validateMarkdownConformance({
      data: {},
      filename: "example.md",
      instance: ["---", "", "Content"].join("\n"),
      template: ["---", "", "Content"].join("\n"),
    });

    expect(result.errors).toStrictEqual([]);
  });

  it("reports missing inline code in paragraph content", () => {
    const result = validateMarkdownConformance({
      data: {},
      filename: "example.md",
      instance: "Use plain text only.",
      template: "Use `inline` only.",
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.message).toBe(
      'Expected paragraph: "Use inline only."',
    );
  });

  it("reports missing image references when reference definition is absent", () => {
    const result = validateMarkdownConformance({
      data: {},
      filename: "example.md",
      instance: "![Logo][logo]",
      template: [
        "![Logo][logo]",
        "",
        "[logo]: https://example.com/logo.png",
      ].join("\n"),
    });

    expect(result.errors.length).toBeGreaterThanOrEqual(1);

    const messages = result.errors.map((error) => error.message);

    expect(
      messages.some((message) => message.includes("Expected definition:")),
    ).toBe(true);
  });

  it("reports nested list item mismatches", () => {
    const result = validateMarkdownConformance({
      data: {},
      filename: "example.md",
      instance: ["- one", "  - child-a"].join("\n"),
      template: ["- one", "  - child-b"].join("\n"),
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.message).toContain(
      'Expected list item: "onechild-b"',
    );
  });

  it("reports inline HTML differences inside paragraphs", () => {
    const result = validateMarkdownConformance({
      data: {},
      filename: "example.md",
      instance: "<span>instance</span>",
      template: "<span>template</span>",
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.message).toBe(
      'Expected paragraph: "<span>template</span>"',
    );
  });

  it("reports missing table rows when template has additional rows", () => {
    const result = validateMarkdownConformance({
      data: {},
      filename: "example.md",
      instance: ["| A |", "| - |", "| 1 |"].join("\n"),
      template: ["| A |", "| - |", "| 1 |", "| 2 |"].join("\n"),
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.message).toContain("Expected table cell");
  });

  it("reports missing thematic breaks", () => {
    const result = validateMarkdownConformance({
      data: {},
      filename: "example.md",
      instance: "Section A\n\nSection B",
      template: "Section A\n\n---\n\nSection B",
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.message).toBe("Expected thematic break (---)");
  });

  it("reports missing blockquotes with location hint metadata", () => {
    const result = validateMarkdownConformance({
      data: {},
      filename: "example.md",
      instance: "Intro paragraph.",
      template: ["Intro paragraph.", "", "> Required quote"].join("\n"),
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      message: 'Expected blockquote: "Required quote"',
      templateLine: 3,
    });
    expect(result.errors[0]?.instanceLine).toBe(2);
    expect(result.errors[0]?.instanceColumn).toBe(1);
  });

  it("reports missing root definitions with exact message", () => {
    const result = validateMarkdownConformance({
      data: {},
      filename: "example.md",
      instance: "",
      template: "[guide]: https://example.com/guide",
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.message).toBe('Expected definition: ""');
    expect(result.errors[0]?.templateLine).toBe(1);
    expect(result.errors[0]?.instanceLine).toBeUndefined();
  });

  it("reports missing footnote definitions with exact message", () => {
    const result = validateMarkdownConformance({
      data: {},
      filename: "example.md",
      instance: "",
      template: "[^note]: citation text",
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.message).toBe(
      'Expected footnoteDefinition: "citation text"',
    );
    expect(result.errors[0]?.templateLine).toBe(1);
  });

  it("reports code value mismatch when language matches", () => {
    const result = validateMarkdownConformance({
      data: {},
      filename: "example.md",
      instance: ["```ts", "instance", "```"].join("\n"),
      template: ["```ts", "template", "```"].join("\n"),
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.message).toBe(
      'Expected code block (ts): "template"',
    );
  });

  it("accepts unlabeled code blocks when both sides match", () => {
    const result = validateMarkdownConformance({
      data: {},
      filename: "example.md",
      instance: ["```", "same-value", "```"].join("\n"),
      template: ["```", "same-value", "```"].join("\n"),
    });

    expect(result.errors).toStrictEqual([]);
  });

  it("reports missing unlabeled code blocks with default language label", () => {
    const result = validateMarkdownConformance({
      data: {},
      filename: "example.md",
      instance: "No code block present.",
      template: ["```", "", "```"].join("\n"),
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.message).toBe('Expected code block ((none)): ""');
  });

  it("accepts images without alt text when URLs match", () => {
    const result = validateMarkdownConformance({
      data: {},
      filename: "example.md",
      instance: "![](https://example.com/logo.png)",
      template: "![](https://example.com/logo.png)",
    });

    expect(result.errors).toStrictEqual([]);
  });

  it("reports image mismatch when alt text differs", () => {
    const result = validateMarkdownConformance({
      data: {},
      filename: "example.md",
      instance: "![](https://example.com/logo.png)",
      template: "![Logo](https://example.com/logo.png)",
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.message).toBe('Expected paragraph: "Logo"');
  });

  it("accepts links with different URLs when rendered text matches", () => {
    const result = validateMarkdownConformance({
      data: {},
      filename: "example.md",
      instance: "[Guide](https://example.com/instance)",
      template: "[Guide](https://example.com/template)",
    });

    expect(result.errors).toStrictEqual([]);
  });

  it("reports missing YAML frontmatter blocks", () => {
    const result = validateMarkdownConformance({
      data: {},
      filename: "example.md",
      instance: "",
      template: ["---", "title: sample", "---"].join("\n"),
    });

    expect(result.errors.length).toBeGreaterThanOrEqual(1);
    expect(result.errors).toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: "Expected thematic break (---)",
        }),
        expect.objectContaining({
          message: 'Expected heading (h2): "title: sample"',
        }),
      ]),
    );
  });

  it("reports table row mismatches from differing cell counts", () => {
    const result = validateMarkdownConformance({
      data: {},
      filename: "example.md",
      instance: ["| A | B |", "| - | - |", "| keep | wrong |"].join("\n"),
      template: ["| A | B |", "| - | - |", "| keep | required | extra |"].join(
        "\n",
      ),
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.message).toContain("Expected table row");
  });

  it("reports exact table cell mismatches", () => {
    const result = validateMarkdownConformance({
      data: {},
      filename: "example.md",
      instance: ["| A | B |", "| - | - |", "| keep | wrong |"].join("\n"),
      template: ["| A | B |", "| - | - |", "| keep | required |"].join("\n"),
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.message).toBe('Expected table cell: "required"');
  });

  it("reports missing blockquote after matched heading with correct hint line", () => {
    const result = validateMarkdownConformance({
      data: {},
      filename: "example.md",
      instance: "# Title",
      template: ["# Title", "", "> quote needed"].join("\n"),
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.message).toBe(
      'Expected blockquote: "quote needed"',
    );
    expect(result.errors[0]?.instanceLine).toBe(2);
    expect(result.errors[0]?.instanceColumn).toBe(1);
  });

  it("accepts matching blockquotes with no paragraph text", () => {
    const result = validateMarkdownConformance({
      data: {},
      filename: "example.md",
      instance: ">",
      template: ">",
    });

    expect(result.errors).toStrictEqual([]);
  });

  it("uses the last leaf candidate when deriving instance hint", () => {
    const result = validateMarkdownConformance({
      data: {},
      filename: "example.md",
      instance: ["# Repeat", "", "# Repeat"].join("\n"),
      template: ["# Repeat", "", "> Missing quote"].join("\n"),
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.message).toBe(
      'Expected blockquote: "Missing quote"',
    );
    expect(result.errors[0]?.instanceLine).toBe(4);
    expect(result.errors[0]?.instanceColumn).toBe(1);
  });

  it("reports table cell mismatches for phrasing-heavy markdown cells", () => {
    const result = validateMarkdownConformance({
      data: {},
      filename: "example.md",
      instance: [
        "| A | B | C | D | E | F |",
        "| - | - | - | - | - | - |",
        "| ![Logo](https://example.com/instance.png) | [Docs](https://example.com/instance) | template | strike | italic | bold |",
      ].join("\n"),
      template: [
        "| A | B | C | D | E | F |",
        "| - | - | - | - | - | - |",
        "| ![Logo](https://example.com/template.png) | [Docs](https://example.com/template) | `template` | ~~strike~~ | *italic* | **bold** |",
      ].join("\n"),
    });

    expect(result.errors.length).toBeGreaterThanOrEqual(6);
    expect(result.errors).toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: 'Expected table cell: "Logo"',
        }),
        expect.objectContaining({
          message: 'Expected table cell: "Docs"',
        }),
        expect.objectContaining({
          message: 'Expected table cell: "template"',
        }),
        expect.objectContaining({
          message: 'Expected table cell: "strike"',
        }),
        expect.objectContaining({
          message: 'Expected table cell: "italic"',
        }),
        expect.objectContaining({
          message: 'Expected table cell: "bold"',
        }),
      ]),
    );
  });
});
