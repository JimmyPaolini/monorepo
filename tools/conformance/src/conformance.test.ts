import fs, { globSync } from "node:fs";
import path from "node:path";

import { workspaceRoot } from "@nx/devkit";
import { describe, expect, it } from "vitest";

import {
  APPLICATIONS_DIRECTORY,
  converterByStringCase,
  PACKAGES_DIRECTORY,
  TOOLS_DIRECTORY,
} from "./constants";
import { COMMAND_APPLICATION_TEMPLATES_DIRECTORY_PATH } from "./generators/nestjs-command-application/generator";
import { COMMAND_MODULE_TEMPLATES_DIRECTORY_PATH } from "./generators/nestjs-command-module/generator";
import { GRAPHQL_APPLICATION_TEMPLATES_DIRECTORY_PATH } from "./generators/nestjs-graphql-application/generator";
import { GRAPHQL_MODULE_TEMPLATES_DIRECTORY_PATH } from "./generators/nestjs-graphql-module/generator";
import { SERVICE_FILES_TEMPLATES_DIRECTORY_PATH } from "./generators/nestjs-service-file/generator";
import { SERVICE_MODULE_TEMPLATES_DIRECTORY_PATH } from "./generators/nestjs-service-module/generator";
import { StringCase } from "./types";
import {
  stringifyConformanceErrors,
  validateInstanceDirectory,
  validateInstanceFile,
  validateInstancesDirectory,
} from "./validators/typescript/files";

import type { InstanceDirectoryValidationResult } from "./validators/typescript/types";

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
const DEFAULT_INSTANCE_DIRECTORIES = [APPLICATIONS_DIRECTORY] as const;
const COMMAND_APPLICATION_INSTANCE_DIRECTORIES = [
  APPLICATIONS_DIRECTORY,
  PACKAGES_DIRECTORY,
  TOOLS_DIRECTORY,
] as const;

