import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { beforeEach, describe, expect, it } from "vitest";

import { generateNestjsGraphqlApplication } from "./generator";

import type { Tree } from "@nx/devkit";

describe("generateNestjsGraphqlApplication", () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  describe("file generation", () => {
    it("generates a NestJS GraphQL application scaffold in applications/<name>", async () => {
      await generateNestjsGraphqlApplication(tree, {
        name: "stellar-api",
      });

      const base = "applications/stellar-api";
      expect(tree.exists(`${base}/project.json`)).toBeTruthy();
      expect(tree.exists(`${base}/package.json`)).toBeTruthy();
      expect(tree.exists(`${base}/tsconfig.json`)).toBeTruthy();
      expect(tree.exists(`${base}/eslint.config.ts`)).toBeTruthy();
      expect(tree.exists(`${base}/vitest.config.ts`)).toBeTruthy();
      expect(tree.exists(`${base}/src/main.ts`)).toBeTruthy();
      expect(
        tree.exists(`${base}/src/modules/stellar-api/stellar-api.module.ts`),
      ).toBeTruthy();
      expect(
        tree.exists(`${base}/src/modules/stellar-api/stellar-api.constants.ts`),
      ).toBeTruthy();
      expect(
        tree.exists(`${base}/src/modules/logger/logger.service.ts`),
      ).toBeTruthy();
      expect(
        tree.exists(`${base}/src/modules/sample/sample.module.ts`),
      ).toBeTruthy();
      expect(
        tree.exists(`${base}/src/modules/sample/sample.resolver.ts`),
      ).toBeTruthy();
      expect(
        tree.exists(`${base}/src/modules/sample/sample.service.ts`),
      ).toBeTruthy();
      expect(
        tree.exists(`${base}/src/modules/sample/sample.dataloader.ts`),
      ).toBeTruthy();
      expect(
        tree.exists(`${base}/src/modules/sample/sample.entities.ts`),
      ).toBeTruthy();
      expect(tree.exists(`${base}/testing/setup.ts`)).toBeTruthy();
    });

    it("writes expected project tags and GraphQL metadata", async () => {
      await generateNestjsGraphqlApplication(tree, {
        name: "stellar-api",
      });

      const projectJson = tree.read(
        "applications/stellar-api/project.json",
        "utf8",
      );
      expect(projectJson).toContain('"generator:nestjs-graphql-application"');
      expect(projectJson).toContain('"framework:nestjs-graphql-api"');
      expect(projectJson).toContain('"framework:nestjs"');

      const rootModule = tree.read(
        "applications/stellar-api/src/modules/stellar-api/stellar-api.module.ts",
        "utf8",
      );
      expect(rootModule).toContain("GraphQLModule");
      expect(rootModule).toContain("ApolloDriver");
      expect(rootModule).toContain("class StellarApiModule");

      const envDefault = tree.read(
        "applications/stellar-api/.env.default",
        "utf8",
      );
      expect(envDefault).toContain("PORT=3000");
    });

    it("substitutes name variables in generated files", async () => {
      await generateNestjsGraphqlApplication(tree, {
        name: "my-api",
      });

      const mainTs = tree.read("applications/my-api/src/main.ts", "utf8");
      expect(mainTs).toContain("MyApiModule");

      const rootModule = tree.read(
        "applications/my-api/src/modules/my-api/my-api.module.ts",
        "utf8",
      );
      expect(rootModule).toContain("class MyApiModule");
      expect(rootModule).toContain("my-api.constants");
    });
  });

  describe("name validation", () => {
    it("throws when name is not kebab-case", async () => {
      await expect(
        generateNestjsGraphqlApplication(tree, {
          name: "StellarApi",
        }),
      ).rejects.toThrow(
        'Application name "StellarApi" must be in kebab-case. Did you mean "stellar-api"?',
      );
    });
  });

  describe("directory checks", () => {
    it("throws when the destination application directory already exists", async () => {
      tree.write("applications/stellar-api/project.json", "{}");

      await expect(
        generateNestjsGraphqlApplication(tree, {
          name: "stellar-api",
        }),
      ).rejects.toThrow(
        'Directory "applications/stellar-api" already exists. Choose a different application name.',
      );
    });
  });
});
