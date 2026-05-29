import { describe, expect, it } from "vitest";

import { validateMarkdownConformance } from "./validator";

// ---------------------------------------------------------------------------
// Helpers & shared fixtures
// ---------------------------------------------------------------------------

const README_TEMPLATE = `# {{namePascalCase}}

NestJS command-line application scaffold generated with \`conformance:nestjs-command-application\`.

## Start

\`\`\`bash
nx run {{nameKebabCase}}:start
\`\`\`

## Test

\`\`\`bash
nx run {{nameKebabCase}}:test
\`\`\`
`;

const README_DATA = {
  namePascalCase: "StellarCli",
  nameKebabCase: "stellar-cli",
};

const README_RENDERED = `# StellarCli

NestJS command-line application scaffold generated with \`conformance:nestjs-command-application\`.

## Start

\`\`\`bash
nx run stellar-cli:start
\`\`\`

## Test

\`\`\`bash
nx run stellar-cli:test
\`\`\`
`;

function validate(args: {
  instance: string;
  template: string;
  data?: Record<string, unknown>;
  filename?: string;
}): string[] {
  return validateMarkdownConformance({
    data: args.data ?? {},
    filename: args.filename ?? "README.md",
    instance: args.instance,
    template: args.template,
  }).errors.map((e) => e.message);
}

// ---------------------------------------------------------------------------
// Heading validation
// ---------------------------------------------------------------------------

describe("validateMarkdownConformance — headings", () => {
  it("returns no errors when the instance matches the rendered template", () => {
    expect(
      validate({
        instance: README_RENDERED,
        template: README_TEMPLATE,
        data: README_DATA,
      }),
    ).toEqual([]);
  });

  it("returns no errors when the instance is a superset (extra heading added)", () => {
    const instance = `${README_RENDERED}\n## Contributing\n\nSee CONTRIBUTING.md.\n`;
    expect(
      validate({ instance, template: README_TEMPLATE, data: README_DATA }),
    ).toEqual([]);
  });

  it("returns an error when a required heading is missing", () => {
    const instance = `# StellarCli\n\nNestJS command-line application scaffold generated with \`conformance:nestjs-command-application\`.\n`;
    const errors = validate({
      instance,
      template: README_TEMPLATE,
      data: README_DATA,
    });
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('heading (h2): "Start"'),
      ]),
    );
  });

  it("returns an error when heading depth differs (h2 used instead of h1)", () => {
    const instance = `## StellarCli\n\nSome text.\n`;
    const errors = validate({
      instance,
      template: `# {{name}}\n\nSome text.\n`,
      data: { name: "StellarCli" },
    });
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Expected heading (h1): "StellarCli"'),
      ]),
    );
  });

  it("resolves Mustache interpolation before comparing headings", () => {
    const errors = validate({
      instance: `# StellarCli\n`,
      template: `# {{namePascalCase}}\n`,
      data: { namePascalCase: "StellarCli" },
    });
    expect(errors).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Code block validation
// ---------------------------------------------------------------------------

describe("validateMarkdownConformance — code blocks", () => {
  it("returns no errors when all code blocks are present", () => {
    expect(
      validate({
        instance: README_RENDERED,
        template: README_TEMPLATE,
        data: README_DATA,
      }),
    ).toEqual([]);
  });

  it("returns an error when a required code block is missing", () => {
    const instance = `# StellarCli\n\nSome text.\n\n## Start\n\nNo code block here.\n`;
    const errors = validate({
      instance,
      template: README_TEMPLATE,
      data: README_DATA,
    });
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Expected code block (bash)"),
      ]),
    );
  });

  it("returns an error when a code block has wrong language", () => {
    const instance = `# StellarCli\n\nText.\n\n## Start\n\n\`\`\`sh\nnx run stellar-cli:start\n\`\`\`\n`;
    const errors = validate({
      instance,
      template: `# StellarCli\n\nText.\n\n## Start\n\n\`\`\`bash\nnx run stellar-cli:start\n\`\`\`\n`,
      data: {},
    });
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Expected code block (bash)"),
      ]),
    );
  });

  it("resolves Mustache interpolation in code block content", () => {
    expect(
      validate({
        instance: README_RENDERED,
        template: README_TEMPLATE,
        data: README_DATA,
      }),
    ).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Paragraph validation
// ---------------------------------------------------------------------------

describe("validateMarkdownConformance — paragraphs", () => {
  it("returns no errors when all paragraphs are present", () => {
    expect(
      validate({
        instance: README_RENDERED,
        template: README_TEMPLATE,
        data: README_DATA,
      }),
    ).toEqual([]);
  });

  it("returns an error when a required paragraph is missing", () => {
    const instance = `# StellarCli\n\n## Start\n\n\`\`\`bash\nnx run stellar-cli:start\n\`\`\`\n\n## Test\n\n\`\`\`bash\nnx run stellar-cli:test\n\`\`\`\n`;
    const errors = validate({
      instance,
      template: README_TEMPLATE,
      data: README_DATA,
    });
    expect(errors).toEqual(
      expect.arrayContaining([expect.stringContaining("Expected paragraph")]),
    );
  });
});

// ---------------------------------------------------------------------------
// List validation
// ---------------------------------------------------------------------------

describe("validateMarkdownConformance — lists", () => {
  it("returns no errors when all list items are present", () => {
    const template = `- item one\n- item two\n`;
    expect(validate({ instance: template, template })).toEqual([]);
  });

  it("returns no errors when the instance list has extra items (superset)", () => {
    const template = `- item one\n- item two\n`;
    const instance = `- item one\n- item two\n- item three\n`;
    expect(validate({ instance, template })).toEqual([]);
  });

  it("returns an error when a required list item is missing", () => {
    const template = `- item one\n- item two\n`;
    const instance = `- item one\n`;
    const errors = validate({ instance, template });
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Expected list item: "item two"'),
      ]),
    );
  });

  it("distinguishes ordered from unordered lists", () => {
    const template = `1. first\n2. second\n`;
    const instance = `- first\n- second\n`;
    const errors = validate({ instance, template });
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Expected ordered list"),
      ]),
    );
  });
});

