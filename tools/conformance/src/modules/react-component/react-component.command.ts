import path from "node:path";

import { Injectable } from "@nestjs/common";
import { formatFiles, getProjects } from "@nx/devkit";
import _ from "lodash";
import { Command, CommandRunner, Option } from "nest-commander";

import { StringCase } from "../../types";
import {
  commitWorkspaceTree,
  createWorkspaceTree,
  generateFiles,
  resolveName,
  resolveProject,
} from "../../utilities";
import { LoggerService } from "../logger/logger.service";

import {
  REACT_COMPONENT_NAME_PROMPT,
  REACT_COMPONENT_PROJECT_PROMPT,
  REACT_COMPONENT_PROJECT_TAG,
} from "./react-component.constants";

import type {
  ReactComponentArguments,
  ReactComponentOptions,
} from "./react-component.types";
import type { Tree } from "@nx/devkit";

/**
 * Generates a React component scaffold from templates.
 */
@Command({
  description: "Generate a React component scaffold",
  name: "react-component",
})
@Injectable()
export class ReactComponentCommand extends CommandRunner {
  // 🏗 Dependency Injection

  constructor(private readonly logger: LoggerService) {
    super();
    (this.logger as LoggerService | undefined)?.setContext(
      ReactComponentCommand.name,
    );
  }

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  // 🌎 Public Methods

  /**
   * Parses the optional component name argument.
   */
  @Option({
    description: "Component name in kebab-case",
    flags: "-n, --name [name]",
  })
  parseNameOption(value: string): string {
    return value;
  }

  /**
   * Parses the optional project name argument.
   */
  @Option({
    description: "Parent project name in kebab-case",
    flags: "-p, --project [project]",
  })
  parseProjectOption(value: string): string {
    return value;
  }

  /**
   * Runs generator logic using CLI options and writes generated files to disk.
   */
  async run(
    _passedParameters: string[],
    options: ReactComponentOptions,
  ): Promise<void> {
    const tree = createWorkspaceTree();
    await generateReactComponent({
      options,
      tree,
    });
    await commitWorkspaceTree({ tree });
    this.logger.log("Generated React component scaffold.");
  }
}

/**
 * Migrated core generator logic for creating a React component.
 */
export async function generateReactComponent(
  args: ReactComponentArguments,
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
    "tools/conformance/src/modules/react-component/templates",
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
