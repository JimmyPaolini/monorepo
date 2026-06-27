import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { getProjects, workspaceRoot } from "@nx/devkit";
import _ from "lodash";
import mustache from "mustache";
import prompts from "prompts";

import {
  converterByStringCase,
  humanReadableStringCase,
  MODULES_DIRECTORY,
} from "./constants";
import { StringCase } from "./types";

import type { StringCaseValue } from "./types";
import type { GeneratorCallback, Tree } from "@nx/devkit";
import type { Choice, PromptObject } from "prompts";

/**
 * Builds standard generator substitutions from a kebab-case name.
 */
export function buildKebabCaseNameSubstitutions(
  nameKebabCase: string,
): Record<string, string> {
  return {
    nameCamelCase: _.camelCase(nameKebabCase),
    nameKebabCase,
    namePascalCase: _.upperFirst(_.camelCase(nameKebabCase)),
  };
}

/**
 * Builds a callback that formats all files generated in a target directory.
 */
export function createFormatFilesCallback(args: {
  targetPath: string;
  tree: Tree;
}): GeneratorCallback {
  const { targetPath, tree } = args;
  const generatedFiles = tree
    .children(targetPath)
    .map((filename) => path.join(targetPath, filename));

  return () => {
    if (generatedFiles.length === 0) {
      return;
    }

    execSync(`pnpm exec nx format:write --files=${generatedFiles.join(",")}`, {
      cwd: workspaceRoot,
      stdio: "inherit",
    });
  };
}

/**
 * Renders Mustache templates from a directory into the Nx tree.
 *
 * Template filenames may include `__fieldName__` placeholders which are
 * resolved from `substitutions` (for example `__namePascalCase__.tsx`).
 */
export function generateFiles(args: {
  instanceDirectoryPath: string;
  substitutions: Record<string, string>;
  templateDirectoryPath: string;
  tree: Tree;
}): void {
  const {
    instanceDirectoryPath: targetDirectoryPath,
    substitutions,
    templateDirectoryPath,
    tree,
  } = args;

  const resolveTemplateName = (name: string): string =>
    name.replaceAll(
      /__(\w+)__/g,
      (token: string, field: string) => substitutions[field] ?? token,
    );

  const nodes = fs.readdirSync(templateDirectoryPath, { withFileTypes: true });

  for (const node of nodes) {
    const instanceName = resolveTemplateName(node.name);
    const instancePath = path.join(targetDirectoryPath, instanceName);
    const templatePath = path.join(templateDirectoryPath, node.name);
    processFileNode({ instancePath, node, substitutions, templatePath, tree });
  }
}

/**
 * Generates a NestJS module from templates and schedules formatting.
 */
export async function generateNestjsModuleFromTemplates(args: {
  name: string;
  project?: string;
  templateDirectoryPath: string;
  tree: Tree;
}): Promise<GeneratorCallback> {
  const { name, project, templateDirectoryPath, tree } = args;
  const { substitutions, targetPath } =
    await resolveNestjsModuleGenerationContext({
      name,
      ...(project !== undefined && { project }),
      tree,
    });

  generateFiles({
    instanceDirectoryPath: targetPath,
    substitutions,
    templateDirectoryPath,
    tree,
  });

  return createFormatFilesCallback({ targetPath, tree });
}

/**
 * Returns the names of all workspace projects that have the given tag.
 */
export function getProjectsWithTag(args: {
  tag: string;
  tree: Tree;
}): string[] {
  const { tag, tree } = args;
  const allProjects = getProjects(tree);

  const projectsWithTag = [...allProjects.entries()]
    .filter(([, config]) => config.tags?.includes(tag))
    .map(([projectName]) => projectName);

  return projectsWithTag;
}

/**
 * Resolves the module/resource name for a generator.
 *
 * If `name` is already provided it is validated against the expected `case`.
 * If it is omitted the user is prompted to enter one interactively, and the
 * response is validated before returning. Throws when the name does not match
 * the required casing.
 */
export async function resolveName(args: {
  case: StringCaseValue;
  message: string;
  name?: string;
  subject?: string;
}): Promise<string> {
  const { message, subject = "Name" } = args;

  const name = args.name ?? (await promptNameInput({ message }));

  const convert = converterByStringCase[args.case];
  const expected = convert(name);
  if (name !== expected) {
    throw new Error(
      `${subject} "${name}" must be in ${humanReadableStringCase[args.case]}. Did you mean "${expected}"?`,
    );
  }

  return name;
}

