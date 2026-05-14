import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import ejs from "ejs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { validateConformance, validateGeneratedDirectory } from "./validator";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const TEMPLATES_DIR = path.resolve(
  __dirname,
  "../generators/nestjs-service-module/templates",
);

const SERVICE_TEMPLATE_PATH = path.join(
  TEMPLATES_DIR,
  "__nameCamelCase__.service.ts",
);

const VARS: Record<string, unknown> = {
  nameCamelCase: "user",
  namePascalCase: "User",
};

function readServiceTemplate(): string {
  return fs.readFileSync(SERVICE_TEMPLATE_PATH, "utf8");
}

describe("caelundas service integration", () => {
  const CAELUNDAS_MODULES = path.resolve(
    __dirname,
    "../../../../applications/caelundas/src/modules",
  );

  function readCaelundasService(moduleName: string): string {
    return fs.readFileSync(
      path.join(CAELUNDAS_MODULES, moduleName, `${moduleName}.service.ts`),
      "utf8",
    );
  }

  const TEMPLATE_CONTENT = readServiceTemplate();

  const SERVICES: { camel: string; pascal: string }[] = [
    { camel: "calendar", pascal: "Calendar" },
    { camel: "datetime", pascal: "Datetime" },
    { camel: "ephemeris", pascal: "Ephemeris" },
    { camel: "input", pascal: "Input" },
    { camel: "math", pascal: "Math" },
    { camel: "perfective", pascal: "Perfective" },
    { camel: "progressive", pascal: "Progressive" },
  ];

  for (const { camel, pascal } of SERVICES) {
    it(`${camel} service conforms to the service template structure`, () => {
      const fileContent = readCaelundasService(camel);
      const result = validateConformance(
        fileContent,
        TEMPLATE_CONTENT,
        {
          nameCamelCase: camel,
          namePascalCase: pascal,
        },
        `${camel}.service.ts`,
      );
      expect(result.errors).toEqual([]);
      expect(result.valid).toBe(true);
    });
  }
});

describe("validateConformanceAST", () => {
  const MODULE_TEMPLATE_PATH = path.join(
    TEMPLATES_DIR,
    "__nameCamelCase__.module.ts",
  );

  function readModuleTemplate(): string {
    return fs.readFileSync(MODULE_TEMPLATE_PATH, "utf8");
  }

  it("fresh generated file passes AST validation", () => {
    const templateContent = readServiceTemplate();
    const rendered = ejs.render(templateContent, VARS);
    const result = validateConformance(
      rendered,
      templateContent,
      VARS,
      "user.service.ts",
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("updated controllers array still passes — key present, value changed", () => {
    const templateContent = readModuleTemplate();
    const rendered = ejs.render(templateContent, VARS);
    const fileContent = rendered.replace(
      "controllers: [],",
      "controllers: [UserController],",
    );
    const result = validateConformance(
      fileContent,
      templateContent,
      VARS,
      "user.module.ts",
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("expanded exports array still passes", () => {
    const templateContent = readModuleTemplate();
    const rendered = ejs.render(templateContent, VARS);
    const fileContent = rendered.replace(
      "exports: [UserService],",
      "exports: [UserService, UserRepository],",
    );
    const result = validateConformance(
      fileContent,
      templateContent,
      VARS,
      "user.module.ts",
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("constructor with body still passes", () => {
    const templateContent = readServiceTemplate();
    const rendered = ejs.render(templateContent, VARS);
    const fileContent = rendered.replace(
      "  ) {}",
      "  ) {\n    this.init();\n  }",
    );
    const result = validateConformance(
      fileContent,
      templateContent,
      VARS,
      "user.service.ts",
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("missing @Injectable decorator fails", () => {
    const templateContent = readServiceTemplate();
    const rendered = ejs.render(templateContent, VARS);
    const fileContent = rendered.replace("@Injectable()\n", "");
    const result = validateConformance(
      fileContent,
      templateContent,
      VARS,
      "user.service.ts",
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Missing decorator "@Injectable" on class "UserService"',
    );
  });

  it("wrong class name fails", () => {
    const templateContent = readServiceTemplate();
    const rendered = ejs.render(templateContent, VARS);
    const fileContent = rendered.replace("UserService", "RenamedService");
    const result = validateConformance(
      fileContent,
      templateContent,
      VARS,
      "user.service.ts",
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing class "UserService"');
  });

  it("missing section comment fails even in AST mode", () => {
    const templateContent = readServiceTemplate();
    const rendered = ejs.render(templateContent, VARS);
    const fileContent = rendered.replace("  // 🔑 Public Fields\n", "");
    const result = validateConformance(
      fileContent,
      templateContent,
      VARS,
      "user.service.ts",
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Missing template code: "// 🔑 Public Fields"',
    );
  });

  it("missing import from @nestjs/common fails", () => {
    const templateContent = readServiceTemplate();
    const rendered = ejs.render(templateContent, VARS);
    const fileContent = rendered.replace(
      'import { Injectable } from "@nestjs/common";\n',
      "",
    );
    const result = validateConformance(
      fileContent,
      templateContent,
      VARS,
      "user.service.ts",
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing import from "@nestjs/common"');
  });

  it("missing controllers key in @Module fails", () => {
    const templateContent = readModuleTemplate();
    const rendered = ejs.render(templateContent, VARS);
    const fileContent = rendered.replace("  controllers: [],\n", "");
    const result = validateConformance(
      fileContent,
      templateContent,
      VARS,
      "user.module.ts",
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Missing property "controllers" in "@Module" decorator on class "UserModule"',
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
    const templateContent = readServiceTemplate();
    const result = validateConformance(
      fileContent,
      templateContent,
      { nameCamelCase: "ephemeris", namePascalCase: "Ephemeris" },
      "ephemeris.service.ts",
    );
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });
});

describe("validateGeneratedDirectory", () => {
  let tmpDir: string;
  let templateDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "validator-modules-"));
    templateDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "validator-templates-"),
    );
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
    fs.rmSync(templateDir, { recursive: true });
  });

  it("returns one result per subdirectory", () => {
    const simpleTemplate = "// 🔧 Config\n";
    fs.writeFileSync(
      path.join(templateDir, "__nameCamelCase__.config.ts"),
      simpleTemplate,
    );

    const alphaDir = path.join(tmpDir, "alpha");
    fs.mkdirSync(alphaDir);
    fs.writeFileSync(path.join(alphaDir, "alpha.config.ts"), "// 🔧 Config\n");

    const betaDir = path.join(tmpDir, "beta");
    fs.mkdirSync(betaDir);
    fs.writeFileSync(path.join(betaDir, "beta.config.ts"), "// 🔧 Config\n");

    const results = validateGeneratedDirectory(tmpDir, templateDir, (name) => ({
      nameCamelCase: name,
    }));

    expect(results).toHaveLength(2);
    const names = results.map((r) => r.name);
    expect(names).toContain("alpha");
    expect(names).toContain("beta");
  });
});
