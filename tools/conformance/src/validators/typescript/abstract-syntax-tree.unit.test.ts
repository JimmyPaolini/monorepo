import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import mustache from "mustache";
import { describe, expect, it } from "vitest";

import { expectErrorWithMessage } from "./test-helpers";
import { validateTypescriptConformance as validateConformance } from "./validator";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const TEMPLATES_DIR = path.resolve(
  __dirname,
  "../../generators/nestjs-service-module/templates",
);

const SERVICE_TEMPLATE_PATH = path.join(
  TEMPLATES_DIR,
  "__nameKebabCase__.service.ts",
);

const data: Record<string, unknown> = {
  nameCamelCase: "user",
  namePascalCase: "User",
};

describe("validateConformanceAST", () => {
  const MODULE_TEMPLATE_PATH = path.join(
    TEMPLATES_DIR,
    "__nameKebabCase__.module.ts",
  );

  function readModuleTemplate(): string {
    return fs.readFileSync(MODULE_TEMPLATE_PATH, "utf8");
  }

  it("fresh generated file passes AST validation", () => {
    const templateContent = fs.readFileSync(SERVICE_TEMPLATE_PATH, "utf8");
    const rendered = mustache.render(templateContent, data);
    const result = validateConformance({
      instance: rendered,
      template: templateContent,
      data,
      filename: "user.service.ts",
    });
    expect(result.errors.length === 0).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("updated controllers array still passes — key present, value changed", () => {
    const templateContent = readModuleTemplate();
    const rendered = mustache.render(templateContent, data);
    const fileContent = rendered.replace(
      "controllers: [],",
      "controllers: [UserController],",
    );
    const result = validateConformance({
      instance: fileContent,
      template: templateContent,
      data,
      filename: "user.module.ts",
    });
    expect(result.errors.length === 0).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("expanded exports array still passes", () => {
    const templateContent = readModuleTemplate();
    const rendered = mustache.render(templateContent, data);
    const fileContent = rendered.replace(
      "exports: [UserService],",
      "exports: [UserService, UserRepository],",
    );
    const result = validateConformance({
      instance: fileContent,
      template: templateContent,
      data,
      filename: "user.module.ts",
    });
    expect(result.errors.length === 0).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("constructor with body still passes", () => {
    const templateContent = fs.readFileSync(SERVICE_TEMPLATE_PATH, "utf8");
    const rendered = mustache.render(templateContent, data);
    const fileContent = rendered.replace(
      "  ) {}",
      "  ) {\n    this.init();\n  }",
    );
    const result = validateConformance({
      instance: fileContent,
      template: templateContent,
      data,
      filename: "user.service.ts",
    });
    expect(result.errors.length === 0).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("missing @Injectable decorator fails", () => {
    const templateContent = fs.readFileSync(SERVICE_TEMPLATE_PATH, "utf8");
    const rendered = mustache.render(templateContent, data);
    const fileContent = rendered.replace("@Injectable()\n", "");
    const result = validateConformance({
      instance: fileContent,
      template: templateContent,
      data,
      filename: "user.service.ts",
    });
    expect(result.errors.length === 0).toBe(false);
    expectErrorWithMessage(result.errors, 'Missing Decorator "Injectable"');
  });

  it("wrong class name fails", () => {
    const templateContent = fs.readFileSync(SERVICE_TEMPLATE_PATH, "utf8");
    const rendered = mustache.render(templateContent, data);
    const fileContent = rendered.replace("UserService", "RenamedService");
    const result = validateConformance({
      instance: fileContent,
      template: templateContent,
      data,
      filename: "user.service.ts",
    });
    expect(result.errors.length === 0).toBe(false);
    expectErrorWithMessage(
      result.errors,
      'Missing ClassDeclaration "UserService"',
    );
  });

  it("missing section comment fails even in AST mode", () => {
    const templateContent = fs.readFileSync(SERVICE_TEMPLATE_PATH, "utf8");
    const rendered = mustache.render(templateContent, data);
    const fileContent = rendered.replace("  // 🔑 Public Fields\n", "");
    const result = validateConformance({
      instance: fileContent,
      template: templateContent,
      data,
      filename: "user.service.ts",
    });
    expect(result.errors.length === 0).toBe(false);
    expectErrorWithMessage(
      result.errors,
      'Missing comment: "// 🔑 Public Fields"',
    );
  });

  it("missing import from @nestjs/common fails", () => {
    const templateContent = fs.readFileSync(SERVICE_TEMPLATE_PATH, "utf8");
    const rendered = mustache.render(templateContent, data);
    const fileContent = rendered.replace(
      'import { Injectable } from "@nestjs/common";\n',
      "",
    );
    const result = validateConformance({
      instance: fileContent,
      template: templateContent,
      data,
      filename: "user.service.ts",
    });
    expect(result.errors.length === 0).toBe(false);
    expectErrorWithMessage(
      result.errors,
      'Missing ImportDeclaration "@nestjs/common"',
    );
  });

  it("missing controllers key in @Module fails", () => {
    const templateContent = readModuleTemplate();
    const rendered = mustache.render(templateContent, data);
    const fileContent = rendered.replace("  controllers: [],\n", "");
    const result = validateConformance({
      instance: fileContent,
      template: templateContent,
      data,
      filename: "user.module.ts",
    });
    expect(result.errors.length === 0).toBe(false);
    expectErrorWithMessage(
      result.errors,
      'Missing PropertyAssignment "controllers"',
    );
  });

  it("heavily modified service with fields between section comments passes AST validation", () => {
    const fileContent = [
      'import { Injectable } from "@nestjs/common";',
      'import { Logger } from "@nestjs/common";',
      "",
      "/** Computes ephemeris data for a date range. */",
      "@Injectable()",
      "export class EphemerisService {",
      "  // 🏗️ Dependency Injection",
      "  constructor() {}",
      "",
      "  // 🔐 Private Fields",
      "  private readonly logger = new Logger(EphemerisService.name);",
      "  private readonly cache = new Map<string, number[]>();",
      "",
      "  // 🔑 Public Fields",
      "",
      "  // 🔏 Private Methods",
      "",
      "  private isSupported(body: string): boolean {",
      '    return body === "sun" || body === "moon";',
      "  }",
      "",
      "  // 🌎 Public Methods",
      "",
      "  public get(body: string): number[] {",
      "    return this.cache.get(body) ?? [];",
      "  }",
      "}",
      "",
    ].join("\n");
    const templateContent = fs.readFileSync(SERVICE_TEMPLATE_PATH, "utf8");
    const result = validateConformance({
      instance: fileContent,
      template: templateContent,
      data: { nameCamelCase: "ephemeris", namePascalCase: "Ephemeris" },
      filename: "ephemeris.service.ts",
    });
    expect(result.errors).toEqual([]);
  });

  it("field between section comments in constructor-injected service passes", () => {
    // Regression test: a private field between // 🔐 Private Fields and
    // // 🔑 Public Fields must not cause the later section comments to be
    // reported as missing. The scan must look past class members to find
    // section comments distributed across the class body.
    const fileContent = [
      'import { Injectable } from "@nestjs/common";',
      "",
      "/** Handles ephemeris data for the application. */",
      "@Injectable()",
      "export class EphemerisService {",
      "  // 🏗️ Dependency Injection",
      "  constructor() {}",
      "",
      "  // 🔐 Private Fields",
      "",
      "  private readonly nodeSet: ReadonlySet<string> = new Set<string>();",
      "",
      "  // 🔑 Public Fields",
      "",
      "  // 🔏 Private Methods",
      "",
      "  // 🌎 Public Methods",
      "",
      "  private isNode(body: string): boolean {",
      "    return this.nodeSet.has(body);",
      "  }",
      "}",
      "",
    ].join("\n");
    const templateContent = fs.readFileSync(SERVICE_TEMPLATE_PATH, "utf8");
    const result = validateConformance({
      instance: fileContent,
      template: templateContent,
      data: { nameCamelCase: "ephemeris", namePascalCase: "Ephemeris" },
      filename: "ephemeris.service.ts",
    });
    expect(result.errors).toEqual([]);
  });

  it("reworded TODO comment in instance still passes", () => {
    const templateContent = fs
      .readFileSync(SERVICE_TEMPLATE_PATH, "utf8")
      .replace("  // 🔑 Public Fields", "  // TODO: add public fields here");
    const rendered = mustache.render(templateContent, data);
    const fileContent = rendered.replace(
      "  // TODO: add public fields here",
      "  // TODO: implement the public fields later",
    );
    const result = validateConformance({
      instance: fileContent,
      template: templateContent,
      data,
      filename: "user.service.ts",
    });
    expect(result.errors).toEqual([]);
  });

  it("changed non-TODO section comment fails", () => {
    const templateContent = fs.readFileSync(SERVICE_TEMPLATE_PATH, "utf8");
    const rendered = mustache.render(templateContent, data);
    const fileContent = rendered.replace(
      "  // 🔑 Public Fields",
      "  // 🔑 Renamed Fields",
    );
    const result = validateConformance({
      instance: fileContent,
      template: templateContent,
      data,
      filename: "user.service.ts",
    });
    expectErrorWithMessage(
      result.errors,
      'Missing comment: "// 🔑 Public Fields"',
    );
  });

  it("extra import in instance passes", () => {
    const templateContent = fs.readFileSync(SERVICE_TEMPLATE_PATH, "utf8");
    const rendered = mustache.render(templateContent, data);
    const fileContent = rendered.replace(
      'import { Injectable } from "@nestjs/common";',
      'import { Injectable } from "@nestjs/common";\nimport { Extra } from "extra-package";',
    );
    const result = validateConformance({
      instance: fileContent,
      template: templateContent,
      data,
      filename: "user.service.ts",
    });
    expect(result.errors).toEqual([]);
  });

  it("extra method added to class passes", () => {
    const template = `import { Injectable } from "@nestjs/common";\n\n@Injectable()\nexport class UserService {\n  doWork(): void {}\n}\n`;
    const instance = `import { Injectable } from "@nestjs/common";\n\n@Injectable()\nexport class UserService {\n  doWork(): void {}\n  extra(): void {}\n}\n`;
    const result = validateConformance({
      instance,
      template,
      data: {},
      filename: "user.service.ts",
    });
    expect(result.errors).toEqual([]);
  });

  it("TSX file validates correctly", () => {
    const template = `export function Component(): JSX.Element {\n  return <div />;\n}\n`;
    const instance = `export function Component(): JSX.Element {\n  return <div className="wrapper" />;\n}\n`;
    const result = validateConformance({
      instance,
      template,
      data: {},
      filename: "component.tsx",
    });
    expect(result.errors).toEqual([]);
  });

  it("missing providers key in @Module fails", () => {
    const templateContent = readModuleTemplate();
    const rendered = mustache.render(templateContent, data);
    const fileContent = rendered.replace("  providers: [UserService],\n", "");
    const result = validateConformance({
      instance: fileContent,
      template: templateContent,
      data,
      filename: "user.module.ts",
    });
    expectErrorWithMessage(
      result.errors,
      'Missing PropertyAssignment "providers"',
    );
  });

  it("template with block comment passes when instance has it", () => {
    const template = [
      'import { Injectable } from "@nestjs/common";',
      "",
      "/* shared internal note */",
      "@Injectable()",
      "export class UserService {",
      "  constructor() {}",
      "}",
      "",
    ].join("\n");
    const rendered = mustache.render(template, data);
    const result = validateConformance({
      instance: rendered,
      template,
      data,
      filename: "user.service.ts",
    });
    expect(result.errors).toEqual([]);
  });

  it("template with block comment fails when instance is missing it", () => {
    const template = [
      'import { Injectable } from "@nestjs/common";',
      "",
      "/* shared internal note */",
      "@Injectable()",
      "export class UserService {",
      "  constructor() {}",
      "}",
      "",
    ].join("\n");
    const instance = template.replace("/* shared internal note */\n", "");
    const result = validateConformance({
      instance,
      template,
      data,
      filename: "user.service.ts",
    });
    expectErrorWithMessage(
      result.errors,
      'Missing comment: "/* shared internal note */"',
    );
  });

  it("template with JSDoc TODO comment passes when instance rewords it", () => {
    const template = [
      'import { Injectable } from "@nestjs/common";',
      "",
      "/** TODO: document this service */",
      "@Injectable()",
      "export class UserService {",
      "  constructor() {}",
      "}",
      "",
    ].join("\n");
    const instance = template.replace(
      "/** TODO: document this service */",
      "/** TODO: replace with real documentation */",
    );
    const result = validateConformance({
      instance,
      template,
      data,
      filename: "user.service.ts",
    });
    expect(result.errors).toEqual([]);
  });

  it("template with JSDoc TODO comment passes when instance has real documentation", () => {
    const template = [
      'import { Injectable } from "@nestjs/common";',
      "",
      "/** TODO: document this service */",
      "@Injectable()",
      "export class UserService {",
      "  constructor() {}",
      "}",
      "",
    ].join("\n");
    const instance = template.replace(
      "/** TODO: document this service */",
      "/** Handles user operations for the authentication flow. */",
    );
    const result = validateConformance({
      instance,
      template,
      data,
      filename: "user.service.ts",
    });
    expect(result.errors).toEqual([]);
  });

  it("template with non-TODO JSDoc fails when instance is missing it", () => {
    const template = [
      'import { Injectable } from "@nestjs/common";',
      "",
      "/** Handles user operations. */",
      "@Injectable()",
      "export class UserService {",
      "  constructor() {}",
      "}",
      "",
    ].join("\n");
    const instance = template.replace("/** Handles user operations. */\n", "");
    const result = validateConformance({
      instance,
      template,
      data,
      filename: "user.service.ts",
    });
    expectErrorWithMessage(
      result.errors,
      'Missing comment: "/** Handles user operations. */"',
    );
  });
});

describe("validateConformanceAST — multi-candidate keyless nodes", () => {
  const template = [
    'import { Injectable } from "@nestjs/common";',
    "",
    "@Injectable()",
    "export class UserService {",
    "  doWork(): void {",
    "    requiredCall();",
    "  }",
    "}",
    "",
  ].join("\n");

  it("picks matching statement when instance block has multiple candidates", () => {
    const instance = [
      'import { Injectable } from "@nestjs/common";',
      "",
      "@Injectable()",
      "export class UserService {",
      "  doWork(): void {",
      "    extraStatement();",
      "    requiredCall();",
      "  }",
      "}",
      "",
    ].join("\n");
    const result = validateConformance({
      instance,
      template,
      data: {},
      filename: "user.service.ts",
    });
    expect(result.errors).toEqual([]);
  });

  it("reports Missing Identifier from best-match candidate", () => {
    const instance = [
      'import { Injectable } from "@nestjs/common";',
      "",
      "@Injectable()",
      "export class UserService {",
      "  doWork(): void {",
      "    wrongCall1();",
      "    wrongCall2();",
      "  }",
      "}",
      "",
    ].join("\n");
    const result = validateConformance({
      instance,
      template,
      data: {},
      filename: "user.service.ts",
    });
    expectErrorWithMessage(result.errors, 'Missing Identifier "requiredCall"');
  });
});

describe("validateConformanceAST — error detection", () => {
  const MOCK_DATETIME_SERVICE = [
    'import { Injectable } from "@nestjs/common";',
    "",
    "@Injectable()",
    "export class DatetimeService {",
    "  // 🏗️ Dependency Injection",
    "  constructor() {}",
    "",
    "  // 🔐 Private Fields",
    "",
    "  // 🔑 Public Fields",
    "",
    "  // 🔏 Private Methods",
    "",
    "  // 🌎 Public Methods",
    "  public now(): Date {",
    "    return new Date();",
    "  }",
    "}",
    "",
  ].join("\n");

  const MOCK_MATH_SERVICE = [
    'import { Injectable } from "@nestjs/common";',
    "",
    "@Injectable()",
    "export class MathService {",
    "  // 🏗️ Dependency Injection",
    "  constructor() {}",
    "",
    "  // 🔐 Private Fields",
    "",
    "  // 🔑 Public Fields",
    "",
    "  // 🔏 Private Methods",
    "",
    "  // 🌎 Public Methods",
    "  public add(a: number, b: number): number {",
    "    return a + b;",
    "  }",
    "}",
    "",
  ].join("\n");

  function readServiceTemplate(): string {
    return fs.readFileSync(
      path.join(
        path.resolve(
          __dirname,
          "../../generators/nestjs-service-module/templates",
        ),
        "__nameKebabCase__.service.ts",
      ),
      "utf8",
    );
  }

  it("missing @Injectable decorator fails", () => {
    const fileContent = MOCK_DATETIME_SERVICE.replace("@Injectable()\n", "");
    const result = validateConformance({
      instance: fileContent,
      template: readServiceTemplate(),
      data: { nameCamelCase: "datetime", namePascalCase: "Datetime" },
      filename: "datetime.service.ts",
    });
    expectErrorWithMessage(result.errors, 'Missing Decorator "Injectable"');
  });

  it("missing section comment fails", () => {
    const fileContent = MOCK_MATH_SERVICE.replace(
      "  // 🌎 Public Methods\n",
      "",
    );
    const result = validateConformance({
      instance: fileContent,
      template: readServiceTemplate(),
      data: { nameCamelCase: "math", namePascalCase: "Math" },
      filename: "math.service.ts",
    });
    expectErrorWithMessage(
      result.errors,
      'Missing comment: "// 🌎 Public Methods"',
    );
  });

  it("renamed class fails", () => {
    const fileContent = MOCK_DATETIME_SERVICE.replaceAll(
      "DatetimeService",
      "RenamedService",
    );
    const result = validateConformance({
      instance: fileContent,
      template: readServiceTemplate(),
      data: { nameCamelCase: "datetime", namePascalCase: "Datetime" },
      filename: "datetime.service.ts",
    });
    expectErrorWithMessage(
      result.errors,
      'Missing ClassDeclaration "DatetimeService"',
    );
  });

  it("missing constructor fails", () => {
    const fileContent = MOCK_MATH_SERVICE.replace("  constructor() {}\n", "");
    const result = validateConformance({
      instance: fileContent,
      template: readServiceTemplate(),
      data: { nameCamelCase: "math", namePascalCase: "Math" },
      filename: "math.service.ts",
    });
    expectErrorWithMessage(result.errors, "Missing Constructor");
  });
});
