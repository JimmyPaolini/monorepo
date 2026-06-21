/* eslint-disable vitest/expect-expect, vitest/require-top-level-describe */

import { describe, expect, it } from "vitest";

import { expectErrorWithMessage } from "../test-helpers";

import { validateComments } from "./comments";
import { validateJsonConformance } from "./validator";

describe("validateJsonConformance — structural checks", () => {
  it("returns no errors for identical JSON objects", () => {
    const template = `{ "name": "my-app", "version": "1.0.0" }`;
    const result = validateJsonConformance({
      data: {},
      filename: "package.json",
      instance: template,
      template,
    });
    expect(result.errors).toEqual([]);
  });

  it("returns no errors when instance has extra keys (superset)", () => {
    const template = `{ "name": "my-app" }`;
    const instance = `{ "name": "my-app", "extra": true }`;
    const result = validateJsonConformance({
      data: {},
      filename: "package.json",
      instance,
      template,
    });
    expect(result.errors).toEqual([]);
  });

  it("returns error when instance is missing a required key", () => {
    const template = `{ "name": "my-app", "version": "1.0.0" }`;
    const instance = `{ "name": "my-app" }`;
    const result = validateJsonConformance({
      data: {},
      filename: "package.json",
      instance,
      template,
    });
    expectErrorWithMessage(result.errors, 'Missing required value: "version"');
  });

  it("returns error when instance value differs from template value", () => {
    const template = `{ "name": "my-app" }`;
    const instance = `{ "name": "other-app" }`;
    const result = validateJsonConformance({
      data: {},
      filename: "package.json",
      instance,
      template,
    });
    expectErrorWithMessage(result.errors, '"name"');
    expectErrorWithMessage(result.errors, '"my-app"');
    expectErrorWithMessage(result.errors, '"other-app"');
  });

  it("resolves Mustache interpolation in template before comparing", () => {
    const template = `{ "name": "{{nameKebabCase}}" }`;
    const instance = `{ "name": "my-service" }`;
    const result = validateJsonConformance({
      data: { nameKebabCase: "my-service" },
      filename: "package.json",
      instance,
      template,
    });
    expect(result.errors).toEqual([]);
  });

  it("detects mismatch after Mustache render", () => {
    const template = `{ "name": "{{nameKebabCase}}" }`;
    const instance = `{ "name": "wrong-name" }`;
    const result = validateJsonConformance({
      data: { nameKebabCase: "my-service" },
      filename: "package.json",
      instance,
      template,
    });
    expectErrorWithMessage(result.errors, '"my-service"');
    expectErrorWithMessage(result.errors, '"wrong-name"');
  });

  it("returns error for missing nested key", () => {
    const template = `{ "scripts": { "build": "tsc" } }`;
    const instance = `{ "scripts": {} }`;
    const result = validateJsonConformance({
      data: {},
      filename: "package.json",
      instance,
      template,
    });
    expectErrorWithMessage(
      result.errors,
      'Missing required value: "scripts.build"',
    );
  });

  it("returns no errors when instance has extra nested keys (superset)", () => {
    const template = `{ "scripts": { "build": "tsc" } }`;
    const instance = `{ "scripts": { "build": "tsc", "test": "vitest" } }`;
    const result = validateJsonConformance({
      data: {},
      filename: "package.json",
      instance,
      template,
    });
    expect(result.errors).toEqual([]);
  });

  it("returns error for missing array element", () => {
    const template = `{ "tags": ["nestjs", "typescript"] }`;
    const instance = `{ "tags": ["nestjs"] }`;
    const result = validateJsonConformance({
      data: {},
      filename: "project.json",
      instance,
      template,
    });
    expectErrorWithMessage(result.errors, '"typescript"');
  });

  it("returns no errors when instance array has all template values", () => {
    const template = `{ "tags": ["nestjs", "typescript"] }`;
    const instance = `{ "tags": ["nestjs", "typescript"] }`;
    const result = validateJsonConformance({
      data: {},
      filename: "project.json",
      instance,
      template,
    });
    expect(result.errors).toEqual([]);
  });

  it("returns no errors when instance array has extra values beyond template", () => {
    const template = `{ "tags": ["nestjs", "typescript"] }`;
    const instance = `{ "tags": ["nestjs", "typescript", "extra-tag"] }`;
    const result = validateJsonConformance({
      data: {},
      filename: "project.json",
      instance,
      template,
    });
    expect(result.errors).toEqual([]);
  });

  it("returns no errors when template values appear in a different order", () => {
    const template = `{ "tags": ["nestjs", "typescript"] }`;
    const instance = `{ "tags": ["typescript", "nestjs"] }`;
    const result = validateJsonConformance({
      data: {},
      filename: "project.json",
      instance,
      template,
    });
    expect(result.errors).toEqual([]);
  });

  it("returns no errors when extra tags are prepended before template tags", () => {
    const template = `{ "tags": ["framework:nestjs", "language:typescript"] }`;
    const instance = `{ "tags": ["domain:lexico", "framework:nestjs", "language:typescript", "type:application"] }`;
    const result = validateJsonConformance({
      data: {},
      filename: "project.json",
      instance,
      template,
    });
    expect(result.errors).toEqual([]);
  });

  it("returns no errors for empty objects", () => {
    const result = validateJsonConformance({
      data: {},
      filename: "package.json",
      instance: "{}",
      template: "{}",
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
      data: {},
      filename: "project.json",
      instance: template,
      template,
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
      data: {},
      filename: "project.json",
      instance,
      template,
    });
    expectErrorWithMessage(
      result.errors,
      'Missing comment: "// project config"',
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
      data: {},
      filename: "project.json",
      instance,
      template,
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
      data: {},
      filename: "project.json",
      instance,
      template,
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
      data: {},
      filename: "project.json",
      instance,
      template,
    });
    expectErrorWithMessage(result.errors, "Missing comment");
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
      data: {},
      filename: "project.json",
      instance,
      template,
    });
    expectErrorWithMessage(
      result.errors,
      'Missing comment: "// exact wording required"',
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
      data: {},
      filename: "project.json",
      instance,
      template,
    });
    expectErrorWithMessage(result.errors, 'Missing comment: "// second"');
  });
});

