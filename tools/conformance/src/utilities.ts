import fs from "node:fs";
import path from "node:path";

import { getProjects, workspaceRoot } from "@nx/devkit";
import mustache from "mustache";
import { flushChanges, FsTree } from "nx/src/generators/tree";
import prompts from "prompts";

import { converterByStringCase, humanReadableStringCase } from "./constants";

import type { StringCaseValue } from "./types";
import type { GeneratorCallback, Tree } from "@nx/devkit";
import type { Choice, PromptObject } from "prompts";

/**
 * Writes queued tree changes to disk and executes an optional post-run callback.
 */
export async function commitWorkspaceTree(args: {
  callback?: GeneratorCallback;
  tree: Tree;
}): Promise<void> {
  const { callback, tree } = args;
  flushChanges(workspaceRoot, tree.listChanges());

  if (!callback) {
    return;
  }

  await Promise.resolve(callback());
}

/**
 * Creates a file-system-backed Nx tree rooted at the current workspace.
 */
export function createWorkspaceTree(): Tree {
  return new FsTree(workspaceRoot, false);
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

  const resolveTemplateName = (name: string): string => {
    const resolved = name.replaceAll(
      /__(\w+)__/g,
      (token: string, field: string) => substitutions[field] ?? token,
    );
    return resolved;
  };

  const nodes = fs.readdirSync(templateDirectoryPath, { withFileTypes: true });

  for (const node of nodes) {
    const instanceName = resolveTemplateName(node.name);
    const instancePath = path.join(targetDirectoryPath, instanceName);
    const templatePath = path.join(templateDirectoryPath, node.name);
    processFileNode({ instancePath, node, substitutions, templatePath, tree });
  }
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