// ---------------------------------------------------------------------------
// Blockquote validation
// ---------------------------------------------------------------------------

describe("validateMarkdownConformance — blockquotes", () => {
  it("returns no errors when the blockquote is present", () => {
    const template = `> Some important note.\n`;
    expect(validate({ instance: template, template })).toEqual([]);
  });

  it("returns an error when a required blockquote is missing", () => {
    const template = `> Some important note.\n`;
    const instance = `Just a paragraph.\n`;
    const errors = validate({ instance, template });
    expect(errors).toEqual(
      expect.arrayContaining([expect.stringContaining("Expected blockquote")]),
    );
  });
});

// ---------------------------------------------------------------------------
// Table validation
// ---------------------------------------------------------------------------

describe("validateMarkdownConformance — tables", () => {
  it("returns no errors when the table is present with matching columns", () => {
    const template = `| Name | Version |\n| --- | --- |\n| node | 22 |\n`;
    expect(validate({ instance: template, template })).toEqual([]);
  });

  it("returns an error when the table is missing", () => {
    const template = `| Name | Version |\n| --- | --- |\n| node | 22 |\n`;
    const instance = `No table here.\n`;
    const errors = validate({ instance, template });
    expect(errors).toEqual(
      expect.arrayContaining([expect.stringContaining("Expected table")]),
    );
  });

  it("returns an error when a required table cell is missing", () => {
    const template = `| Name | Version |\n| --- | --- |\n| node | 22 |\n`;
    const instance = `| Name | Version |\n| --- | --- |\n| node | 21 |\n`;
    const errors = validate({ instance, template });
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Expected table cell: "22"'),
      ]),
    );
  });
});

// ---------------------------------------------------------------------------
// Thematic break validation
// ---------------------------------------------------------------------------

