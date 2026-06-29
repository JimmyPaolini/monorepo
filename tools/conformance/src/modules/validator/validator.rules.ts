import fs, { globSync } from "node:fs";
import path from "node:path";

import { workspaceRoot } from "@nx/devkit";

import { converterByStringCase } from "../../constants";
import { StringCase } from "../../types";
import {
  validateInstanceDirectory,
  validateInstanceFile,
} from "../../validators/typescript/files";

import {
  NESTJS_APPLICATION_TAG,
  NESTJS_COMMAND_APPLICATION_GENERATOR_TAG,
  NESTJS_COMMAND_APPLICATION_TAG,
  NESTJS_GRAPHQL_APPLICATION_GENERATOR_TAG,
  VALIDATOR_RULE_TEMPLATE_DIRECTORY,
} from "./validator.constants";

import type { InstanceDirectoryValidationResult } from "../../validators/typescript/types";
import type { ValidatorRuleName } from "./validator.types";
import type { WorkspaceProject } from "./validator.workspace";

/** Runs a single rule and returns grouped conformance results when applicable. */
export function runRule(args: {
  ruleName: ValidatorRuleName;
  workspaceProject: WorkspaceProject;
}): InstanceDirectoryValidationResult[] | undefined {
  const { ruleName, workspaceProject } = args;

  switch (ruleName) {
    case "nestjs-command-application": {
      return runNestjsCommandApplicationRule(workspaceProject);
    }
    case "nestjs-command-module": {
      return runNestjsCommandModuleRule(workspaceProject);
    }
    case "nestjs-graphql-application": {
      return runNestjsGraphqlApplicationRule(workspaceProject);
    }
    case "nestjs-graphql-module": {
      return runNestjsGraphqlModuleRule(workspaceProject);
    }
    case "nestjs-service-file": {
      return runNestjsServiceFileRule(workspaceProject);
    }
    case "nestjs-service-module": {
      return runNestjsServiceModuleRule(workspaceProject);
    }
    default: {
      return undefined;
    }
  }
}

/** Resolves first-level module directories from <projectRoot>/src/modules. */
function resolveProjectModuleDirectoryPaths(projectRootPath: string): string[] {
  const modulesRootPath = path.join(projectRootPath, "src", "modules");
  if (!fs.existsSync(modulesRootPath)) {
    return [];
  }

  const projectDirectoryName = path.basename(projectRootPath);
  return fs
    .readdirSync(modulesRootPath, { withFileTypes: true })
    .filter(
      (directoryEntry) =>
        directoryEntry.isDirectory() &&
        directoryEntry.name !== "logger" &&
        directoryEntry.name !== projectDirectoryName,
    )
    .map((directoryEntry) => path.join(modulesRootPath, directoryEntry.name));
}

/** Validates command application scaffold files for command-app generated projects. */
function runNestjsCommandApplicationRule(
  workspaceProject: WorkspaceProject,
): InstanceDirectoryValidationResult[] | undefined {
  if (
    !workspaceProject.tags.includes(NESTJS_COMMAND_APPLICATION_GENERATOR_TAG)
  ) {
    return undefined;
  }

  return validateCommandApplicationDirectories({
    instanceDirectoryPaths: [workspaceProject.rootPath],
    templateDirectoryPath:
      VALIDATOR_RULE_TEMPLATE_DIRECTORY["nestjs-command-application"],
  });
}

/** Validates command modules under src/modules for command applications. */
function runNestjsCommandModuleRule(
  workspaceProject: WorkspaceProject,
): InstanceDirectoryValidationResult[] | undefined {
  if (
    !workspaceProject.tags.includes(NESTJS_APPLICATION_TAG) ||
    !workspaceProject.tags.includes(NESTJS_COMMAND_APPLICATION_TAG)
  ) {
    return undefined;
  }

  const moduleDirectoryPaths = resolveProjectModuleDirectoryPaths(
    workspaceProject.rootPath,
  ).filter((moduleDirectoryPath) => {
    const moduleName = path.basename(moduleDirectoryPath);
    return fs.existsSync(
      path.join(moduleDirectoryPath, `${moduleName}.command.ts`),
    );
  });

  return moduleDirectoryPaths.map((moduleDirectoryPath) =>
    validateInstanceDirectory({
      instanceDirectoryPath: moduleDirectoryPath,
      templateDirectoryPath:
        VALIDATOR_RULE_TEMPLATE_DIRECTORY["nestjs-command-module"],
    }),
  );
}

/** Validates GraphQL application scaffold files for graphql-app generated projects. */
function runNestjsGraphqlApplicationRule(
  workspaceProject: WorkspaceProject,
): InstanceDirectoryValidationResult[] | undefined {
  if (
    !workspaceProject.tags.includes(NESTJS_GRAPHQL_APPLICATION_GENERATOR_TAG)
  ) {
    return undefined;
  }

  return [
    validateInstanceDirectory({
      instanceDirectoryPath: workspaceProject.rootPath,
      templateDirectoryPath:
        VALIDATOR_RULE_TEMPLATE_DIRECTORY["nestjs-graphql-application"],
    }),
  ];
}

/** Validates GraphQL modules under src/modules for NestJS projects. */
function runNestjsGraphqlModuleRule(
  workspaceProject: WorkspaceProject,
): InstanceDirectoryValidationResult[] | undefined {
  if (!workspaceProject.tags.includes(NESTJS_APPLICATION_TAG)) {
    return undefined;
  }

  const moduleDirectoryPaths = resolveProjectModuleDirectoryPaths(
    workspaceProject.rootPath,
  ).filter((moduleDirectoryPath) => {
    const moduleName = path.basename(moduleDirectoryPath);
    return fs.existsSync(
      path.join(moduleDirectoryPath, `${moduleName}.resolver.ts`),
    );
  });

  return moduleDirectoryPaths.map((moduleDirectoryPath) =>
    validateInstanceDirectory({
      instanceDirectoryPath: moduleDirectoryPath,
      templateDirectoryPath:
        VALIDATOR_RULE_TEMPLATE_DIRECTORY["nestjs-graphql-module"],
    }),
  );
}

