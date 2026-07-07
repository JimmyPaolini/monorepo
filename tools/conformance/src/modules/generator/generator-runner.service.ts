import { Injectable } from "@nestjs/common";

import {
  generateTemplateScaffold,
  resolveProjectAndKebabCaseName,
} from "../../utilities";

import type {
  GeneratorInvocationArguments,
  TemplateScaffoldGenerationResult,
} from "../../utilities";
import type { GeneratorCallback, Tree } from "@nx/devkit";

/**
 * TODO: Document the generatorRunner service.
 */
@Injectable()
export class GeneratorRunnerService {
  // 🏗 Dependency Injection

  constructor() {}

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  // 🌎 Public Methods

  /**
   * Generates a callback-form scaffold after resolving project and name.
   */
  static async generateCallbackTemplateScaffoldWithProjectAndName<
    TOptions extends { name?: string; project?: string },
  >(args: {
    argumentsOrTree: GeneratorInvocationArguments<TOptions> | Tree;
    nameMessage: string;
    nameSubject: string;
    projectMessage: string;
    projectTag: string;
    resolveGenerationWithProjectAndName: (args: {
      nameKebabCase: string;
      options: Partial<TOptions>;
      projectName: string;
      tree: Tree;
    }) =>
      | Promise<TemplateScaffoldGenerationResult>
      | TemplateScaffoldGenerationResult;
  }): Promise<GeneratorCallback> {
    return generateTemplateScaffold<TOptions>({
      argumentsOrTree: args.argumentsOrTree,
      format: "callback",
      resolveGeneration: async ({ options: resolvedOptions, tree }) => {
        const { nameKebabCase, projectName } =
          await resolveProjectAndKebabCaseName({
            nameMessage: args.nameMessage,
            nameSubject: args.nameSubject,
            projectMessage: args.projectMessage,
            projectTag: args.projectTag,
            tree,
            ...(resolvedOptions.name !== undefined && {
              name: resolvedOptions.name,
            }),
            ...(resolvedOptions.project !== undefined && {
              optionsProject: resolvedOptions.project,
            }),
          });

        return args.resolveGenerationWithProjectAndName({
          nameKebabCase,
          options: resolvedOptions,
          projectName,
          tree,
        });
      },
    });
  }
}
