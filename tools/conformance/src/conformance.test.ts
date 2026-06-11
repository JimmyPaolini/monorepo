import fs from "node:fs";
import path from "node:path";

import { workspaceRoot } from "@nx/devkit";
import { describe, expect, it } from "vitest";

import { TEMPLATES_DIRECTORY_PATH as COMMAND_APPLICATION_TEMPLATES_DIRECTORY_PATH } from "./generators/nestjs-command-application/generator";
import { TEMPLATES_DIRECTORY_PATH as COMMAND_MODULE_TEMPLATES_DIRECTORY_PATH } from "./generators/nestjs-command-module/generator";
import { TEMPLATES_DIRECTORY_PATH as GRAPHQL_APPLICATION_TEMPLATES_DIRECTORY_PATH } from "./generators/nestjs-graphql-application/generator";
import { TEMPLATES_DIRECTORY_PATH as GRAPHQL_MODULE_TEMPLATES_DIRECTORY_PATH } from "./generators/nestjs-graphql-module/generator";
import { TEMPLATES_DIRECTORY_PATH as SERVICE_MODULE_TEMPLATES_DIRECTORY_PATH } from "./generators/nestjs-service-module/generator";
import {
  stringifyConformanceErrors,
  validateInstanceDirectory,
  validateInstancesDirectory,
} from "./validators/typescript/files";

interface ConformanceTemplateInstance {
  /** Absolute instance paths to validate for this template. */
  instanceDirectoryPaths: string[];
  /** Whether each path points to one instance directory or a directory of many instances. */
  instanceType: "multiple" | "single";
  /** Human-readable template identifier. */
  template: string;
  /** Absolute path to the template directory used for validation. */
  templateDirectoryPath: string;
}

const NESTJS_COMMAND_APPLICATION_GENERATOR_TAG =
  "generator:nestjs-command-application";
const NESTJS_GRAPHQL_APPLICATION_GENERATOR_TAG =
  "generator:nestjs-graphql-application";
const NESTJS_COMMAND_APPLICATION_TAG = "framework:nest-commander";
const NESTJS_APPLICATION_TAG = "framework:nestjs";
const APPLICATIONS_DIRECTORY_PATH = path.join(workspaceRoot, "applications");

function resolveNestjsModuleDirectories(
  applications: { rootPath: string; tags: string[] }[],
  tag: string,
): string[] {
  return applications
    .filter((application) => application.tags.includes(tag))
    .map((application) => {
      return {
        appName: path.basename(application.rootPath),
        modulesPath: path.join(application.rootPath, "src", "modules"),
      };
    })
    .filter(({ modulesPath }) => fs.existsSync(modulesPath))
    .flatMap(({ appName: applicationName, modulesPath }) =>
      fs
        .readdirSync(modulesPath, { withFileTypes: true })
        .filter(
          (entry) =>
            entry.isDirectory() &&
            entry.name !== applicationName &&
            entry.name !== "logger",
        )
        .map((entry) => path.join(modulesPath, entry.name)),
    );
}

