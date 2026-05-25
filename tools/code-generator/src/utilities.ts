import fs from "node:fs";
import path from "node:path";

import { getProjects } from "@nx/devkit";
import mustache from "mustache";
import prompts from "prompts";

import { converterByStringCase, humanReadableStringCase } from "./constants";

import type { StringCaseValue } from "./types";
import type { Tree } from "@nx/devkit";
import type { Choice, PromptObject } from "prompts";

/**
 * Returns the names of all workspace projects that have the given tag.
 */
export function getProjectsWithTag(args: {
  tree: Tree;
  tag: string;
}): string[] {
  const { tree, tag } = args;
  const allProjects = getProjects(tree);

  const projectsWithTag = [...allProjects.entries()]
    .filter(([, config]) => config.tags?.includes(tag))
    .map(([projectName]) => projectName);

  return projectsWithTag;
}

/**
 * Prompts the user to select a project from a list and returns the chosen name.
 * Throws if the user cancels without selecting.
 */
async function promptProjectSelection(args: {
  projects: string[];
  message: string;
}): Promise<string> {
  const { projects, message } = args;
  const request: PromptObject<"project"> = {
    type: "select",
    name: "project",
    message,
    choices: projects.map((name): Choice => ({ title: name, value: name })),
  };
  const response: { project: string | undefined } = await prompts(request);
  if (!response.project) {
    throw new Error("No project selected");
  }
  const project = response.project;
  return project;
}

/**
 * Resolves the target project name for a generator.
 *
 * If `project` is already provided it is validated against the set of projects
 * with the given `tag`. If it is omitted the user is prompted to pick one
 * interactively. Throws when no matching projects exist in the workspace.
 */
export async function resolveProject(args: {
  tree: Tree;
  tag: string;
  project?: string;
  message: string;
}): Promise<string> {
  const { tree, tag, project, message } = args;

  const projectsWithTag = getProjectsWithTag({ tree, tag });

  if (projectsWithTag.length === 0) {
    throw new Error(`No projects with tag "${tag}" found in the workspace`);
  }

  const projectName =
    project ??
    (await promptProjectSelection({ projects: projectsWithTag, message }));

  if (!projectsWithTag.includes(projectName)) {
    throw new Error(
      `Project "${projectName}" does not have the "${tag}" tag. Available projects: ${projectsWithTag.join(", ")}`,
    );
  }

  return projectName;
}

/**
 * Prompts the user to enter a name and returns the input.
 * Throws if the user cancels without providing one.
 */
async function promptNameInput(args: { message: string }): Promise<string> {
  const { message } = args;
  const request: PromptObject<"name"> = {
    type: "text",
    name: "name",
    message,
  };
  const response: { name: string | undefined } = await prompts(request);
  if (!response.name) {
    throw new Error("No name provided");
  }
  const name = response.name;
  return name;
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
  name?: string;
  case: StringCaseValue;
  message: string;
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
 * Renders Mustache templates from a directory into the Nx tree.
 *
 * Template filenames may include `__fieldName__` placeholders which are
 * resolved from `substitutions` (for example `__namePascalCase__.tsx`).
 */
export function generateFiles(args: {
  tree: Tree;
  templateDirectoryPath: string;
  instanceDirectoryPath: string;
  substitutions: Record<string, string>;
}): void {
  const {
    tree,
    templateDirectoryPath,
    instanceDirectoryPath: targetDirectoryPath,
    substitutions,
  } = args;
  const templateFilenames = fs
    .readdirSync(templateDirectoryPath, { withFileTypes: true })
    .filter((node) => node.isFile())
    .map((node) => node.name);

  for (const templateFilename of templateFilenames) {
    const templatePath = path.join(templateDirectoryPath, templateFilename);
    const template = fs.readFileSync(templatePath, "utf8");
    const rendered = mustache.render(template, substitutions);
    const generatedFilename = templateFilename.replaceAll(
      /__(\w+)__/g,
      (templateToken: string, field: string) =>
        substitutions[field] ?? templateToken,
    );
    const generatedPath = path.join(targetDirectoryPath, generatedFilename);
    tree.write(generatedPath, rendered);
  }
}
