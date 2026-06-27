import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { beforeEach, describe, expect, it } from "vitest";

import { generateNestjsCommandApplication } from "./generator";

import type { Tree } from "@nx/devkit";

describe(generateNestjsCommandApplication, () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  describe("file generation", () => {
    it("generates a NestJS command application scaffold in applications/<name>", async () => {
      await generateNestjsCommandApplication(tree, {
        destinationRoot: "applications",
        name: "stellar-cli",
      });

      const base = "applications/stellar-cli";

      expect(tree.exists(`${base}/project.json`)).toBe(true);
      expect(tree.exists(`${base}/package.json`)).toBe(true);
      expect(tree.exists(`${base}/tsconfig.json`)).toBe(true);
      expect(tree.exists(`${base}/eslint.config.ts`)).toBe(true);
      expect(tree.exists(`${base}/vitest.config.ts`)).toBe(true);
      expect(tree.exists(`${base}/src/main.ts`)).toBe(true);
      expect(tree.exists(`${base}/src/repl.ts`)).toBe(true);
      expect(
        tree.exists(`${base}/src/modules/stellar-cli/stellar-cli.module.ts`),
      ).toBe(true);
      expect(
        tree.exists(`${base}/src/modules/stellar-cli/stellar-cli.command.ts`),
      ).toBe(true);
      expect(tree.exists(`${base}/src/modules/logger/logger.service.ts`)).toBe(
        true,
      );
      expect(tree.exists(`${base}/testing/setup.ts`)).toBe(true);
    });

    it("generates a NestJS command application scaffold in tools/<name>", async () => {
      await generateNestjsCommandApplication(tree, {
        destinationRoot: "tools",
        name: "stellar-cli",
      });

      const base = "tools/stellar-cli";

      expect(tree.exists(`${base}/project.json`)).toBe(true);
      expect(tree.exists(`${base}/package.json`)).toBe(true);
      expect(tree.exists(`${base}/src/main.ts`)).toBe(true);
    });

    it("generates a NestJS command application scaffold in packages/<name>", async () => {
      await generateNestjsCommandApplication(tree, {
        destinationRoot: "packages",
        name: "stellar-cli",
      });

      const base = "packages/stellar-cli";

      expect(tree.exists(`${base}/project.json`)).toBe(true);
      expect(tree.exists(`${base}/package.json`)).toBe(true);
      expect(tree.exists(`${base}/src/main.ts`)).toBe(true);
    });

    it("writes expected project tags and command metadata", async () => {
      await generateNestjsCommandApplication(tree, {
        destinationRoot: "applications",
        name: "stellar-cli",
      });

      const projectJson = tree.read(
        "applications/stellar-cli/project.json",
        "utf8",
      );

      expect(projectJson).toContain('"generator:nestjs-command-application"');
      expect(projectJson).toContain('"framework:nest-commander"');
      expect(projectJson).toContain('"framework:nestjs"');
      expect(projectJson).toContain('"sourceRoot": "applications/stellar-cli"');

      const commandFile = tree.read(
        "applications/stellar-cli/src/modules/stellar-cli/stellar-cli.command.ts",
        "utf8",
      );

      expect(commandFile).toContain("name: 'stellar-cli'");
      expect(commandFile).toContain("class StellarCliCommand");

      const environmentDefault = tree.read(
        "applications/stellar-cli/.env.default",
        "utf8",
      );

      expect(environmentDefault).toContain("🌱");
    });
  });

  describe("name validation", () => {
    it("throws when name is not kebab-case", async () => {
      await expect(
        generateNestjsCommandApplication(tree, {
          name: "StellarCli",
        }),
      ).rejects.toThrow(
        'Application name "StellarCli" must be in kebab-case. Did you mean "stellar-cli"?',
      );
    });
  });

  describe("destination root validation", () => {
    it("throws when destinationRoot is not a valid value", async () => {
      await expect(
        generateNestjsCommandApplication(tree, {
          destinationRoot: "invalid-dir",
          name: "stellar-cli",
        }),
      ).rejects.toThrow(
        'Destination root "invalid-dir" is not valid. Allowed values: applications, packages, tools',
      );
    });
  });

  describe("directory checks", () => {
    it("throws when the destination directory already exists in applications", async () => {
      tree.write("applications/stellar-cli/project.json", "{}");

      await expect(
        generateNestjsCommandApplication(tree, {
          destinationRoot: "applications",
          name: "stellar-cli",
        }),
      ).rejects.toThrow(
        'Directory "applications/stellar-cli" already exists. Choose a different application name.',
      );
    });

    it("throws when the destination directory already exists in tools", async () => {
      tree.write("tools/stellar-cli/project.json", "{}");

      await expect(
        generateNestjsCommandApplication(tree, {
          destinationRoot: "tools",
          name: "stellar-cli",
        }),
      ).rejects.toThrow(
        'Directory "tools/stellar-cli" already exists. Choose a different application name.',
      );
    });
  });
});
