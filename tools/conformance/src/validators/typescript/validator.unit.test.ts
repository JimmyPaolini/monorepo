/* eslint-disable vitest/expect-expect, vitest/require-top-level-describe */

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

describe("heavily modified service integration", () => {
  const TEMPLATE_CONTENT = fs.readFileSync(SERVICE_TEMPLATE_PATH, "utf8");

  const MOCK_SERVICES: { camel: string; content: string; pascal: string }[] = [
    {
      camel: "alpha",
      content: [
        'import { Injectable } from "@nestjs/common";',
        "",
        "@Injectable()",
        "export class AlphaService {",
        "  // 🏗 Dependency Injection",
        "  constructor() {}",
        "",
        "  // 🔐 Private Fields",
        "",
        "  // 🔑 Public Fields",
        "",
        "  // 🔏 Private Methods",
        "",
        "  // 🌎 Public Methods",
        "  public compute(): number {",
        "    return 42;",
        "  }",
        "}",
        "",
      ].join("\n"),
      pascal: "Alpha",
    },
    {
      camel: "beta",
      content: [
        'import { Injectable } from "@nestjs/common";',
        "",
        'import { AlphaService } from "./alpha.service";',
        "",
        "@Injectable()",
        "export class BetaService {",
        "  // 🏗 Dependency Injection",
        "  constructor(private readonly alphaService: AlphaService) {}",
        "",
        "  // 🔐 Private Fields",
        "  private readonly cache = new Map<string, string>();",
        "",
        "  // 🔑 Public Fields",
        "",
        "  // 🔏 Private Methods",
        "  private format(value: string): string {",
        "    return value.trim();",
        "  }",
        "",
        "  // 🌎 Public Methods",
        "  public process(input: string): string {",
        "    return this.format(input);",
        "  }",
        "}",
        "",
      ].join("\n"),
      pascal: "Beta",
    },
    {
      camel: "gamma",
      content: [
        'import { Injectable } from "@nestjs/common";',
        'import { Logger } from "@nestjs/common";',
        "",
        "/** Gamma service with extra fields interspersed between section comments. */",
        "@Injectable()",
        "export class GammaService {",
        "  // 🏗 Dependency Injection",
        "  constructor() {}",
        "",
        "  // 🔐 Private Fields",
        "  private readonly logger = new Logger(GammaService.name);",
        "  private readonly values: number[] = [];",
        "",
        "  // 🔑 Public Fields",
        "",
        "  // 🔏 Private Methods",
        "  private sum(): number {",
        "    return this.values.reduce((acc, v) => acc + v, 0);",
        "  }",
        "",
        "  // 🌎 Public Methods",
        "  public add(value: number): void {",
        "    this.values.push(value);",
        "  }",
        "",
        "  public total(): number {",
        "    return this.sum();",
        "  }",
        "}",
        "",
      ].join("\n"),
      pascal: "Gamma",
    },
  ];

  for (const { camel, content, pascal } of MOCK_SERVICES) {
    it(`${camel} service conforms to the service template structure`, () => {
      const result = validateConformance({
        data: {
          nameCamelCase: camel,
          namePascalCase: pascal,
        },
        filename: `${camel}.service.ts`,
        instance: content,
        template: TEMPLATE_CONTENT,
      });
      const structuralErrors = result.errors.filter(
        (error) => !error.message.startsWith("Missing comment:"),
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
      path.join(templateDirectory, "__nameKebabCase__.config.ts"),
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
      path.join(templateDirectory, "__nameKebabCase__.config.ts"),
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
      path.join(templateDirectory, "__nameKebabCase__.service.ts"),
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
    expectErrorWithMessage(
      alphaResult?.results[0]?.errors ?? [],
      "Missing file:",
    );
  });
});

describe("validateInstanceFile", () => {
  let temporaryDirectory: string;

  beforeEach(() => {
    temporaryDirectory = fs.mkdtempSync(
      path.join(os.tmpdir(), "validator-file-"),
    );
  });

  afterEach(() => {
    fs.rmSync(temporaryDirectory, { recursive: true });
  });

  it("returns no errors when instance matches template", () => {
    const templatePath = path.join(temporaryDirectory, "template.service.ts");
    fs.writeFileSync(
      templatePath,
      "export class {{namePascalCase}}Service {}\n",
    );
    const instancePath = path.join(temporaryDirectory, "user.service.ts");
    fs.writeFileSync(instancePath, "export class UserService {}\n");

    const result = validateInstanceFile({
      data: { namePascalCase: "User" },
      instanceFilePath: instancePath,
      templateFilePath: templatePath,
    });

    expect(result.errors).toEqual([]);
  });

  it("returns errors when instance is missing a required class", () => {
    const templatePath = path.join(temporaryDirectory, "template.service.ts");
    fs.writeFileSync(
      templatePath,
      "export class {{namePascalCase}}Service {}\n",
    );
    const instancePath = path.join(temporaryDirectory, "user.service.ts");
    fs.writeFileSync(instancePath, "export class WrongService {}\n");

    const result = validateInstanceFile({
      data: { namePascalCase: "User" },
      instanceFilePath: instancePath,
      templateFilePath: templatePath,
    });

    expectErrorWithMessage(
      result.errors,
      'Missing ClassDeclaration "UserService"',
    );
  });

  it("returns missing file error when instance file does not exist", () => {
    const templatePath = path.join(temporaryDirectory, "user.service.ts");
    fs.writeFileSync(templatePath, "export class UserService {}\n");
    const instancePath = path.join(
      temporaryDirectory,
      "nonexistent.service.ts",
    );

    const result = validateInstanceFile({
      data: {},
      instanceFilePath: instancePath,
      templateFilePath: templatePath,
    });

    expect(result.errors).toEqual([
      expect.objectContaining({ message: `Missing file: ${instancePath}` }),
    ]);
  });
});

describe("validateInstanceDirectory", () => {
  let baseDirectory: string;
  let instanceDir: string;
  let templateDirectory: string;

  beforeEach(() => {
    baseDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "validator-dir-"));
    instanceDir = path.join(baseDirectory, "user-auth");
    fs.mkdirSync(instanceDir);
    templateDirectory = fs.mkdtempSync(
      path.join(os.tmpdir(), "validator-tpl-"),
    );
  });

  afterEach(() => {
    fs.rmSync(baseDirectory, { recursive: true });
    fs.rmSync(templateDirectory, { recursive: true });
  });

  it("returns directoryName equal to the directory basename", () => {
    fs.writeFileSync(
      path.join(templateDirectory, "__nameKebabCase__.service.ts"),
      "// placeholder\n",
    );
    fs.writeFileSync(
      path.join(instanceDir, "user-auth.service.ts"),
      "// placeholder\n",
    );

    const result = validateInstanceDirectory({
      instanceDirectoryPath: instanceDir,
      templateDirectoryPath: templateDirectory,
    });

    expect(result.directoryName).toBe("user-auth");
  });

  it("resolves __fieldName__ tokens in template filename to instance filename", () => {
    fs.writeFileSync(
      path.join(templateDirectory, "__nameKebabCase__.service.ts"),
      "export class {{namePascalCase}}Service {}\n",
    );
    fs.writeFileSync(
      path.join(instanceDir, "user-auth.service.ts"),
      "export class UserAuthService {}\n",
    );

    const result = validateInstanceDirectory({
      instanceDirectoryPath: instanceDir,
      templateDirectoryPath: templateDirectory,
    });

    expect(result.results).toHaveLength(1);
    expect(result.results[0]?.filename).toBe("user-auth.service.ts");
    expect(result.results[0]?.errors).toEqual([]);
  });

  it("returns one result per template file", () => {
    fs.writeFileSync(
      path.join(templateDirectory, "__nameKebabCase__.service.ts"),
      "// service\n",
    );
    fs.writeFileSync(
      path.join(templateDirectory, "__nameKebabCase__.module.ts"),
      "// module\n",
    );
    fs.writeFileSync(
      path.join(instanceDir, "user-auth.service.ts"),
      "// service\n",
    );
    fs.writeFileSync(
      path.join(instanceDir, "user-auth.module.ts"),
      "// module\n",
    );

    const result = validateInstanceDirectory({
      instanceDirectoryPath: instanceDir,
      templateDirectoryPath: templateDirectory,
    });

    expect(result.results).toHaveLength(2);
    const filenames = result.results.map((r) => r.filename);
    expect(filenames).toContain("user-auth.service.ts");
    expect(filenames).toContain("user-auth.module.ts");
  });

  it("reports missing file error when instance file is absent", () => {
    fs.writeFileSync(
      path.join(templateDirectory, "__nameKebabCase__.service.ts"),
      "export class UserAuthService {}\n",
    );
    // no instance files written

    const result = validateInstanceDirectory({
      instanceDirectoryPath: instanceDir,
      templateDirectoryPath: templateDirectory,
    });

    expectErrorWithMessage(result.results[0]?.errors ?? [], "Missing file:");
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
            errors: [],
            filename: "user.service.ts",
            instanceFilePath: "/tmp/user/user.service.ts",
            templateFilePath: "/tmp/tpl/user.service.ts",
          },
          {
            errors: [],
            filename: "user.module.ts",
            instanceFilePath: "/tmp/user/user.module.ts",
            templateFilePath: "/tmp/tpl/user.module.ts",
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
            errors: [
              {
                errorType: "code" as const,
                fix: "Add the class.",
                message: 'Missing ClassDeclaration "UserService"',
              },
            ],
            filename: "user.service.ts",
            instanceFilePath: "/tmp/user/user.service.ts",
            templateFilePath: "/tmp/tpl/user.service.ts",
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
            errors: [
              {
                errorType: "code" as const,
                fix: "Do the thing.",
                message: "Missing something",
              },
            ],
            filename: "user.service.ts",
            instanceFilePath: "/tmp/user/user.service.ts",
            templateFilePath: "/tmp/tpl/user.service.ts",
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
            errors: [
              { errorType: "code" as const, fix: "fix A", message: "error A" },
            ],
            filename: "user.service.ts",
            instanceFilePath: "/tmp/user/user.service.ts",
            templateFilePath: "/tmp/tpl/user.service.ts",
          },
        ],
      },
      {
        directoryName: "admin",
        results: [
          {
            errors: [
              { errorType: "code" as const, fix: "fix C", message: "error C" },
            ],
            filename: "admin.service.ts",
            instanceFilePath: "/tmp/admin/admin.service.ts",
            templateFilePath: "/tmp/tpl/admin.service.ts",
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

  it("includes line and column in output when present on error", () => {
    const results = [
      {
        directoryName: "user",
        results: [
          {
            errors: [
              {
                errorType: "code" as const,
                fix: "Add missing node.",
                instanceColumn: 4,
                instanceLine: 10,
                message: "Missing something",
                templateColumn: 0,
                templateLine: 5,
              },
            ],
            filename: "user.service.ts",
            instanceFilePath: "/tmp/user/user.service.ts",
            templateFilePath: "/tmp/tpl/user.service.ts",
          },
        ],
      },
    ];
    const output = stringifyConformanceErrors(results);
    expect(output).toContain("Line 10");
    expect(output).toContain("Column 4");
  });

  it("includes JSON path in output when instancePath is set", () => {
    const results = [
      {
        directoryName: "app",
        results: [
          {
            errors: [
              {
                errorType: "code" as const,
                fix: "Add the key.",
                instancePath: "scripts.build",
                message: "Missing key",
                templatePath: "scripts.build",
              },
            ],
            filename: "package.json",
            instanceFilePath: "/tmp/app/package.json",
            templateFilePath: "/tmp/tpl/package.json",
          },
        ],
      },
    ];
    const output = stringifyConformanceErrors(results);
    expect(output).toContain('JSON path "scripts.build"');
  });

  it("includes expected and actual values in output when both are set", () => {
    const results = [
      {
        directoryName: "app",
        results: [
          {
            errors: [
              {
                actual: '"old-value"',
                errorType: "code" as const,
                expected: '"new-value"',
                fix: "Change the value.",
                instancePath: "name",
                message: "Value mismatch",
                templatePath: "name",
              },
            ],
            filename: "package.json",
            instanceFilePath: "/tmp/app/package.json",
            templateFilePath: "/tmp/tpl/package.json",
          },
        ],
      },
    ];
    const output = stringifyConformanceErrors(results);
    expect(output).toContain("Expected:");
    expect(output).toContain("new-value");
    expect(output).toContain("Actual");
    expect(output).toContain("old-value");
  });
});

describe("validateInstanceFile — extension routing", () => {
  let temporaryDirectory: string;

  beforeEach(() => {
    temporaryDirectory = fs.mkdtempSync(
      path.join(os.tmpdir(), "validator-ext-"),
    );
  });

  afterEach(() => {
    fs.rmSync(temporaryDirectory, { recursive: true });
  });

  it("routes .json files to the JSON validator", () => {
    const templatePath = path.join(temporaryDirectory, "package.json");
    fs.writeFileSync(templatePath, `{ "name": "required-name" }`);
    const instancePath = path.join(temporaryDirectory, "package.json");
    fs.writeFileSync(instancePath, `{ "name": "required-name" }`);

    const result = validateInstanceFile({
      data: {},
      instanceFilePath: instancePath,
      templateFilePath: templatePath,
    });

    expect(result.errors).toEqual([]);
  });

  it("reports a JSON conformance error when a required key is missing", () => {
    const templateDirectory = path.join(temporaryDirectory, "template");
    const instanceDirectory = path.join(temporaryDirectory, "instance");
    fs.mkdirSync(templateDirectory);
    fs.mkdirSync(instanceDirectory);
    const templatePath = path.join(templateDirectory, "project.json");
    fs.writeFileSync(templatePath, `{ "version": "1.0.0" }`);
    const instancePath = path.join(instanceDirectory, "project.json");
    fs.writeFileSync(instancePath, `{ "name": "my-app" }`);

    const result = validateInstanceFile({
      data: {},
      instanceFilePath: instancePath,
      templateFilePath: templatePath,
    });

    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("routes .md files to the markdown/text validator without throwing", () => {
    const templatePath = path.join(temporaryDirectory, "README.md");
    fs.writeFileSync(templatePath, "# My App\n");
    const instancePath = path.join(temporaryDirectory, "README.md");
    fs.writeFileSync(instancePath, "# My App\n");

    const result = validateInstanceFile({
      data: {},
      instanceFilePath: instancePath,
      templateFilePath: templatePath,
    });

    expect(result.errors).toEqual([]);
  });

  it("routes unknown extensions to the text validator without throwing", () => {
    const templatePath = path.join(temporaryDirectory, "config.txt");
    fs.writeFileSync(templatePath, "hello world");
    const instancePath = path.join(temporaryDirectory, "config.txt");
    fs.writeFileSync(instancePath, "hello world");

    const result = validateInstanceFile({
      data: {},
      instanceFilePath: instancePath,
      templateFilePath: templatePath,
    });

    expect(result.errors).toEqual([]);
  });
});
