import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  stringifyConformanceErrors,
  validateInstanceDirectory,
  validateInstanceFile,
  validateInstancesDirectory,
} from "./files";
import { validateTypescriptConformance as validateConformance } from "./validator";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const TEMPLATES_DIR = path.resolve(
  __dirname,
  "../../generators/nestjs-service-module/templates",
);

const SERVICE_TEMPLATE_PATH = path.join(
  TEMPLATES_DIR,
  "__nameCamelCase__.service.ts",
);

describe("caelundas service integration", () => {
  const CAELUNDAS_MODULES = path.resolve(
    __dirname,
    "../../../../../applications/caelundas/src/modules",
  );

  function readCaelundasService(moduleName: string): string {
    return fs.readFileSync(
      path.join(CAELUNDAS_MODULES, moduleName, `${moduleName}.service.ts`),
      "utf8",
    );
  }

  const TEMPLATE_CONTENT = fs.readFileSync(SERVICE_TEMPLATE_PATH, "utf8");

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
      const result = validateConformance({
        instance: fileContent,
        template: TEMPLATE_CONTENT,
        data: {
          nameCamelCase: camel,
          namePascalCase: pascal,
        },
        filename: `${camel}.service.ts`,
      });
      const structuralErrors = result.errors.filter(
        (error) => !error.message.startsWith("Missing template comment:"),
      );
      expect(structuralErrors).toEqual([]);
    });
  }
});

describe("validateInstancesDirectory", () => {
  let temporaryDirectory: string;
  let templateDirectory: string;

  beforeEach(() => {
    temporaryDirectory = fs.mkdtempSync(
      path.join(os.tmpdir(), "validator-modules-"),
    );
    templateDirectory = fs.mkdtempSync(
      path.join(os.tmpdir(), "validator-templates-"),
    );
  });

  afterEach(() => {
    fs.rmSync(temporaryDirectory, { recursive: true });
    fs.rmSync(templateDirectory, { recursive: true });
  });

  it("returns one result per subdirectory", () => {
    const simpleTemplate = "// 🔧 Config\n";
    fs.writeFileSync(
      path.join(templateDirectory, "__nameCamelCase__.config.ts"),
      simpleTemplate,
    );

    const alphaDir = path.join(temporaryDirectory, "alpha");
    fs.mkdirSync(alphaDir);
    fs.writeFileSync(path.join(alphaDir, "alpha.config.ts"), "// 🔧 Config\n");

    const betaDir = path.join(temporaryDirectory, "beta");
    fs.mkdirSync(betaDir);
    fs.writeFileSync(path.join(betaDir, "beta.config.ts"), "// 🔧 Config\n");

    const results = validateInstancesDirectory({
      instancesDirectoryPath: temporaryDirectory,
      templateDirectoryPath: templateDirectory,
    });

    expect(results).toHaveLength(2);
    const directoryNames = results.map((result) => result.directoryName);
    expect(directoryNames).toContain("alpha");
    expect(directoryNames).toContain("beta");
  });

  it("returns empty array when directory has no subdirectories", () => {
    const results = validateInstancesDirectory({
      instancesDirectoryPath: temporaryDirectory,
      templateDirectoryPath: templateDirectory,
    });
    expect(results).toEqual([]);
  });

  it("all passing files return empty error arrays", () => {
    fs.writeFileSync(
      path.join(templateDirectory, "__nameCamelCase__.config.ts"),
      "// 🔧 Config\n",
    );
    const alphaDir = path.join(temporaryDirectory, "alpha");
    fs.mkdirSync(alphaDir);
    fs.writeFileSync(path.join(alphaDir, "alpha.config.ts"), "// 🔧 Config\n");

    const results = validateInstancesDirectory({
      instancesDirectoryPath: temporaryDirectory,
      templateDirectoryPath: templateDirectory,
    });

    for (const result of results) {
      for (const fileResult of result.results) {
        expect(fileResult.errors).toEqual([]);
      }
    }
  });

  it("reports missing file error when instance file is absent", () => {
    fs.writeFileSync(
      path.join(templateDirectory, "__nameCamelCase__.service.ts"),
      "export class UserService {}\n",
    );
    const alphaDir = path.join(temporaryDirectory, "alpha");
    fs.mkdirSync(alphaDir);
    // no instance files written inside alphaDir

    const results = validateInstancesDirectory({
      instancesDirectoryPath: temporaryDirectory,
      templateDirectoryPath: templateDirectory,
    });

    const alphaResult = results.find((r) => r.directoryName === "alpha");
    expect(alphaResult?.results[0]?.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: expect.stringContaining("Missing file:"),
        }),
      ]),
    );
  });
});

