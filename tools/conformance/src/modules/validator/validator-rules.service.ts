import fs, { globSync } from "node:fs";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import { workspaceRoot } from "@nx/devkit";

import { converterByStringCase } from "../../constants";
import { StringCase } from "../../types";

import { ValidatorFilesService } from "./validator-files.service";
import {
  getValidatorTemplateDirectoryPath,
  JUPYTER_NOTEBOOK_APPLICATION_GENERATOR_TAG,
  NESTJS_APPLICATION_TAG,
  NESTJS_COMMAND_APPLICATION_GENERATOR_TAG,
  NESTJS_COMMAND_APPLICATION_TAG,
  NESTJS_GRAPHQL_APPLICATION_GENERATOR_TAG,
} from "./validator.constants";

import type {
  InstanceDirectoryValidationResult,
  WorkspaceProject,
} from "./validator.types";

/**
 * Validation rule execution service.
 */
@Injectable()
export class ValidatorRulesService {
  constructor(private readonly validatorFilesService: ValidatorFilesService) {}

  /**
   * Resolves project module directories from <projectRoot>/src/modules.
   */
  private resolveProjectModuleDirectoryPaths(
    projectRootPath: string,
  ): string[] {
    const modulesRootPath = path.join(projectRootPath, "src", "modules");
    if (!fs.existsSync(modulesRootPath)) {
      return [];
    }

    return fs
      .readdirSync(modulesRootPath, { withFileTypes: true })
      .filter(
        (directoryEntry) =>
          directoryEntry.isDirectory() && directoryEntry.name !== "logger",
      )
      .map((directoryEntry) => path.join(modulesRootPath, directoryEntry.name));
  }

  /**
   * Runs the Jupyter notebook application rule.
   */
  private runJupyterNotebookApplicationRule(
    workspaceProject: WorkspaceProject,
  ): InstanceDirectoryValidationResult[] | undefined {
    if (
      !workspaceProject.tags.includes(
        JUPYTER_NOTEBOOK_APPLICATION_GENERATOR_TAG,
      )
    ) {
      return undefined;
    }

    const templateDirectoryPath = getValidatorTemplateDirectoryPath(
      "jupyter-notebook-application",
      workspaceRoot,
    );
    const projectName = path.basename(workspaceProject.rootPath);
    const pyprojectPath = path.join(
      workspaceProject.rootPath,
      "pyproject.toml",
    );
    const description = fs.existsSync(pyprojectPath)
      ? (/^description\s*=\s*["'](?<description>.*)["']$/mu.exec(
          fs.readFileSync(pyprojectPath, "utf8"),
        )?.groups?.["description"] ?? "")
      : "";
    const rootResult = this.validatorFilesService.validateInstanceDirectory({
      descriptionOverride: description,
      instanceDirectoryPath: workspaceProject.rootPath,
      nameOverride: projectName,
      templateDirectoryPath,
    });
    const sourceResult = this.validatorFilesService.validateInstanceDirectory({
      descriptionOverride: description,
      instanceDirectoryPath: path.join(workspaceProject.rootPath, "src"),
      nameOverride: projectName,
      templateDirectoryPath: path.join(templateDirectoryPath, "src"),
    });

    return [rootResult, sourceResult];
  }

  /**
   * Runs the NestJS command-application rule.
   */
  private runNestjsCommandApplicationRule(
    workspaceProject: WorkspaceProject,
  ): InstanceDirectoryValidationResult[] | undefined {
    if (
      !workspaceProject.tags.includes(NESTJS_COMMAND_APPLICATION_GENERATOR_TAG)
    ) {
      return undefined;
    }

    return this.validateCommandApplicationDirectories({
      instanceDirectoryPaths: [workspaceProject.rootPath],
      templateDirectoryPath: getValidatorTemplateDirectoryPath(
        "nestjs-command-application",
        workspaceRoot,
      ),
    });
  }

  /**
   * Runs the NestJS command-module rule.
   */
  private runNestjsCommandModuleRule(
    workspaceProject: WorkspaceProject,
  ): InstanceDirectoryValidationResult[] | undefined {
    if (
      !workspaceProject.tags.includes(NESTJS_APPLICATION_TAG) ||
      !workspaceProject.tags.includes(NESTJS_COMMAND_APPLICATION_TAG)
    ) {
      return undefined;
    }

    const moduleDirectoryPaths = this.resolveProjectModuleDirectoryPaths(
      workspaceProject.rootPath,
    ).filter((moduleDirectoryPath) => {
      const moduleName = path.basename(moduleDirectoryPath);
      return fs.existsSync(
        path.join(moduleDirectoryPath, `${moduleName}.command.ts`),
      );
    });

    return moduleDirectoryPaths.map((moduleDirectoryPath) =>
      this.validatorFilesService.validateInstanceDirectory({
        instanceDirectoryPath: moduleDirectoryPath,
        templateDirectoryPath: getValidatorTemplateDirectoryPath(
          "nestjs-command-module",
          workspaceRoot,
        ),
      }),
    );
  }

  /**
   * Runs the NestJS GraphQL-application rule.
   */
  private runNestjsGraphqlApplicationRule(
    workspaceProject: WorkspaceProject,
  ): InstanceDirectoryValidationResult[] | undefined {
    if (
      !workspaceProject.tags.includes(NESTJS_GRAPHQL_APPLICATION_GENERATOR_TAG)
    ) {
      return undefined;
    }

    return [
      this.validatorFilesService.validateInstanceDirectory({
        instanceDirectoryPath: workspaceProject.rootPath,
        templateDirectoryPath: getValidatorTemplateDirectoryPath(
          "nestjs-graphql-application",
          workspaceRoot,
        ),
      }),
    ];
  }

