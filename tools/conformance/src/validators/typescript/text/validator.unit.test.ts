import { describe, expect, it } from "vitest";

import { validateTextConformance } from "./validator";

const DATA = {};
const FILENAME = ".env.default";

describe("validateTextConformance", () => {
  it("returns no errors when instance contains all template lines", () => {
    const template = "KEY=value\nOTHER=123\n";
    const instance = "KEY=value\nOTHER=123\n";
    const result = validateTextConformance({
      data: DATA,
      filename: FILENAME,
      instance,
      template,
    });
    expect(result.errors).toEqual([]);
  });

  it("returns no errors when instance has additional lines beyond the template", () => {
    const template = "KEY=value\n";
    const instance = "KEY=value\nEXTRA=added\nANOTHER=line\n";
    const result = validateTextConformance({
      data: DATA,
      filename: FILENAME,
      instance,
      template,
    });
    expect(result.errors).toEqual([]);
  });

  it("returns an error for each template line missing from the instance", () => {
    const template = "REQUIRED=value\nALSO_REQUIRED=123\n";
    const instance = "REQUIRED=value\n";
    const result = validateTextConformance({
      data: DATA,
      filename: FILENAME,
      instance,
      template,
    });
    expect(result.errors).toEqual([
      expect.objectContaining({ message: "Missing line: ALSO_REQUIRED=123" }),
    ]);
  });

  it("renders mustache variables before comparing", () => {
    const template = "APP_NAME={{name}}\n";
    const instance = "APP_NAME=my-app\n";
    const result = validateTextConformance({
      data: { name: "my-app" },
      filename: FILENAME,
      instance,
      template,
    });
    expect(result.errors).toEqual([]);
  });

  it("returns an error when a mustache-rendered line is missing from the instance", () => {
    const template = "APP_NAME={{name}}\n";
    const instance = "APP_NAME=wrong-app\n";
    const result = validateTextConformance({
      data: { name: "my-app" },
      filename: FILENAME,
      instance,
      template,
    });
    expect(result.errors).toEqual([
      expect.objectContaining({ message: "Missing line: APP_NAME=my-app" }),
    ]);
  });

  it("treats blank lines in the template as required", () => {
    const template = "SECTION_A=1\n\nSECTION_B=2\n";
    const instance = "SECTION_A=1\nSECTION_B=2\n";
    const result = validateTextConformance({
      data: DATA,
      filename: FILENAME,
      instance,
      template,
    });
    expect(result.errors).toEqual([
      expect.objectContaining({ message: "Missing line: " }),
    ]);
  });

  it("returns no errors when instance preserves required blank lines", () => {
    const template = "SECTION_A=1\n\nSECTION_B=2\n";
    const instance = "SECTION_A=1\n\nSECTION_B=2\n";
    const result = validateTextConformance({
      data: DATA,
      filename: FILENAME,
      instance,
      template,
    });
    expect(result.errors).toEqual([]);
  });

  it("compares lines verbatim (whitespace differences are errors)", () => {
    const template = "KEY=value\n";
    const instance = "KEY = value\n";
    const result = validateTextConformance({
      data: DATA,
      filename: FILENAME,
      instance,
      template,
    });
    expect(result.errors).toEqual([
      expect.objectContaining({ message: "Missing line: KEY=value" }),
    ]);
  });

  it("requires duplicate template lines to each appear in the instance", () => {
    const template = "REPEATED=line\nREPEATED=line\n";
    const instance = "REPEATED=line\n";
    const result = validateTextConformance({
      data: DATA,
      filename: FILENAME,
      instance,
      template,
    });
    expect(result.errors).toEqual([
      expect.objectContaining({ message: "Missing line: REPEATED=line" }),
    ]);
  });

  it("returns no errors when instance matches the required duplicate count", () => {
    const template = "REPEATED=line\nREPEATED=line\n";
    const instance = "REPEATED=line\nREPEATED=line\n";
    const result = validateTextConformance({
      data: DATA,
      filename: FILENAME,
      instance,
      template,
    });
    expect(result.errors).toEqual([]);
  });
});
