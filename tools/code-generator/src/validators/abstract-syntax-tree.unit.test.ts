import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import ejs from "ejs";
import { describe, expect, it } from "vitest";

import { validateConformance } from "./validator";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const TEMPLATES_DIR = path.resolve(
  __dirname,
  "../generators/nestjs-service-module/templates",
);

const SERVICE_TEMPLATE_PATH = path.join(
  TEMPLATES_DIR,
  "__nameCamelCase__.service.ts",
);

const data: Record<string, unknown> = {
  nameCamelCase: "user",
  namePascalCase: "User",
};

describe("validateConformanceAST", () => {
  const MODULE_TEMPLATE_PATH = path.join(
    TEMPLATES_DIR,
    "__nameCamelCase__.module.ts",
  );

  function readModuleTemplate(): string {
    return fs.readFileSync(MODULE_TEMPLATE_PATH, "utf8");
  }

  it("fresh generated file passes AST validation", () => {
    const templateContent = fs.readFileSync(SERVICE_TEMPLATE_PATH, "utf8");
    const rendered = ejs.render(templateContent, data);
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
    const rendered = ejs.render(templateContent, data);
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
    const rendered = ejs.render(templateContent, data);
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
    const rendered = ejs.render(templateContent, data);
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
    const rendered = ejs.render(templateContent, data);
    const fileContent = rendered.replace("@Injectable()\n", "");
    const result = validateConformance({
      instance: fileContent,
      template: templateContent,
      data,
      filename: "user.service.ts",
    });
    expect(result.errors.length === 0).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Missing Decorator "Injectable"'),
      ]),
    );
  });

  it("wrong class name fails", () => {
    const templateContent = fs.readFileSync(SERVICE_TEMPLATE_PATH, "utf8");
    const rendered = ejs.render(templateContent, data);
    const fileContent = rendered.replace("UserService", "RenamedService");
    const result = validateConformance({
      instance: fileContent,
      template: templateContent,
      data,
      filename: "user.service.ts",
    });
    expect(result.errors.length === 0).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Missing ClassDeclaration "UserService"'),
      ]),
    );
  });

  it("missing section comment fails even in AST mode", () => {
    const templateContent = fs.readFileSync(SERVICE_TEMPLATE_PATH, "utf8");
    const rendered = ejs.render(templateContent, data);
    const fileContent = rendered.replace("  // 🔑 Public Fields\n", "");
    const result = validateConformance({
      instance: fileContent,
      template: templateContent,
      data,
      filename: "user.service.ts",
    });
    expect(result.errors.length === 0).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Missing comment: "// 🔑 Public Fields"'),
      ]),
    );
  });

  it("missing import from @nestjs/common fails", () => {
    const templateContent = fs.readFileSync(SERVICE_TEMPLATE_PATH, "utf8");
    const rendered = ejs.render(templateContent, data);
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
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Missing ImportDeclaration "@nestjs/common"'),
      ]),
    );
  });

  it("missing controllers key in @Module fails", () => {
    const templateContent = readModuleTemplate();
    const rendered = ejs.render(templateContent, data);
    const fileContent = rendered.replace("  controllers: [],\n", "");
    const result = validateConformance({
      instance: fileContent,
      template: templateContent,
      data,
      filename: "user.module.ts",
    });
    expect(result.errors.length === 0).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Missing PropertyAssignment "controllers"'),
      ]),
    );
  });

  it("caelundas ephemeris service (heavily modified) passes AST validation", () => {
    const CAELUNDAS_MODULES = path.resolve(
      __dirname,
      "../../../../applications/caelundas/src/modules",
    );
    const fileContent = fs.readFileSync(
      path.join(CAELUNDAS_MODULES, "ephemeris", "ephemeris.service.ts"),
      "utf8",
    );
    const templateContent = fs.readFileSync(SERVICE_TEMPLATE_PATH, "utf8");
    const result = validateConformance({
      instance: fileContent,
      template: templateContent,
      data: { nameCamelCase: "ephemeris", namePascalCase: "Ephemeris" },
      filename: "ephemeris.service.ts",
    });
    const structuralErrors = result.errors.filter(
      (e) => !e.startsWith("Missing template comment:"),
    );
    expect(structuralErrors).toEqual([]);
  });

  it("reworded TODO comment in instance still passes", () => {
    const templateContent = fs
      .readFileSync(SERVICE_TEMPLATE_PATH, "utf8")
      .replace("  // 🔑 Public Fields", "  // TODO: add public fields here");
    const rendered = ejs.render(templateContent, data);
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
    const rendered = ejs.render(templateContent, data);
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
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Missing comment: "// 🔑 Public Fields"'),
      ]),
    );
  });

  it("extra import in instance passes", () => {
    const templateContent = fs.readFileSync(SERVICE_TEMPLATE_PATH, "utf8");
    const rendered = ejs.render(templateContent, data);
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
    const rendered = ejs.render(templateContent, data);
    const fileContent = rendered.replace("  providers: [UserService],\n", "");
    const result = validateConformance({
      instance: fileContent,
      template: templateContent,
      data,
      filename: "user.module.ts",
    });
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Missing PropertyAssignment "providers"'),
      ]),
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
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Missing Identifier "requiredCall"'),
      ]),
    );
  });
});

