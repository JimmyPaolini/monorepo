import { describe, expect, it } from "vitest";

import { validateComments } from "./comments";
import { validateJsonConformance } from "./validator";

describe("validateJsonConformance — structural checks", () => {
  it("returns no errors for identical JSON objects", () => {
    const template = `{ "name": "my-app", "version": "1.0.0" }`;
    const result = validateJsonConformance({
      instance: template,
      template,
      data: {},
      filename: "package.json",
    });
    expect(result.errors).toEqual([]);
  });

  it("returns no errors when instance has extra keys (superset)", () => {
    const template = `{ "name": "my-app" }`;
    const instance = `{ "name": "my-app", "extra": true }`;
    const result = validateJsonConformance({
      instance,
      template,
      data: {},
      filename: "package.json",
    });
    expect(result.errors).toEqual([]);
  });

  it("returns error when instance is missing a required key", () => {
    const template = `{ "name": "my-app", "version": "1.0.0" }`;
    const instance = `{ "name": "my-app" }`;
    const result = validateJsonConformance({
      instance,
      template,
      data: {},
      filename: "package.json",
    });
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: expect.stringContaining('Missing required key: "version"'),
        }),
      ]),
    );
  });

  it("returns error when instance value differs from template value", () => {
    const template = `{ "name": "my-app" }`;
    const instance = `{ "name": "other-app" }`;
    const result = validateJsonConformance({
      instance,
      template,
      data: {},
      filename: "package.json",
    });
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: expect.stringContaining('"name"') }),
      ]),
    );
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: expect.stringContaining('"my-app"'),
        }),
      ]),
    );
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: expect.stringContaining('"other-app"'),
        }),
      ]),
    );
  });

  it("resolves Mustache interpolation in template before comparing", () => {
    const template = `{ "name": "{{nameKebabCase}}" }`;
    const instance = `{ "name": "my-service" }`;
    const result = validateJsonConformance({
      instance,
      template,
      data: { nameKebabCase: "my-service" },
      filename: "package.json",
    });
    expect(result.errors).toEqual([]);
  });

  it("detects mismatch after Mustache render", () => {
    const template = `{ "name": "{{nameKebabCase}}" }`;
    const instance = `{ "name": "wrong-name" }`;
    const result = validateJsonConformance({
      instance,
      template,
      data: { nameKebabCase: "my-service" },
      filename: "package.json",
    });
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: expect.stringContaining('"my-service"'),
        }),
        expect.objectContaining({
          message: expect.stringContaining('"wrong-name"'),
        }),
      ]),
    );
  });

  it("returns error for missing nested key", () => {
    const template = `{ "scripts": { "build": "tsc" } }`;
    const instance = `{ "scripts": {} }`;
    const result = validateJsonConformance({
      instance,
      template,
      data: {},
      filename: "package.json",
    });
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: expect.stringContaining(
            'Missing required key: "scripts.build"',
          ),
        }),
      ]),
    );
  });

  it("returns no errors when instance has extra nested keys (superset)", () => {
    const template = `{ "scripts": { "build": "tsc" } }`;
    const instance = `{ "scripts": { "build": "tsc", "test": "vitest" } }`;
    const result = validateJsonConformance({
      instance,
      template,
      data: {},
      filename: "package.json",
    });
    expect(result.errors).toEqual([]);
  });

  it("returns error for missing array element value change at index", () => {
    const template = `{ "tags": ["nestjs", "typescript"] }`;
    const instance = `{ "tags": ["nestjs"] }`;
    const result = validateJsonConformance({
      instance,
      template,
      data: {},
      filename: "project.json",
    });
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("returns no errors for empty objects", () => {
    const result = validateJsonConformance({
      instance: "{}",
      template: "{}",
      data: {},
      filename: "package.json",
    });
    expect(result.errors).toEqual([]);
  });
});