/**
 * Resolves common generation context for NestJS module generators.
 */
export async function resolveNestjsModuleGenerationContext(args: {
  name: string;
  project?: string;
  tree: Tree;
}): Promise<{
  nameKebabCase: string;
  projectName: string;
  substitutions: Record<string, string>;
  targetPath: string;
}> {
  const { name, project, tree } = args;
  const projectName = await resolveProject({
    tag: "framework:nestjs",
    tree,
    ...(project !== undefined && { project }),
    message: "Which project should the module be generated in?",
  });
  const nameKebabCase = await resolveName({
    case: StringCase.KEBAB_CASE,
    message: "What is the name of the module? (kebab-case)",
    name,
    subject: "Module name",
  });
  const modulesDirectory = resolveProjectDirectoryPath({
    directoryPath: MODULES_DIRECTORY,
    projectName,
    tree,
  });

  return {
    nameKebabCase,
    projectName,
    substitutions: buildKebabCaseNameSubstitutions(nameKebabCase),
    targetPath: path.join(modulesDirectory, nameKebabCase),
  };
}

/**
 * Resolves the target project name for a generator.
 *
 * If `project` is already provided it is validated against the set of projects
 * with the given `tag`. If it is omitted the user is prompted to pick one
 * interactively. Throws when no matching projects exist in the workspace.
 */
export async function resolveProject(args: {
  message: string;
  project?: string;
  tag: string;
  tree: Tree;
}): Promise<string> {
  const { message, project, tag, tree } = args;

  const projectsWithTag = getProjectsWithTag({ tag, tree });

  if (projectsWithTag.length === 0) {
    throw new Error(`No projects with tag "${tag}" found in the workspace`);
  }

  const projectName =
    project ??
    (await promptProjectSelection({ message, projects: projectsWithTag }));

  if (!projectsWithTag.includes(projectName)) {
    throw new Error(
      `Project "${projectName}" does not have the "${tag}" tag. Available projects: ${projectsWithTag.join(", ")}`,
    );
  }

  return projectName;
}

/**
 * Resolves and validates a project directory relative to its configured root.
 */
export function resolveProjectDirectoryPath(args: {
  directoryPath: string;
  projectName: string;
  tree: Tree;
}): string {
  const { directoryPath, projectName, tree } = args;
  const allProjects = getProjects(tree);
  const projectConfig = allProjects.get(projectName);
  const projectRoot = projectConfig?.root ?? projectConfig?.sourceRoot;

  if (!projectRoot) {
    throw new Error(
      `Project "${projectName}" has no root directory configured`,
    );
  }

  const resolvedDirectoryPath = path.join(projectRoot, directoryPath);

  if (!tree.exists(resolvedDirectoryPath)) {
    throw new Error(
      `Directory "${resolvedDirectoryPath}" does not exist in project "${projectName}"`,
    );
  }

  return resolvedDirectoryPath;
}

/**
 * Process file node.
 */
function processFileNode(args: {
  instancePath: string;
  node: fs.Dirent;
  substitutions: Record<string, string>;
  templatePath: string;
  tree: Tree;
}): void {
  const { instancePath, node, substitutions, templatePath, tree } = args;
  if (node.isDirectory()) {
    generateFiles({
      instanceDirectoryPath: instancePath,
      substitutions,
      templateDirectoryPath: templatePath,
      tree,
    });
  } else {
    const template = fs.readFileSync(templatePath, "utf8");
    const instance = mustache.render(template, substitutions);
    tree.write(instancePath, instance);
  }
}

/**
 * Prompts the user to enter a name and returns the input.
 * Throws if the user cancels without providing one.
 */
async function promptNameInput(args: { message: string }): Promise<string> {
  const { message } = args;
  const request: PromptObject<"name"> = {
    message,
    name: "name",
    type: "text",
  };
  const response: { name: string | undefined } = await prompts(request);
  if (!response.name) {
    throw new Error("No name provided");
  }
  const name = response.name;
  return name;
}

/**
 * Prompts the user to select a project from a list and returns the chosen name.
 * Throws if the user cancels without selecting.
 */
async function promptProjectSelection(args: {
  message: string;
  projects: string[];
}): Promise<string> {
  const { message, projects } = args;
  const request: PromptObject<"project"> = {
    choices: projects.map((name): Choice => ({ title: name, value: name })),
    message,
    name: "project",
    type: "select",
  };
  const response: { project: string | undefined } = await prompts(request);
  if (!response.project) {
    throw new Error("No project selected");
  }
  const project = response.project;
  return project;
}