function resolveTemplateInstances(): ConformanceTemplateInstance[] {
  const applications = resolveWorkspaceApplications();
  const allNestjsModules = resolveNestjsModuleDirectories(
    applications,
    NESTJS_APPLICATION_TAG,
  );
  const commandApplicationModules = resolveNestjsModuleDirectories(
    applications,
    NESTJS_COMMAND_APPLICATION_TAG,
  );

  const commandModules = commandApplicationModules.filter((directoryPath) =>
    fs.existsSync(
      path.join(directoryPath, `${path.basename(directoryPath)}.command.ts`),
    ),
  );

  const graphqlModules = allNestjsModules.filter((directoryPath) =>
    fs.existsSync(
      path.join(directoryPath, `${path.basename(directoryPath)}.resolver.ts`),
    ),
  );

  const serviceModules = allNestjsModules.filter(
    (directoryPath) =>
      !fs.existsSync(
        path.join(directoryPath, `${path.basename(directoryPath)}.command.ts`),
      ) &&
      !fs.existsSync(
        path.join(directoryPath, `${path.basename(directoryPath)}.resolver.ts`),
      ) &&
      fs.existsSync(
        path.join(directoryPath, `${path.basename(directoryPath)}.service.ts`),
      ),
  );

  const instances: ConformanceTemplateInstance[] = [
    {
      instanceDirectoryPaths: applications
        .filter((application) =>
          application.tags.includes(NESTJS_COMMAND_APPLICATION_GENERATOR_TAG),
        )
        .map((application) => application.rootPath),
      instanceType: "single",
      template: "nestjs-command-application",
      templateDirectoryPath: COMMAND_APPLICATION_TEMPLATES_DIRECTORY_PATH,
    },
    {
      instanceDirectoryPaths: applications
        .filter((application) =>
          application.tags.includes(NESTJS_GRAPHQL_APPLICATION_GENERATOR_TAG),
        )
        .map((application) => application.rootPath),
      instanceType: "single",
      template: "nestjs-graphql-application",
      templateDirectoryPath: GRAPHQL_APPLICATION_TEMPLATES_DIRECTORY_PATH,
    },
    {
      instanceDirectoryPaths: commandModules,
      instanceType: "single",
      template: "nestjs-command-module",
      templateDirectoryPath: COMMAND_MODULE_TEMPLATES_DIRECTORY_PATH,
    },
    {
      instanceDirectoryPaths: graphqlModules,
      instanceType: "single",
      template: "nestjs-graphql-module",
      templateDirectoryPath: GRAPHQL_MODULE_TEMPLATES_DIRECTORY_PATH,
    },
    {
      instanceDirectoryPaths: serviceModules,
      instanceType: "single",
      template: "nestjs-service-module",
      templateDirectoryPath: SERVICE_MODULE_TEMPLATES_DIRECTORY_PATH,
    },
  ];

  return instances.filter(
    (templateInstance) => templateInstance.instanceDirectoryPaths.length > 0,
  );
}

function resolveWorkspaceApplications(): {
  rootPath: string;
  tags: string[];
}[] {
  return fs
    .readdirSync(APPLICATIONS_DIRECTORY_PATH, {
      withFileTypes: true,
    })
    .filter(
      (entry) =>
        entry.isDirectory() &&
        fs.existsSync(
          path.join(APPLICATIONS_DIRECTORY_PATH, entry.name, "project.json"),
        ),
    )
    .map((entry) => {
      const rootPath = path.join(APPLICATIONS_DIRECTORY_PATH, entry.name);
      const projectConfigurationPath = path.join(rootPath, "project.json");
      let projectConfiguration: {
        tags?: string[];
      };
      try {
        projectConfiguration = JSON.parse(
          fs.readFileSync(projectConfigurationPath, "utf8"),
        ) as {
          tags?: string[];
        };
      } catch (error) {
        throw new Error(
          `Unable to parse project configuration at "${projectConfigurationPath}"`,
          {
            cause: error,
          },
        );
      }

      return {
        rootPath,
        tags: projectConfiguration.tags ?? [],
      };
    });
}

describe("generator template conformance", () => {
  for (const conformanceCase of resolveTemplateInstances()) {
    it(`validates "${conformanceCase.template}" generated instances`, () => {
      const results =
        conformanceCase.instanceType === "single"
          ? conformanceCase.instanceDirectoryPaths.map(
              (instanceDirectoryPath) =>
                validateInstanceDirectory({
                  instanceDirectoryPath,
                  templateDirectoryPath: conformanceCase.templateDirectoryPath,
                }),
            )
          : conformanceCase.instanceDirectoryPaths.flatMap(
              (instancesDirectoryPath) =>
                validateInstancesDirectory({
                  instancesDirectoryPath,
                  templateDirectoryPath: conformanceCase.templateDirectoryPath,
                }),
            );

      expect(results.length).toBeGreaterThan(0);
      const errors = stringifyConformanceErrors(results);
      expect(errors).toBeNull();
    });
  }
});
