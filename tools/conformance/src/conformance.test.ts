import fs, { globSync } from "node:fs";
import path from "node:path";

import { workspaceRoot } from "@nx/devkit";
import { describe, expect, it } from "vitest";

import { converterByStringCase } from "./constants";
import { TEMPLATES_DIRECTORY_PATH as COMMAND_APPLICATION_TEMPLATES_DIRECTORY_PATH } from "./generators/nestjs-command-application/generator";
import { TEMPLATES_DIRECTORY_PATH as COMMAND_MODULE_TEMPLATES_DIRECTORY_PATH } from "./generators/nestjs-command-module/generator";
import { TEMPLATES_DIRECTORY_PATH as GRAPHQL_APPLICATION_TEMPLATES_DIRECTORY_PATH } from "./generators/nestjs-graphql-application/generator";
import { TEMPLATES_DIRECTORY_PATH as GRAPHQL_MODULE_TEMPLATES_DIRECTORY_PATH } from "./generators/nestjs-graphql-module/generator";
import { TEMPLATES_DIRECTORY_PATH as SERVICE_FILES_TEMPLATES_DIRECTORY_PATH } from "./generators/nestjs-service-files/generator";
import { TEMPLATES_DIRECTORY_PATH as SERVICE_MODULE_TEMPLATES_DIRECTORY_PATH } from "./generators/nestjs-service-module/generator";
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
const APPLICATIONS_DIRECTORY_PATH = path.join(workspaceRoot, "applications");
const SERVICE_TEMPLATE_FILE_PATH = path.join(
  SERVICE_FILES_TEMPLATES_DIRECTORY_PATH,
  "__nameKebabCase__.service.ts",
);
const SERVICE_UNIT_TEST_TEMPLATE_FILE_PATH = path.join(
  SERVICE_FILES_TEMPLATES_DIRECTORY_PATH,
  "__nameKebabCase__.service.unit.test.ts",
);

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

function resolveNestjsServiceFilePaths(
  nestjsApplications: { rootPath: string; tags: string[] }[],
): string[] {
  return nestjsApplications.flatMap((application) => {
    const serviceFilePaths = [
      ...globSync(
        path.join(application.rootPath, "src/modules/*/*.service.ts"),
      ),
      ...globSync(
        path.join(application.rootPath, "src/modules/*/*.service.unit.test.ts"),
      ),
    ];
    const serviceFilePathSet = new Set(serviceFilePaths);
    return serviceFilePaths.filter((serviceFilePath) => {
      const moduleName = path.basename(path.dirname(serviceFilePath));
      const filename = path.basename(serviceFilePath);
      const isModulePrimaryServiceFile =
        filename === `${moduleName}.service.ts` ||
        filename === `${moduleName}.service.unit.test.ts`;
      if (!isModulePrimaryServiceFile) {
        return false;
      }
      const matchingServiceFilePath = serviceFilePath.endsWith(
        ".service.unit.test.ts",
      )
        ? serviceFilePath.replace(".service.unit.test.ts", ".service.ts")
        : serviceFilePath.replace(".service.ts", ".service.unit.test.ts");
      return serviceFilePathSet.has(matchingServiceFilePath);
    });
  });
}

function resolveServiceTemplateData(
  serviceFilename: string,
): Record<string, unknown> {
  const serviceName = serviceFilename
    .replace(".service.unit.test.ts", "")
    .replace(".service.ts", "");
  const nameKebabCase =
    converterByStringCase[StringCase.KEBAB_CASE](serviceName);
  return {
    nameCamelCase: converterByStringCase[StringCase.CAMEL_CASE](nameKebabCase),
    nameKebabCase,
    namePascalCase:
      converterByStringCase[StringCase.PASCAL_CASE](nameKebabCase),
  };
}

function resolveServiceTemplateFilePath(serviceFilePath: string): string {
  if (serviceFilePath.endsWith(".service.unit.test.ts")) {
    return SERVICE_UNIT_TEST_TEMPLATE_FILE_PATH;
  }
  return SERVICE_TEMPLATE_FILE_PATH;
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
    {
      instanceDirectoryPaths: serviceFileModules,
      instanceType: "single",
      template: "nestjs-service-files",
      templateDirectoryPath: SERVICE_FILES_TEMPLATES_DIRECTORY_PATH,
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

  it("validates all NestJS service files and tests with nestjs-service-files templates", () => {
    const nestjsApplications = resolveWorkspaceApplications().filter(
      (application) => application.tags.includes(NESTJS_APPLICATION_TAG),
    );
    const serviceFilePaths = resolveNestjsServiceFilePaths(nestjsApplications);

    expect(serviceFilePaths.length).toBeGreaterThan(0);

    const serviceFileValidationResults: InstanceDirectoryValidationResult[] =
      serviceFilePaths.map((serviceFilePath) => {
        const templateFilePath =
          resolveServiceTemplateFilePath(serviceFilePath);
        const validationResult = validateInstanceFile({
          data: resolveServiceTemplateData(path.basename(serviceFilePath)),
          instanceFilePath: serviceFilePath,
          templateFilePath,
        });
        return {
          directoryName: path.relative(
            workspaceRoot,
            path.dirname(serviceFilePath),
          ),
          results: [
            {
              ...validationResult,
              filename: path.basename(serviceFilePath),
            },
          ],
        };
      });
    const errors = stringifyConformanceErrors(serviceFileValidationResults);
    expect(errors).toBeNull();
  });
});