describe("validateJsonConformance — JSONC comment checks", () => {
  it("returns no errors when instance has all template comments", () => {
    const template = `{
  // project config
  "name": "my-app"
}`;
    const result = validateJsonConformance({
      instance: template,
      template,
      data: {},
      filename: "project.json",
    });
    expect(result.errors).toEqual([]);
  });

  it("returns error when instance is missing a template comment", () => {
    const template = `{
  // project config
  "name": "my-app"
}`;
    const instance = `{
  "name": "my-app"
}`;
    const result = validateJsonConformance({
      instance,
      template,
      data: {},
      filename: "project.json",
    });
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: expect.stringContaining(
            'Missing comment: "// project config"',
          ),
        }),
      ]),
    );
  });

  it("returns no errors when instance has extra comments beyond template", () => {
    const template = `{
  // required comment
  "name": "my-app"
}`;
    const instance = `{
  // extra comment
  // required comment
  "name": "my-app"
}`;
    const result = validateJsonConformance({
      instance,
      template,
      data: {},
      filename: "project.json",
    });
    expect(result.errors).toEqual([]);
  });

  it("matches TODO comment loosely", () => {
    const template = `{
  // TODO: configure this
  "name": "my-app"
}`;
    const instance = `{
  // TODO: fill in later
  "name": "my-app"
}`;
    const result = validateJsonConformance({
      instance,
      template,
      data: {},
      filename: "project.json",
    });
    expect(result.errors).toEqual([]);
  });

  it("returns error when TODO comment is missing from instance", () => {
    const template = `{
  // TODO: configure this
  "name": "my-app"
}`;
    const instance = `{
  "name": "my-app"
}`;
    const result = validateJsonConformance({
      instance,
      template,
      data: {},
      filename: "project.json",
    });
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: expect.stringContaining("Missing comment"),
        }),
      ]),
    );
  });

  it("requires exact match for non-TODO comments", () => {
    const template = `{
  // exact wording required
  "name": "my-app"
}`;
    const instance = `{
  // different wording
  "name": "my-app"
}`;
    const result = validateJsonConformance({
      instance,
      template,
      data: {},
      filename: "project.json",
    });
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: expect.stringContaining(
            'Missing comment: "// exact wording required"',
          ),
        }),
      ]),
    );
  });

  it("enforces relative comment order", () => {
    const template = `{
  // first
  "a": 1,
  // second
  "b": 2
}`;
    const instance = `{
  // second
  "a": 1,
  // first
  "b": 2
}`;
    const result = validateJsonConformance({
      instance,
      template,
      data: {},
      filename: "project.json",
    });
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: expect.stringContaining('Missing comment: "// second"'),
        }),
      ]),
    );
  });
});

describe("validateComments", () => {
  it("returns no errors when instance has no comments and template has none", () => {
    expect(
      validateComments({ templateText: '{"a":1}', instanceText: '{"a":1}' }),
    ).toEqual([]);
  });

  it("returns no errors for matching single-line comment", () => {
    const text = '{\n  // hello\n  "a": 1\n}';
    expect(
      validateComments({ templateText: text, instanceText: text }),
    ).toEqual([]);
  });

  it("returns error for missing comment in instance", () => {
    const errors = validateComments({
      templateText: '{\n  // required\n  "a": 1\n}',
      instanceText: '{"a":1}',
    });
    expect(errors).toHaveLength(1);
    expect(errors.at(0)?.message).toContain('Missing comment: "// required"');
  });

  it("allows extra comments in instance", () => {
    expect(
      validateComments({
        templateText: '{\n  // needed\n  "a": 1\n}',
        instanceText: '{\n  // extra\n  // needed\n  "a": 1\n}',
      }),
    ).toEqual([]);
  });

  it("matches any TODO comment loosely", () => {
    expect(
      validateComments({
        templateText: '{\n  // TODO: placeholder\n  "a": 1\n}',
        instanceText: '{\n  // TODO: reworded\n  "a": 1\n}',
      }),
    ).toEqual([]);
  });
});
