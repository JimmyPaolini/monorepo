import { createMock } from "@golevelup/ts-vitest";
import { Test } from "@nestjs/testing";
import { addProjectConfiguration } from "@nx/devkit";
import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { LoggerService } from "../logger/logger.service";

import {
  generateNestjsDataloaderModuleGenerator,
  NestjsDataloaderModuleGeneratorCommand,
} from "./nestjs-dataloader-module-generator.command";

import type { Tree } from "@nx/devkit";

describe(NestjsDataloaderModuleGeneratorCommand, () => {
  const projectName = "my-app";
  const projectRoot = "applications/my-app";
  const modulesDirectory = `${projectRoot}/src/modules`;

  let command: NestjsDataloaderModuleGeneratorCommand;
  let tree: Tree;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        NestjsDataloaderModuleGeneratorCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    command = await module.resolve(NestjsDataloaderModuleGeneratorCommand);
  });

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    addProjectConfiguration(tree, projectName, {
      root: projectRoot,
      tags: ["framework:nestjs"],
    });
    tree.write(`${modulesDirectory}/.gitkeep`, "");
  });

  it("is defined", () => {
    expect(command).toBeDefined();
  });

  it("sets logger context", async () => {
    const module = await Test.createTestingModule({
      providers: [
        NestjsDataloaderModuleGeneratorCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    const logger = await module.resolve(LoggerService);

    expect(logger.setContext).toHaveBeenCalledWith(
      "NestjsDataloaderModuleGeneratorCommand",
    );
  });

  it("generates module files from migrated generator logic", async () => {
    await generateNestjsDataloaderModuleGenerator({
      options: {
        name: "post",
        project: projectName,
      },
      tree,
    });

    const modulePath = `${modulesDirectory}/post`;

    expect(tree.exists(`${modulePath}/post.module.ts`)).toBe(true);
    expect(tree.exists(`${modulePath}/post.dataloader.ts`)).toBe(true);
    expect(tree.exists(`${modulePath}/post.dataloader.unit.test.ts`)).toBe(
      true,
    );
    expect(tree.exists(`${modulePath}/post.types.ts`)).toBe(true);
    expect(tree.exists(`${modulePath}/post.constants.ts`)).toBe(true);
  });

  it("validates module names as kebab-case", async () => {
    await expect(
      generateNestjsDataloaderModuleGenerator({
        options: {
          name: "blogPost",
          project: projectName,
        },
        tree,
      }),
    ).rejects.toThrow(
      'Module name "blogPost" must be in kebab-case. Did you mean "blog-post"?',
    );
  });
});
