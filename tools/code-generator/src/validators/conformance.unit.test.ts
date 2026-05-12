import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import ejs from "ejs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  validateConformance,
  validateConformanceFiles,
  validateGeneratedDirectory,
} from "./conformance";

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

describe("validateConformance", () => {
  it("fresh generated file passes validation", () => {
    const templateContent = readServiceTemplate();
    const rendered = ejs.render(templateContent, VARS);
    const result = validateConformance(rendered, templateContent, VARS);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("file with added imports and methods still passes", () => {
    const templateContent = readServiceTemplate();
    const rendered = ejs.render(templateContent, VARS);
    const fileContent = `import { HttpClient } from "@angular/common/http";\n${rendered}`;
    const result = validateConformance(fileContent, templateContent, VARS);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("missing emoji marker fails with an error", () => {
    const templateContent = readServiceTemplate();
    const rendered = ejs.render(templateContent, VARS);
    const fileContent = rendered.replace("  // 🔑 Public Fields\n", "");
    const result = validateConformance(fileContent, templateContent, VARS);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Missing template code: "// 🔑 Public Fields"',
    );
  });

  it("out-of-order emoji markers fail", () => {
    const templateContent = readServiceTemplate();
    const rendered = ejs.render(templateContent, VARS);
    const fileContent = rendered
      .replace("  // 🔑 Public Fields", "__PLACEHOLDER__")
      .replace("  // 🔐 Private Fields", "  // 🔑 Public Fields")
      .replace("__PLACEHOLDER__", "  // 🔐 Private Fields");
    const result = validateConformance(fileContent, templateContent, VARS);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Missing template code: "// 🔐 Private Fields"',
    );
  });

  it("missing non-marker structural line fails", () => {
    const templateContent = readServiceTemplate();
    const rendered = ejs.render(templateContent, VARS);
    const fileContent = rendered.replace("@Injectable()\n", "");
    const result = validateConformance(fileContent, templateContent, VARS);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing template code: "@Injectable()"');
  });

  it("conditional EJS block is excluded from structural lines", () => {
    const templateContent = "<% if (false) { -%>\n// 🚧 Conditional\n<% } -%>";
    const result = validateConformance("", templateContent, {});
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});

describe("validateConformanceFiles", () => {
  let tmpFile: string;

  beforeEach(() => {
    tmpFile = path.join(os.tmpdir(), `test-service-${Date.now()}.ts`);
  });

  afterEach(() => {
    if (fs.existsSync(tmpFile)) {
      fs.unlinkSync(tmpFile);
    }
  });

  it("reads real fixture template and validates rendered content", () => {
    const templateContent = readServiceTemplate();
    const rendered = ejs.render(templateContent, VARS);
    fs.writeFileSync(tmpFile, rendered, "utf8");
    const result = validateConformanceFiles(
      tmpFile,
      SERVICE_TEMPLATE_PATH,
      VARS,
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});

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
      const result = validateConformance(fileContent, TEMPLATE_CONTENT, {
        nameCamelCase: camel,
        namePascalCase: pascal,
      });
      expect(result.errors).toEqual([]);
      expect(result.valid).toBe(true);
    });
  }
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