describe("validateInstanceFile", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "validator-file-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  it("returns no errors when instance matches template", () => {
    const templatePath = path.join(tmpDir, "template.service.ts");
    fs.writeFileSync(
      templatePath,
      "export class {{namePascalCase}}Service {}\n",
    );
    const instancePath = path.join(tmpDir, "user.service.ts");
    fs.writeFileSync(instancePath, "export class UserService {}\n");

    const result = validateInstanceFile({
      instanceFilePath: instancePath,
      templateFilePath: templatePath,
      data: { namePascalCase: "User" },
    });

    expect(result.errors).toEqual([]);
  });

  it("returns errors when instance is missing a required class", () => {
    const templatePath = path.join(tmpDir, "template.service.ts");
    fs.writeFileSync(
      templatePath,
      "export class {{namePascalCase}}Service {}\n",
    );
    const instancePath = path.join(tmpDir, "user.service.ts");
    fs.writeFileSync(instancePath, "export class WrongService {}\n");

    const result = validateInstanceFile({
      instanceFilePath: instancePath,
      templateFilePath: templatePath,
      data: { namePascalCase: "User" },
    });

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: expect.stringContaining(
            'Missing ClassDeclaration "UserService"',
          ),
        }),
      ]),
    );
  });

  it("returns missing file error when instance file does not exist", () => {
    const templatePath = path.join(tmpDir, "user.service.ts");
    fs.writeFileSync(templatePath, "export class UserService {}\n");
    const instancePath = path.join(tmpDir, "nonexistent.service.ts");

    const result = validateInstanceFile({
      instanceFilePath: instancePath,
      templateFilePath: templatePath,
      data: {},
    });

    expect(result.errors).toEqual([
      expect.objectContaining({ message: `Missing file: ${instancePath}` }),
    ]);
  });
});

describe("validateInstanceDirectory", () => {
  let baseDir: string;
  let instanceDir: string;
  let templateDir: string;

  beforeEach(() => {
    baseDir = fs.mkdtempSync(path.join(os.tmpdir(), "validator-dir-"));
    instanceDir = path.join(baseDir, "user-auth");
    fs.mkdirSync(instanceDir);
    templateDir = fs.mkdtempSync(path.join(os.tmpdir(), "validator-tpl-"));
  });

  afterEach(() => {
    fs.rmSync(baseDir, { recursive: true });
    fs.rmSync(templateDir, { recursive: true });
  });

  it("returns directoryName equal to the directory basename", () => {
    fs.writeFileSync(
      path.join(templateDir, "__nameCamelCase__.service.ts"),
      "// placeholder\n",
    );
    fs.writeFileSync(
      path.join(instanceDir, "userAuth.service.ts"),
      "// placeholder\n",
    );

    const result = validateInstanceDirectory({
      instanceDirectoryPath: instanceDir,
      templateDirectoryPath: templateDir,
    });

    expect(result.directoryName).toBe("user-auth");
  });

  it("resolves __fieldName__ tokens in template filename to instance filename", () => {
    fs.writeFileSync(
      path.join(templateDir, "__nameCamelCase__.service.ts"),
      "export class {{namePascalCase}}Service {}\n",
    );
    fs.writeFileSync(
      path.join(instanceDir, "userAuth.service.ts"),
      "export class UserAuthService {}\n",
    );

    const result = validateInstanceDirectory({
      instanceDirectoryPath: instanceDir,
      templateDirectoryPath: templateDir,
    });

    expect(result.results).toHaveLength(1);
    expect(result.results[0]?.filename).toBe("userAuth.service.ts");
    expect(result.results[0]?.errors).toEqual([]);
  });

  it("returns one result per template file", () => {
    fs.writeFileSync(
      path.join(templateDir, "__nameCamelCase__.service.ts"),
      "// service\n",
    );
    fs.writeFileSync(
      path.join(templateDir, "__nameCamelCase__.module.ts"),
      "// module\n",
    );
    fs.writeFileSync(
      path.join(instanceDir, "userAuth.service.ts"),
      "// service\n",
    );
    fs.writeFileSync(
      path.join(instanceDir, "userAuth.module.ts"),
      "// module\n",
    );

    const result = validateInstanceDirectory({
      instanceDirectoryPath: instanceDir,
      templateDirectoryPath: templateDir,
    });

    expect(result.results).toHaveLength(2);
    const filenames = result.results.map((r) => r.filename);
    expect(filenames).toContain("userAuth.service.ts");
    expect(filenames).toContain("userAuth.module.ts");
  });

  it("reports missing file error when instance file is absent", () => {
    fs.writeFileSync(
      path.join(templateDir, "__nameCamelCase__.service.ts"),
      "export class UserAuthService {}\n",
    );
    // no instance files written

    const result = validateInstanceDirectory({
      instanceDirectoryPath: instanceDir,
      templateDirectoryPath: templateDir,
    });

    expect(result.results[0]?.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: expect.stringContaining("Missing file:"),
        }),
      ]),
    );
  });
});

