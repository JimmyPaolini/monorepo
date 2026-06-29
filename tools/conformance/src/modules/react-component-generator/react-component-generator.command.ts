import path from "node:path";

import { Injectable } from "@nestjs/common";
import { formatFiles, getProjects } from "@nx/devkit";
import _ from "lodash";
import { Command, CommandRunner } from "nest-commander";

import { StringCase } from "../../types";
import { generateFiles, resolveName, resolveProject } from "../../utilities";
import { LoggerService } from "../logger/logger.service";

import {
  REACT_COMPONENT_NAME_PROMPT,
  REACT_COMPONENT_PROJECT_PROMPT,
  REACT_COMPONENT_PROJECT_TAG,
} from "./react-component-generator.constants";

import type { ReactComponentGeneratorArguments } from "./react-component-generator.types";
import type { Tree } from "@nx/devkit";

/**
 * TODO: Document the reactComponentGenerator command.
 */
@Command({
  description: "Run the react-component-generator command",
  name: "react-component-generator",
})
@Injectable()
export class ReactComponentGeneratorCommand extends CommandRunner {
  // 🏗 Dependency Injection

  constructor(private readonly logger: LoggerService) {
    super();
    this.logger.setContext(ReactComponentGeneratorCommand.name);
  }

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  // 🌎 Public Methods

  /**
   * Auto-generated documentation placeholder.
   */
  async run(): Promise<void> {
    const generatorName = generateReactComponentGenerator.name;
    this.logger.log(
      `Generator command module scaffolded and ready for wiring (${generatorName}).`,
    );
    await Promise.resolve();
  }
}

/**
 * Migrated core generator logic for creating a React component.
 */
export async function generateReactComponentGenerator(
  args: ReactComponentGeneratorArguments,
): Promise<void> {
  const { options, tree } = args;
  const projectName = await resolveProject({
    tag: REACT_COMPONENT_PROJECT_TAG,
    tree,
    ...(options.project !== undefined && { project: options.project }),
    message: REACT_COMPONENT_PROJECT_PROMPT,
  });

  const name = await resolveName({
    case: StringCase.KEBAB_CASE,
    message: REACT_COMPONENT_NAME_PROMPT,
    name: options.name,
    subject: "Component name",
  });

  const componentsDirectory = resolveComponentsDirectory(tree, projectName);
  const templateDirectoryPath = path.join(
    process.cwd(),
    "tools/conformance/src/generators/react-component/templates",
  );
  const substitutions = { namePascalCase: _.upperFirst(_.camelCase(name)) };

  generateFiles({
    instanceDirectoryPath: componentsDirectory,
    substitutions,
    templateDirectoryPath,
    tree,
  });

  await formatFiles(tree);
}

/**
 * Auto-generated documentation placeholder.
 */
function resolveComponentsDirectory(tree: Tree, projectName: string): string {
  const allProjects = getProjects(tree);
  const projectConfig = allProjects.get(projectName);
  const projectRoot = projectConfig?.root ?? projectConfig?.sourceRoot;

  if (!projectRoot) {
    throw new Error(
      `Project "${projectName}" has no root directory configured`,
    );
  }

  const componentsDirectory = path.join(projectRoot, "src", "components");

  if (!tree.exists(componentsDirectory)) {
    throw new Error(
      `Directory "${componentsDirectory}" does not exist in project "${projectName}"`,
    );
  }

  return componentsDirectory;
}