/** Validates paired service and unit test files for NestJS projects. */
function runNestjsServiceFileRule(
  workspaceProject: WorkspaceProject,
): InstanceDirectoryValidationResult[] | undefined {
  if (!workspaceProject.tags.includes(NESTJS_APPLICATION_TAG)) {
    return undefined;
  }

  const serviceImplementationFilePaths = globSync(
    path.join(workspaceProject.rootPath, "src/modules/*/*.service.ts"),
  );
  if (serviceImplementationFilePaths.length === 0) {
    return [];
  }

  const templateDirectoryPath =
    VALIDATOR_RULE_TEMPLATE_DIRECTORY["nestjs-service-file"];
  const templateFilenames = fs
    .readdirSync(templateDirectoryPath, { withFileTypes: true })
    .filter((directoryEntry) => directoryEntry.isFile())
    .map((directoryEntry) => directoryEntry.name)
    .toSorted();

  return serviceImplementationFilePaths.map((serviceFilePath) =>
    validateServiceFilesForPath({
      serviceFilePath,
      templateDirectoryPath,
      templateFilenames,
    }),
  );
}

/** Validates service modules under src/modules for NestJS projects. */
function runNestjsServiceModuleRule(
  workspaceProject: WorkspaceProject,
): InstanceDirectoryValidationResult[] | undefined {
  if (!workspaceProject.tags.includes(NESTJS_APPLICATION_TAG)) {
    return undefined;
  }

  const moduleDirectoryPaths = resolveProjectModuleDirectoryPaths(
    workspaceProject.rootPath,
  ).filter((moduleDirectoryPath) => {
    const moduleName = path.basename(moduleDirectoryPath);
    return (
      !fs.existsSync(
        path.join(moduleDirectoryPath, `${moduleName}.command.ts`),
      ) &&
      !fs.existsSync(
        path.join(moduleDirectoryPath, `${moduleName}.resolver.ts`),
      ) &&
      fs.existsSync(
        path.join(moduleDirectoryPath, `${moduleName}.module.ts`),
      ) &&
      fs.existsSync(path.join(moduleDirectoryPath, `${moduleName}.service.ts`))
    );
  });

  return moduleDirectoryPaths.map((moduleDirectoryPath) =>
    validateInstanceDirectory({
      instanceDirectoryPath: moduleDirectoryPath,
      templateDirectoryPath:
        VALIDATOR_RULE_TEMPLATE_DIRECTORY["nestjs-service-module"],
    }),
  );
}

/** Validates command application files requiring destination root substitutions. */
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
    const destinationRoot = relativeInstanceDirectoryPath.split(path.sep)[0];
    const nameKebabCase =
      converterByStringCase[StringCase.KEBAB_CASE](directoryName);
    const substitutions = {
      destinationRoot:
        destinationRoot === undefined ? "applications" : destinationRoot,
      nameCamelCase:
        converterByStringCase[StringCase.CAMEL_CASE](nameKebabCase),
      nameKebabCase,
      namePascalCase:
        converterByStringCase[StringCase.PASCAL_CASE](nameKebabCase),
      nameSnakeCase:
        converterByStringCase[StringCase.SNAKE_CASE](nameKebabCase),
    };

    const results = templateFilenames.map((templateFilename) => {
      const instanceFilename = templateFilename.replaceAll(
        "__nameKebabCase__",
        nameKebabCase,
      );
      const instanceFilePath = path.join(
        instanceDirectoryPath,
        instanceFilename,
      );
      const templateFilePath = path.join(
        templateDirectoryPath,
        templateFilename,
      );
      return {
        ...validateInstanceFile({
          data: substitutions,
          instanceFilePath,
          templateFilePath,
        }),
        filename: instanceFilename,
      };
    });

    return {
      directoryName,
      results,
    };
  });
}

/** Validates service file template set for a single service implementation path. */
function validateServiceFilesForPath(args: {
  serviceFilePath: string;
  templateDirectoryPath: string;
  templateFilenames: string[];
}): InstanceDirectoryValidationResult {
  const { serviceFilePath, templateDirectoryPath, templateFilenames } = args;
  const serviceName = path.basename(serviceFilePath).replace(".service.ts", "");
  const nameKebabCase =
    converterByStringCase[StringCase.KEBAB_CASE](serviceName);
  const substitutions = {
    nameCamelCase: converterByStringCase[StringCase.CAMEL_CASE](nameKebabCase),
    nameKebabCase,
    namePascalCase:
      converterByStringCase[StringCase.PASCAL_CASE](nameKebabCase),
  };

  const results = templateFilenames.map((templateFilename) => {
    const templateFilePath = path.join(templateDirectoryPath, templateFilename);
    const instanceFilename = templateFilename.replaceAll(
      "__nameKebabCase__",
      nameKebabCase,
    );
    const instanceFilePath = path.join(
      path.dirname(serviceFilePath),
      instanceFilename,
    );
    return {
      ...validateInstanceFile({
        data: substitutions,
        instanceFilePath,
        templateFilePath,
      }),
      filename: instanceFilename,
    };
  });

  return {
    directoryName: path.relative(workspaceRoot, path.dirname(serviceFilePath)),
    results,
  };
}