describe("collectConformanceErrors", () => {
  it("returns null for an empty results array", () => {
    expect(stringifyConformanceErrors([])).toBeNull();
  });

  it("returns null when all files have no errors", () => {
    const results = [
      {
        directoryName: "user",
        results: [
          {
            filename: "user.service.ts",
            instanceFilePath: "/tmp/user/user.service.ts",
            templateFilePath: "/tmp/tpl/user.service.ts",
            errors: [],
          },
          {
            filename: "user.module.ts",
            instanceFilePath: "/tmp/user/user.module.ts",
            templateFilePath: "/tmp/tpl/user.module.ts",
            errors: [],
          },
        ],
      },
    ];
    expect(stringifyConformanceErrors(results)).toBeNull();
  });

  it("formats output with directory section header and file block", () => {
    const results = [
      {
        directoryName: "user",
        results: [
          {
            filename: "user.service.ts",
            instanceFilePath: "/tmp/user/user.service.ts",
            templateFilePath: "/tmp/tpl/user.service.ts",
            errors: [
              {
                errorType: "code" as const,
                message: 'Missing ClassDeclaration "UserService"',
                fix: "Add the class.",
              },
            ],
          },
        ],
      },
    ];
    const output = stringifyConformanceErrors(results);
    expect(output).not.toBeNull();
    expect(output).toContain("user");
    expect(output).toContain("user.service.ts");
    expect(output).toContain('Missing ClassDeclaration "UserService"');
  });

  it("includes fix suggestion in output", () => {
    const results = [
      {
        directoryName: "user",
        results: [
          {
            filename: "user.service.ts",
            instanceFilePath: "/tmp/user/user.service.ts",
            templateFilePath: "/tmp/tpl/user.service.ts",
            errors: [
              {
                errorType: "code" as const,
                message: "Missing something",
                fix: "Do the thing.",
              },
            ],
          },
        ],
      },
    ];
    const output = stringifyConformanceErrors(results);
    expect(output).toContain("Do the thing.");
  });

  it("includes errors from multiple directories", () => {
    const results = [
      {
        directoryName: "user",
        results: [
          {
            filename: "user.service.ts",
            instanceFilePath: "/tmp/user/user.service.ts",
            templateFilePath: "/tmp/tpl/user.service.ts",
            errors: [
              { errorType: "code" as const, message: "error A", fix: "fix A" },
            ],
          },
        ],
      },
      {
        directoryName: "admin",
        results: [
          {
            filename: "admin.service.ts",
            instanceFilePath: "/tmp/admin/admin.service.ts",
            templateFilePath: "/tmp/tpl/admin.service.ts",
            errors: [
              { errorType: "code" as const, message: "error C", fix: "fix C" },
            ],
          },
        ],
      },
    ];
    const output = stringifyConformanceErrors(results);
    expect(output).toContain("user");
    expect(output).toContain("admin");
    expect(output).toContain("error A");
    expect(output).toContain("error C");
  });
});
