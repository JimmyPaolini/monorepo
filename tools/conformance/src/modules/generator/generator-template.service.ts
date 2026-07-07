import { Injectable } from "@nestjs/common";

import {
  generateTemplateScaffold,
  resolveOptionalKebabCaseName,
} from "../../utilities";

import type {
  GeneratorInvocationArguments,
  TemplateScaffoldGenerationResult,
} from "../../utilities";
import type { Tree } from "@nx/devkit";

/**
 * TODO: Document the generatorTemplate service.
 */
@Injectable()
export class GeneratorTemplateService {
  // 🏗 Dependency Injection

  constructor() {}

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  // 🌎 Public Methods

  /**
   * Generates a tree-form scaffold after resolving an optional name.
   */
  static async generateTreeTemplateScaffoldWithOptionalName<
    TOptions extends { name?: string },
  >(args: {
    argumentsOrTree: GeneratorInvocationArguments<TOptions> | Tree;
    nameMessage: string;
    nameSubject: string;
    resolveGenerationWithName: (args: {
      nameKebabCase: string;
      options: Partial<TOptions>;
      tree: Tree;
    }) =>
      | Promise<TemplateScaffoldGenerationResult>
      | TemplateScaffoldGenerationResult;
  }): Promise<void> {
    await generateTemplateScaffold<TOptions>({
      argumentsOrTree: args.argumentsOrTree,
      format: "tree",
      resolveGeneration: async ({ options: resolvedOptions, tree }) => {
        const nameKebabCase = await resolveOptionalKebabCaseName({
          message: args.nameMessage,
          ...(resolvedOptions.name !== undefined && {
            name: resolvedOptions.name,
          }),
          subject: args.nameSubject,
        });

        return args.resolveGenerationWithName({
          nameKebabCase,
          options: resolvedOptions,
          tree,
        });
      },
    });
  }
}