  /**
   * Runs the NestJS GraphQL-module rule.
   */
  private runNestjsGraphqlModuleRule(
    workspaceProject: WorkspaceProject,
  ): InstanceDirectoryValidationResult[] | undefined {
    if (!workspaceProject.tags.includes(NESTJS_APPLICATION_TAG)) {
      return undefined;
    }

    const moduleDirectoryPaths = this.resolveProjectModuleDirectoryPaths(
      workspaceProject.rootPath,
    ).filter((moduleDirectoryPath) => {
      const moduleName = path.basename(moduleDirectoryPath);
      return fs.existsSync(
        path.join(moduleDirectoryPath, `${moduleName}.resolver.ts`),
      );
    });

    return moduleDirectoryPaths.map((moduleDirectoryPath) =>
      this.validatorFilesService.validateInstanceDirectory({
        instanceDirectoryPath: moduleDirectoryPath,
        templateDirectoryPath: getValidatorTemplateDirectoryPath(
          "nestjs-graphql-module",
          workspaceRoot,
        ),
      }),
    );
  }

  /**
   * Runs the NestJS service-file rule.
   */
  private runNestjsServiceFileRule(
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

    const templateDirectoryPath = getValidatorTemplateDirectoryPath(
      "nestjs-service-file",
      workspaceRoot,
    );
    const templateFilenames = fs
      .readdirSync(templateDirectoryPath, { withFileTypes: true })
      .filter((directoryEntry) => directoryEntry.isFile())
      .map((directoryEntry) => directoryEntry.name)
      .toSorted();

    return serviceImplementationFilePaths.map((serviceFilePath) =>
      this.validateServiceFilesForPath({
        serviceFilePath,
        templateDirectoryPath,
        templateFilenames,
      }),
    );
  }

  /**
   * Runs the NestJS service-module rule.
   */
  private runNestjsServiceModuleRule(
    workspaceProject: WorkspaceProject,
  ): InstanceDirectoryValidationResult[] | undefined {
    if (!workspaceProject.tags.includes(NESTJS_APPLICATION_TAG)) {
      return undefined;
    }

    const moduleDirectoryPaths = this.resolveProjectModuleDirectoryPaths(
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
        fs.existsSync(
          path.join(moduleDirectoryPath, `${moduleName}.service.ts`),
        )
      );
    });

    return moduleDirectoryPaths.map((moduleDirectoryPath) =>
      this.validatorFilesService.validateInstanceDirectory({
        instanceDirectoryPath: moduleDirectoryPath,
        templateDirectoryPath: getValidatorTemplateDirectoryPath(
          "nestjs-service-module",
          workspaceRoot,
        ),
      }),
    );
  }

  /**
   * Validates command-application template files.
   */
  private validateCommandApplicationDirectories(args: {
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
          ...this.validatorFilesService.validateInstanceFile({
            data: substitutions,
            instanceFilePath,
            templateFilePath,
          }),
          filename: instanceFilename,
        };
      });

      return { directoryName, results };
    });
  }

  /**
   * Validates one service file pair set for the service-file rule.
   */
  private validateServiceFilesForPath(args: {
    serviceFilePath: string;
    templateDirectoryPath: string;
    templateFilenames: string[];
  }): InstanceDirectoryValidationResult {
    const { serviceFilePath, templateDirectoryPath, templateFilenames } = args;
    const serviceName = path
      .basename(serviceFilePath)
      .replace(".service.ts", "");
    const nameKebabCase =
      converterByStringCase[StringCase.KEBAB_CASE](serviceName);
    const substitutions = {
      nameCamelCase:
        converterByStringCase[StringCase.CAMEL_CASE](nameKebabCase),
      nameKebabCase,
      namePascalCase:
        converterByStringCase[StringCase.PASCAL_CASE](nameKebabCase),
    };

    const results = templateFilenames.map((templateFilename) => {
      const templateFilePath = path.join(
        templateDirectoryPath,
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
      return {
        ...this.validatorFilesService.validateInstanceFile({
          data: substitutions,
          instanceFilePath,
          templateFilePath,
        }),
        filename: instanceFilename,
      };
    });

    return {
      directoryName: path.relative(
        workspaceRoot,
        path.dirname(serviceFilePath),
      ),
      results,
    };
  }

  /**
   * Runs one conformance rule for one workspace project.
   */
  runRule(args: {
    ruleName: string;
    workspaceProject: WorkspaceProject;
  }): InstanceDirectoryValidationResult[] | undefined {
    const { ruleName, workspaceProject } = args;

    switch (ruleName) {
      case "jupyter-notebook-application": {
        return this.runJupyterNotebookApplicationRule(workspaceProject);
      }
      case "nestjs-command-application": {
        return this.runNestjsCommandApplicationRule(workspaceProject);
      }
      case "nestjs-command-module": {
        return this.runNestjsCommandModuleRule(workspaceProject);
      }
      case "nestjs-graphql-application": {
        return this.runNestjsGraphqlApplicationRule(workspaceProject);
      }
      case "nestjs-graphql-module": {
        return this.runNestjsGraphqlModuleRule(workspaceProject);
      }
      case "nestjs-service-file": {
        return this.runNestjsServiceFileRule(workspaceProject);
      }
      case "nestjs-service-module": {
        return this.runNestjsServiceModuleRule(workspaceProject);
      }
      default: {
        return undefined;
      }
    }
  }
}