describe("validateComments", () => {
  it("returns no errors when instance has no comments and template has none", () => {
    expect(
      validateComments({
        instanceText: '{"a":1}',
        templateText: '{"a":1}',
      }),
    ).toEqual([]);
  });

  it("returns no errors for matching single-line comment", () => {
    const text = '{\n  // hello\n  "a": 1\n}';
    expect(
      validateComments({ instanceText: text, templateText: text }),
    ).toEqual([]);
  });

  it("returns error for missing comment in instance", () => {
    const errors = validateComments({
      instanceText: '{"a":1}',
      templateText: '{\n  // required\n  "a": 1\n}',
    });
    expect(errors).toHaveLength(1);
    expect(errors.at(0)?.message).toContain('Missing comment: "// required"');
  });

  it("allows extra comments in instance", () => {
    expect(
      validateComments({
        instanceText: '{\n  // extra\n  // needed\n  "a": 1\n}',
        templateText: '{\n  // needed\n  "a": 1\n}',
      }),
    ).toEqual([]);
  });

  it("matches any TODO comment loosely", () => {
    expect(
      validateComments({
        instanceText: '{\n  // TODO: reworded\n  "a": 1\n}',
        templateText: '{\n  // TODO: placeholder\n  "a": 1\n}',
      }),
    ).toEqual([]);
  });
});

describe("validateJsonConformance — array primitive type coverage", () => {
  it("passes when null is present in instance array", () => {
    const result = validateJsonConformance({
      data: {},
      filename: "x.json",
      instance: `{ "items": [null, "other"] }`,
      template: `{ "items": [null] }`,
    });
    expect(result.errors).toEqual([]);
  });

  it("fails when null is absent from instance array", () => {
    const result = validateJsonConformance({
      data: {},
      filename: "x.json",
      instance: `{ "items": ["other"] }`,
      template: `{ "items": [null] }`,
    });
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("passes when number is present in instance array", () => {
    const result = validateJsonConformance({
      data: {},
      filename: "x.json",
      instance: `{ "codes": [200, 404] }`,
      template: `{ "codes": [200] }`,
    });
    expect(result.errors).toEqual([]);
  });

  it("fails when number is absent from instance array", () => {
    const result = validateJsonConformance({
      data: {},
      filename: "x.json",
      instance: `{ "codes": [404] }`,
      template: `{ "codes": [200] }`,
    });
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("passes when boolean true is present in instance array", () => {
    const result = validateJsonConformance({
      data: {},
      filename: "x.json",
      instance: `{ "flags": [true, false] }`,
      template: `{ "flags": [true] }`,
    });
    expect(result.errors).toEqual([]);
  });

  it("fails when boolean true is absent from instance array", () => {
    const result = validateJsonConformance({
      data: {},
      filename: "x.json",
      instance: `{ "flags": [false] }`,
      template: `{ "flags": [true] }`,
    });
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe("validateJsonConformance — arrays of objects (best-match semantics)", () => {
  it("passes when object in template array is found in instance array", () => {
    const result = validateJsonConformance({
      data: {},
      filename: "x.json",
      instance: `{ "targets": [{ "executor": "nx:run-commands" }] }`,
      template: `{ "targets": [{ "executor": "nx:run-commands" }] }`,
    });
    expect(result.errors).toEqual([]);
  });

  it("reports missing key from closest-matching object in instance array", () => {
    const result = validateJsonConformance({
      data: {},
      filename: "x.json",
      instance: `{ "targets": [{ "executor": "nx:run-commands" }] }`,
      template: `{ "targets": [{ "executor": "nx:run-commands", "options": {} }] }`,
    });
    expectErrorWithMessage(result.errors, '"targets[0].options"');
  });

  it("selects the best-matching instance object when multiple candidates exist", () => {
    const result = validateJsonConformance({
      data: {},
      filename: "x.json",
      instance: `{
        "targets": [
          { "extra": "unrelated" },
          { "executor": "nx:run-commands" }
        ]
      }`,
      template: `{ "targets": [{ "executor": "nx:run-commands", "options": {} }] }`,
    });
    // First object has 2 errors (missing executor + options); second has 1 error (missing options).
    // Best-match picks the second, so only "options" is reported.
    expect(result.errors).toHaveLength(1);
    expect(
      result.errors[0]?.instancePath ?? result.errors[0]?.message,
    ).toContain("options");
  });

  it("passes when template array is empty regardless of instance array contents", () => {
    const result = validateJsonConformance({
      data: {},
      filename: "x.json",
      instance: `{ "items": ["a", "b", "c"] }`,
      template: `{ "items": [] }`,
    });
    expect(result.errors).toEqual([]);
  });

  it("passes when instance array has extra objects beyond the template", () => {
    const result = validateJsonConformance({
      data: {},
      filename: "x.json",
      instance: `{
        "targets": [
          { "executor": "nx:run-commands" },
          { "executor": "extra" }
        ]
      }`,
      template: `{ "targets": [{ "executor": "nx:run-commands" }] }`,
    });
    expect(result.errors).toEqual([]);
  });
});