describe("validateConformanceAST — caelundas module error detection", () => {
  const CAELUNDAS_MODULES = path.resolve(
    __dirname,
    "../../../../applications/caelundas/src/modules",
  );

  function readServiceTemplate(): string {
    return fs.readFileSync(
      path.join(
        path.resolve(
          __dirname,
          "../generators/nestjs-service-module/templates",
        ),
        "__nameCamelCase__.service.ts",
      ),
      "utf8",
    );
  }

  it("missing @Injectable decorator in datetime service fails", () => {
    const fileContent = fs
      .readFileSync(
        path.join(CAELUNDAS_MODULES, "datetime", "datetime.service.ts"),
        "utf8",
      )
      .replace("@Injectable()\n", "");
    const result = validateConformance({
      instance: fileContent,
      template: readServiceTemplate(),
      data: { nameCamelCase: "datetime", namePascalCase: "Datetime" },
      filename: "datetime.service.ts",
    });
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Missing Decorator "Injectable"'),
      ]),
    );
  });

  it("missing section comment in math service fails", () => {
    const fileContent = fs
      .readFileSync(
        path.join(CAELUNDAS_MODULES, "math", "math.service.ts"),
        "utf8",
      )
      .replace("  // 🌎 Public Methods\n", "");
    const result = validateConformance({
      instance: fileContent,
      template: readServiceTemplate(),
      data: { nameCamelCase: "math", namePascalCase: "Math" },
      filename: "math.service.ts",
    });
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Missing comment: "// 🌎 Public Methods"'),
      ]),
    );
  });

  it("renamed class in datetime service fails", () => {
    const fileContent = fs
      .readFileSync(
        path.join(CAELUNDAS_MODULES, "datetime", "datetime.service.ts"),
        "utf8",
      )
      .replaceAll("DatetimeService", "RenamedService");
    const result = validateConformance({
      instance: fileContent,
      template: readServiceTemplate(),
      data: { nameCamelCase: "datetime", namePascalCase: "Datetime" },
      filename: "datetime.service.ts",
    });
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Missing ClassDeclaration "DatetimeService"'),
      ]),
    );
  });

  it("missing constructor in math service fails", () => {
    const fileContent = fs
      .readFileSync(
        path.join(CAELUNDAS_MODULES, "math", "math.service.ts"),
        "utf8",
      )
      .replace("  constructor() {}\n", "");
    const result = validateConformance({
      instance: fileContent,
      template: readServiceTemplate(),
      data: { nameCamelCase: "math", namePascalCase: "Math" },
      filename: "math.service.ts",
    });
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining("Missing Constructor")]),
    );
  });
});