function resolveNestjsModuleDirectories(
  applications: { rootPath: string; tags: string[] }[],
  tag: string,
): string[] {
  return applications
    .filter((application) => application.tags.includes(tag))
    .map((application) => {
      return {
        applicationName: path.basename(application.rootPath),
        modulesPath: path.join(application.rootPath, "src", "modules"),
      };
    })
    .filter(({ modulesPath }) => fs.existsSync(modulesPath))
    .flatMap(({ applicationName, modulesPath }) =>
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

function resolveWorkspaceApplications(
  instanceDirectories: readonly string[] = DEFAULT_INSTANCE_DIRECTORIES,
): {
  rootPath: string;
  tags: string[];
}[] {
  return instanceDirectories.flatMap((instanceDirectory) => {
    const instanceDirectoryPath = path.join(workspaceRoot, instanceDirectory);
    if (!fs.existsSync(instanceDirectoryPath)) {
      return [];
    }

    return fs
      .readdirSync(instanceDirectoryPath, {
        withFileTypes: true,
      })
      .filter(
        (entry) =>
          entry.isDirectory() &&
          fs.existsSync(
            path.join(instanceDirectoryPath, entry.name, "project.json"),
          ),
      )
      .map((entry) => {
        const rootPath = path.join(instanceDirectoryPath, entry.name);
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
  });
}

function validateCommandApplicationDirectories(args: {
  instanceDirectoryPaths: string[];
  templateDirectoryPath: string;
}): InstanceDirectoryValidationResult[] {
  const { instanceDirectoryPaths, templateDirectoryPath } = args;
  const templateFilenames = fs
    .readdirSync(templateDirectoryPath, { withFileTypes: true })
    .filter((node) => node.isFile())
    .map((node) => node.name)
    .toSorted();

  return instanceDirectoryPaths.map((instanceDirectoryPath) => {
    const directoryName = path.basename(instanceDirectoryPath);
    const relativeInstanceDirectoryPath = path.relative(
      workspaceRoot,
      instanceDirectoryPath,
    );
    const [destinationRoot] = relativeInstanceDirectoryPath.split(path.sep);
    const nameKebabCase =
      converterByStringCase[StringCase.KEBAB_CASE](directoryName);
    const data = {
      destinationRoot: destinationRoot ?? APPLICATIONS_DIRECTORY,
      nameCamelCase:
        converterByStringCase[StringCase.CAMEL_CASE](nameKebabCase),
      nameKebabCase,
      namePascalCase:
        converterByStringCase[StringCase.PASCAL_CASE](nameKebabCase),
      nameSnakeCase:
        converterByStringCase[StringCase.SNAKE_CASE](nameKebabCase),
    };

    return {
      directoryName,
      results: templateFilenames.map((templateFilename) => {
        const templateFilePath = path.join(
          templateDirectoryPath,
          templateFilename,
        );
        const instanceFilename = templateFilename.replaceAll(
          "__nameKebabCase__",
          nameKebabCase,
        );
        const instanceFilePath = path.join(
          instanceDirectoryPath,
          instanceFilename,
        );
        const validationResult = validateInstanceFile({
          data,
          instanceFilePath,
          templateFilePath,
        });

        return {
          ...validationResult,
          filename: instanceFilename,
        };
      }),
    };
  });
}

describe("generator template conformance", () => {
  const applications = resolveWorkspaceApplications();
  const commandApplicationInstances = resolveWorkspaceApplications(
    COMMAND_APPLICATION_INSTANCE_DIRECTORIES,
  );
  const allNestjsModules = resolveNestjsModuleDirectories(
    applications,
    NESTJS_APPLICATION_TAG,
  );
  const commandApplicationModules = resolveNestjsModuleDirectories(
    commandApplicationInstances,
    NESTJS_COMMAND_APPLICATION_TAG,
  );

  // Projects whose command modules contain hand-edited implementations and
  // should not be checked against the generated stub template.
  const HAND_EDITED_COMMAND_APPLICATION_NAMES = new Set(["synchronization"]);

  const commandModules = commandApplicationModules.filter(
    (directoryPath) =>
      fs.existsSync(
        path.join(directoryPath, `${path.basename(directoryPath)}.command.ts`),
      ) &&
      !HAND_EDITED_COMMAND_APPLICATION_NAMES.has(
        path.basename(path.dirname(path.dirname(path.dirname(directoryPath)))),
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
        path.join(directoryPath, `${path.basename(directoryPath)}.module.ts`),
      ) &&
      fs.existsSync(
        path.join(directoryPath, `${path.basename(directoryPath)}.service.ts`),
      ),
  );
  const serviceFileModules = allNestjsModules.filter(
    (directoryPath) =>
      !fs.existsSync(
        path.join(directoryPath, `${path.basename(directoryPath)}.command.ts`),
      ) &&
      !fs.existsSync(
        path.join(directoryPath, `${path.basename(directoryPath)}.resolver.ts`),
      ) &&
      !fs.existsSync(
        path.join(directoryPath, `${path.basename(directoryPath)}.module.ts`),
      ) &&
      fs.existsSync(
        path.join(directoryPath, `${path.basename(directoryPath)}.service.ts`),
      ),
  );

  const conformanceTemplateInstances: ConformanceTemplateInstance[] = [
    {
      instanceDirectoryPaths: commandApplicationInstances
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
    {
      instanceDirectoryPaths: serviceFileModules,
      instanceType: "single",
      template: "nestjs-service-file",
      templateDirectoryPath: SERVICE_FILES_TEMPLATES_DIRECTORY_PATH,
    },
  ];

  const conformanceCases = conformanceTemplateInstances.filter(
    (templateInstance) => templateInstance.instanceDirectoryPaths.length > 0,
  );

  it.each(conformanceCases)(
    'validates "$template" generated instances',
    (conformanceCase) => {
      const results =
        conformanceCase.template === "nestjs-command-application"
          ? validateCommandApplicationDirectories({
              instanceDirectoryPaths: conformanceCase.instanceDirectoryPaths,
              templateDirectoryPath: conformanceCase.templateDirectoryPath,
            })
          : conformanceCase.instanceType === "single"
            ? conformanceCase.instanceDirectoryPaths.map(
                (instanceDirectoryPath) =>
                  validateInstanceDirectory({
                    instanceDirectoryPath,
                    templateDirectoryPath:
                      conformanceCase.templateDirectoryPath,
                  }),
              )
            : conformanceCase.instanceDirectoryPaths.flatMap(
                (instancesDirectoryPath) =>
                  validateInstancesDirectory({
                    instancesDirectoryPath,
                    templateDirectoryPath:
                      conformanceCase.templateDirectoryPath,
                  }),
              );

      expect(results.length).toBeGreaterThan(0);

      const errors = stringifyConformanceErrors(results);

      expect(errors).toBeNull();
    },
  );

  it("validates all NestJS service files and tests with nestjs-service-file templates", () => {
    const nestjsApplications = applications.filter((application) =>
      application.tags.includes(NESTJS_APPLICATION_TAG),
    );
    const serviceImplementationFilePaths = nestjsApplications.flatMap(
      (application) => {
        return globSync(
          path.join(application.rootPath, "src/modules/*/*.service.ts"),
        );
      },
    );
    const templateFilenames = fs
      .readdirSync(SERVICE_FILES_TEMPLATES_DIRECTORY_PATH, {
        withFileTypes: true,
      })
      .filter((node) => node.isFile())
      .map((node) => node.name)
      .toSorted();

    expect(serviceImplementationFilePaths.length).toBeGreaterThan(0);
    expect(templateFilenames.length).toBeGreaterThan(0);

    const serviceFileValidationResults: InstanceDirectoryValidationResult[] =
      serviceImplementationFilePaths.map((serviceFilePath) => {
        const serviceName = path
          .basename(serviceFilePath)
          .replace(".service.ts", "");
        const nameKebabCase =
          converterByStringCase[StringCase.KEBAB_CASE](serviceName);
        const data = {
          nameCamelCase:
            converterByStringCase[StringCase.CAMEL_CASE](nameKebabCase),
          nameKebabCase,
          namePascalCase:
            converterByStringCase[StringCase.PASCAL_CASE](nameKebabCase),
        };
        const validationResults = templateFilenames.map((templateFilename) => {
          const templateFilePath = path.join(
            SERVICE_FILES_TEMPLATES_DIRECTORY_PATH,
            templateFilename,
          );
          const instanceFilename = templateFilename.replaceAll(
            "__nameKebabCase__",
            nameKebabCase,
          );
          const instanceFilePath = path.join(
            path.dirname(serviceFilePath),
            instanceFilename,
          );
          const validationResult = validateInstanceFile({
            data,
            instanceFilePath,
            templateFilePath,
          });

          return {
            ...validationResult,
            filename: instanceFilename,
          };
        });

        return {
          directoryName: path.relative(
            workspaceRoot,
            path.dirname(serviceFilePath),
          ),
          results: validationResults,
        };
      });
    const errors = stringifyConformanceErrors(serviceFileValidationResults);

    expect(errors).toBeNull();
  });
});
