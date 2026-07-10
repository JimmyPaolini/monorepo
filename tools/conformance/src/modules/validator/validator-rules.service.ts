import fs, { globSync } from "node:fs";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import { workspaceRoot } from "@nx/devkit";

import { ValidatorFilesService } from "./validator-files.service";
import {
  converterByStringCase,
  getValidatorTemplateDirectoryPath,
  JUPYTER_NOTEBOOK_APPLICATION_GENERATOR_TAG,
  NESTJS_APPLICATION_TAG,
  NESTJS_COMMAND_APPLICATION_GENERATOR_TAG,
  NESTJS_COMMAND_APPLICATION_TAG,
  NESTJS_GRAPHQL_APPLICATION_GENERATOR_TAG,
  REACT_PROJECT_TAG,
  StringCase,
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

  /** Resolves module directory paths for a project. */
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

  /** Runs validation for Jupyter notebook application projects. */
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

  /** Runs validation for NestJS command-application projects. */
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

  /** Runs validation for NestJS command-module instances. */
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

  /** Runs validation for NestJS dataloader-module instances. */
  private runNestjsDataloaderModuleRule(
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
        path.join(moduleDirectoryPath, `${moduleName}.dataloader.ts`),
      );
    });

    return moduleDirectoryPaths.map((moduleDirectoryPath) =>
      this.validatorFilesService.validateInstanceDirectory({
        instanceDirectoryPath: moduleDirectoryPath,
        templateDirectoryPath: getValidatorTemplateDirectoryPath(
          "nestjs-dataloader-module",
          workspaceRoot,
        ),
      }),
    );
  }

  /** Runs validation for NestJS GraphQL-application projects. */
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

  /** Runs validation for NestJS GraphQL-module instances. */
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

  /** Runs validation for NestJS service-file instances. */
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

  /** Runs validation for NestJS service-module instances. */
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

  /** Runs validation for React component instances. */
  private runReactComponentRule(
    workspaceProject: WorkspaceProject,
  ): InstanceDirectoryValidationResult[] | undefined {
    if (!workspaceProject.tags.includes(REACT_PROJECT_TAG)) {
      return undefined;
    }

    const componentFilePaths = globSync(
      path.join(workspaceProject.rootPath, "src/components/*.tsx"),
    ).filter((componentFilePath) => !componentFilePath.endsWith(".test.tsx"));
    if (componentFilePaths.length === 0) {
      return [];
    }

    const templateDirectoryPath = getValidatorTemplateDirectoryPath(
      "react-component",
      workspaceRoot,
    );
    const templateFilenames = fs
      .readdirSync(templateDirectoryPath, { withFileTypes: true })
      .filter((directoryEntry) => directoryEntry.isFile())
      .map((directoryEntry) => directoryEntry.name)
      .toSorted();

    return componentFilePaths.map((componentFilePath) => {
      const componentName = path.basename(componentFilePath, ".tsx");
      const results = templateFilenames.map((templateFilename) => {
        const instanceFilename = templateFilename.replaceAll(
          "__namePascalCase__",
          componentName,
        );
        const instanceFilePath = path.join(
          path.dirname(componentFilePath),
          instanceFilename,
        );
        const templateFilePath = path.join(
          templateDirectoryPath,
          templateFilename,
        );

        return {
          ...this.validatorFilesService.validateInstanceFile({
            data: {
              nameCamelCase:
                converterByStringCase[StringCase.CAMEL_CASE](componentName),
              nameKebabCase:
                converterByStringCase[StringCase.KEBAB_CASE](componentName),
              namePascalCase: componentName,
              nameSnakeCase:
                converterByStringCase[StringCase.SNAKE_CASE](componentName),
            },
            instanceFilePath,
            templateFilePath,
          }),
          filename: instanceFilename,
        };
      });

      return {
        directoryName: path.relative(
          workspaceRoot,
          path.dirname(componentFilePath),
        ),
        results,
      };
    });
  }

  /** Validates command-application template files in instance directories. */
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

  /** Validates service-file template pairs for a discovered service file. */
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

  /** Runs a single validator rule against a workspace project. */
  runRule(args: {
    ruleName: string;
    workspaceProject: WorkspaceProject;
  }): InstanceDirectoryValidationResult[] | undefined {
    const { ruleName, workspaceProject } = args;

    const ruleByName: Record<
      string,
      (
        project: WorkspaceProject,
      ) => InstanceDirectoryValidationResult[] | undefined
    > = {
      "jupyter-notebook-application": (project) =>
        this.runJupyterNotebookApplicationRule(project),
      "nestjs-command-application": (project) =>
        this.runNestjsCommandApplicationRule(project),
      "nestjs-command-module": (project) =>
        this.runNestjsCommandModuleRule(project),
      "nestjs-dataloader-module": (project) =>
        this.runNestjsDataloaderModuleRule(project),
      "nestjs-graphql-application": (project) =>
        this.runNestjsGraphqlApplicationRule(project),
      "nestjs-graphql-module": (project) =>
        this.runNestjsGraphqlModuleRule(project),
      "nestjs-service-file": (project) =>
        this.runNestjsServiceFileRule(project),
      "nestjs-service-module": (project) =>
        this.runNestjsServiceModuleRule(project),
      "react-component": (project) => this.runReactComponentRule(project),
    };
    const runRule = ruleByName[ruleName];

    if (runRule === undefined) {
      return undefined;
    }

    return runRule(workspaceProject);
  }
}