describe("validateMarkdownConformance — thematic breaks", () => {
  it("returns no errors when the thematic break is present", () => {
    const template = `Before\n\n---\n\nAfter\n`;
    expect(validate({ instance: template, template })).toEqual([]);
  });

  it("returns an error when the thematic break is missing", () => {
    const template = `Before\n\n---\n\nAfter\n`;
    const instance = `Before\n\nAfter\n`;
    const errors = validate({ instance, template });
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Expected thematic break (---)"),
      ]),
    );
  });
});

// ---------------------------------------------------------------------------
// Link validation
// ---------------------------------------------------------------------------

describe("validateMarkdownConformance — links", () => {
  it("returns no errors when the link is present with the correct URL", () => {
    const template = `[Click here](https://example.com)\n`;
    expect(validate({ instance: template, template })).toEqual([]);
  });

  it("returns an error when a required link is missing", () => {
    const template = `[Click here](https://example.com)\n`;
    // Same paragraph text as the template ("Click here"), but without link markup;
    // the paragraph matches so validation recurses into inline children.
    const instance = `Click here\n`;
    const errors = validate({ instance, template });
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Expected link to "https://example.com"'),
      ]),
    );
  });

  it("returns an error when the link URL differs", () => {
    const template = `[Click here](https://example.com)\n`;
    const instance = `[Click here](https://other.com)\n`;
    const errors = validate({ instance, template });
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Expected link to "https://example.com"'),
      ]),
    );
  });
});

// ---------------------------------------------------------------------------
// Image validation
// ---------------------------------------------------------------------------

describe("validateMarkdownConformance — images", () => {
  it("returns no errors when the image is present", () => {
    const template = `![Logo](https://example.com/logo.png)\n`;
    expect(validate({ instance: template, template })).toEqual([]);
  });

  it("returns an error when a required image is missing", () => {
    const template = `![Logo](https://example.com/logo.png)\n`;
    // Same paragraph text as the template (alt text "Logo"), but without image markup;
    // the paragraph matches so validation recurses into inline children.
    const instance = `Logo\n`;
    const errors = validate({ instance, template });
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Expected image "Logo"'),
      ]),
    );
  });
});

// ---------------------------------------------------------------------------
// Inline formatting validation
// ---------------------------------------------------------------------------

describe("validateMarkdownConformance — inline formatting", () => {
  it("returns no errors when bold text is present", () => {
    const template = `This is **important**.\n`;
    expect(validate({ instance: template, template })).toEqual([]);
  });

  it("returns an error when required bold text is missing from the paragraph", () => {
    const template = `This is **important**.\n`;
    const instance = `This is important.\n`;
    const errors = validate({ instance, template });
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Expected bold text: "important"'),
      ]),
    );
  });

  it("returns no errors when italic text is present", () => {
    const template = `This is *emphasized*.\n`;
    expect(validate({ instance: template, template })).toEqual([]);
  });

  it("returns an error when required italic text is missing", () => {
    const template = `This is *emphasized*.\n`;
    const instance = `This is emphasized.\n`;
    const errors = validate({ instance, template });
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Expected italic text: "emphasized"'),
      ]),
    );
  });

  it("returns no errors when inline code is present", () => {
    const template = `Run \`nx build\` first.\n`;
    expect(validate({ instance: template, template })).toEqual([]);
  });

  it("returns an error when required inline code is missing", () => {
    const template = `Run \`nx build\` first.\n`;
    const instance = `Run nx build first.\n`;
    const errors = validate({ instance, template });
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Expected inline code: `nx build`"),
      ]),
    );
  });
});

// ---------------------------------------------------------------------------
// TODO line relaxation
// ---------------------------------------------------------------------------

describe("validateMarkdownConformance — TODO lines", () => {
  it("accepts any content on a TODO line in a code block", () => {
    const template = `\`\`\`bash\n# TODO: fill in your command here\nnx run app:start\n\`\`\`\n`;
    const instance = `\`\`\`bash\nnx run my-custom-app:start\nnx run app:start\n\`\`\`\n`;
    expect(validate({ instance, template })).toEqual([]);
  });

  it("accepts any content on a TODO line in a paragraph", () => {
    const template = `TODO: describe what this app does.\n`;
    const instance = `This app does something amazing.\n`;
    expect(validate({ instance, template })).toEqual([]);
  });
});
