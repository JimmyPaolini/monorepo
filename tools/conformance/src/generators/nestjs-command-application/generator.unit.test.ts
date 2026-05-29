import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { beforeEach, describe, expect, it } from "vitest";

import { generateNestjsCommandApplication } from "./generator";

import type { Tree } from "@nx/devkit";

describe("generateNestjsCommandApplication", () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  describe("file generation", () => {
    it("generates a NestJS command application scaffold in applications/<name>", async () => {
      await generateNestjsCommandApplication(tree, {
        name: "stellar-cli",
      });

      const base = "applications/stellar-cli";
      expect(tree.exists(`${base}/project.json`)).toBeTruthy();
      expect(tree.exists(`${base}/package.json`)).toBeTruthy();
      expect(tree.exists(`${base}/tsconfig.json`)).toBeTruthy();
      expect(tree.exists(`${base}/eslint.config.ts`)).toBeTruthy();
      expect(tree.exists(`${base}/vitest.config.ts`)).toBeTruthy();
      expect(tree.exists(`${base}/src/main.ts`)).toBeTruthy();
      expect(tree.exists(`${base}/src/stellarCli.module.ts`)).toBeTruthy();
      expect(tree.exists(`${base}/src/stellarCli.command.ts`)).toBeTruthy();
      expect(tree.exists(`${base}/testing/setup.ts`)).toBeTruthy();
    });

    it("writes expected project tags and command metadata", async () => {
      await generateNestjsCommandApplication(tree, {
        name: "stellar-cli",
      });

      const projectJson = tree.read(
        "applications/stellar-cli/project.json",
        "utf8",
      );
      expect(projectJson).toContain('"framework:nest-commander"');
      expect(projectJson).toContain('"framework:nestjs"');

      const commandFile = tree.read(
        "applications/stellar-cli/src/stellarCli.command.ts",
        "utf8",
      );
      expect(commandFile).toContain("name: 'stellar-cli'");
      expect(commandFile).toContain("class StellarCliCommand");

      const envDefault = tree.read(
        "applications/stellar-cli/.env.default",
        "utf8",
      );
      expect(envDefault).toContain("🌱");
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

  describe("directory checks", () => {
    it("throws when the destination application directory already exists", async () => {
      tree.write("applications/stellar-cli/project.json", "{}");

      await expect(
        generateNestjsCommandApplication(tree, {
          name: "stellar-cli",
        }),
      ).rejects.toThrow(
        'Directory "applications/stellar-cli" already exists. Choose a different application name.',
      );
    });
  });
});
