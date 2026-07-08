import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { formatFiles, getProjects, workspaceRoot } from "@nx/devkit";
import _ from "lodash";
import mustache from "mustache";
import { flushChanges, FsTree } from "nx/src/generators/tree";
import prompts from "prompts";

import { converterByStringCase, humanReadableStringCase } from "./constants";
import { StringCase } from "./types";

import type { StringCaseValue } from "./types";
import type { GeneratorCallback, Tree } from "@nx/devkit";
import type { Choice, PromptObject } from "prompts";

/**
 * Normalized invocation arguments shared by generator factories and command runners.
 */
export interface GeneratorInvocationArguments<TOptions extends object> {
  options: Partial<TOptions>;
  tree: Tree;
}

/** Shared project and name resolution result. */
export interface ResolvedProjectAndName {
  nameKebabCase: string;
  projectName: string;
}

/** Shared scaffold format mode. */
export type TemplateScaffoldFormatMode = "callback" | "tree";

/** Result returned by a template scaffold generator before formatting. */
export interface TemplateScaffoldGenerationResult {
  instanceDirectoryPath: string;
  substitutions: Record<string, string>;
  templateDirectoryPath: string;
}

/** Builds standard generator substitutions from a kebab-case name. */
export function buildKebabCaseNameSubstitutions(
  nameKebabCase: string,
): Record<string, string> {
  return {
    nameCamelCase: _.camelCase(nameKebabCase),
    nameKebabCase,
    namePascalCase: _.upperFirst(_.camelCase(nameKebabCase)),
  };
}

/** Writes queued tree changes to disk and executes an optional post-run callback. */
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

/** Builds a callback that formats all files generated in a target directory. */
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
 * Normalizes a generator invocation, renders templates, and returns the
 * requested formatting strategy.
 */
export async function generateTemplateScaffold<TOptions extends object>(args: {
  argumentsOrTree: GeneratorInvocationArguments<TOptions> | Tree;
  format: "callback";
  resolveGeneration: (args: {
    options: Partial<TOptions>;
    tree: Tree;
  }) => Promise<TemplateScaffoldGenerationResult>;
}): Promise<GeneratorCallback>;
/**
 * Normalizes a generator invocation, renders templates, and formats the tree.
 */
export async function generateTemplateScaffold<TOptions extends object>(args: {
  argumentsOrTree: GeneratorInvocationArguments<TOptions> | Tree;
  format: "tree";
  resolveGeneration: (args: {
    options: Partial<TOptions>;
    tree: Tree;
  }) => Promise<TemplateScaffoldGenerationResult>;
}): Promise<undefined>;
/**
 * Normalizes a generator invocation, renders templates, and formats output.
 */
export async function generateTemplateScaffold<TOptions extends object>(args: {
  argumentsOrTree: GeneratorInvocationArguments<TOptions> | Tree;
  format: TemplateScaffoldFormatMode;
  resolveGeneration: (args: {
    options: Partial<TOptions>;
    tree: Tree;
  }) => Promise<TemplateScaffoldGenerationResult>;
}): Promise<GeneratorCallback | undefined> {
  const resolvedArguments = isGeneratorInvocationArguments<TOptions>(
    args.argumentsOrTree,
  )
    ? normalizeGeneratorInvocationFromArguments<TOptions>(args.argumentsOrTree)
    : normalizeGeneratorInvocationFromTree<TOptions>({
        tree: args.argumentsOrTree,
      });

  const { options, tree } = resolvedArguments;
  const generation = await args.resolveGeneration({ options, tree });

  generateFiles({
    instanceDirectoryPath: generation.instanceDirectoryPath,
    substitutions: generation.substitutions,
    templateDirectoryPath: generation.templateDirectoryPath,
    tree,
  });

  if (args.format === "callback") {
    return createFormatFilesCallback({
      targetPath: generation.instanceDirectoryPath,
      tree,
    });
  }

  await formatFiles(tree);
  return undefined;
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
 * Returns whether a value is a generator invocation arguments object.
 */
export function isGeneratorInvocationArguments<TOptions extends object>(
  value: unknown,
): value is GeneratorInvocationArguments<TOptions> {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return "options" in value && "tree" in value;
}

/**
 * Normalizes invocation arguments from command-runner style calls.
 */
export function normalizeGeneratorInvocationFromArguments<
  TOptions extends object,
>(
  args: GeneratorInvocationArguments<TOptions>,
): GeneratorInvocationArguments<TOptions> {
  return args;
}

/**
 * Normalizes invocation arguments from Nx factory style calls.
 */
export function normalizeGeneratorInvocationFromTree<
  TOptions extends object,
>(args: {
  options?: Partial<TOptions>;
  tree: Tree;
}): GeneratorInvocationArguments<TOptions> {
  return {
    options: args.options ?? {},
    tree: args.tree,
  };
}

/**
 * Returns an unchanged option string for nest-commander option parsers.
 */
export function parseStringCommandOption(value: string): string {
  return value;
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
 * Resolves a kebab-case name, using the provided value or prompting as needed.
 */
export async function resolveOptionalKebabCaseName(args: {
  message: string;
  name?: string;
  subject: string;
}): Promise<string> {
  return resolveName({
    case: StringCase.KEBAB_CASE,
    message: args.message,
    ...(args.name !== undefined && { name: args.name }),
    subject: args.subject,
  });
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
 * Resolves a tagged project and kebab-case name for generator commands.
 */
export async function resolveProjectAndKebabCaseName(args: {
  name?: string;
  nameMessage: string;
  nameSubject: string;
  optionsProject?: string;
  projectMessage: string;
  projectTag: string;
  tree: Tree;
}): Promise<ResolvedProjectAndName> {
  const projectName = await resolveProject({
    message: args.projectMessage,
    ...(args.optionsProject !== undefined && { project: args.optionsProject }),
    tag: args.projectTag,
    tree: args.tree,
  });
  const nameKebabCase = await resolveName({
    case: StringCase.KEBAB_CASE,
    message: args.nameMessage,
    ...(args.name !== undefined && { name: args.name }),
    subject: args.nameSubject,
  });

  return { nameKebabCase, projectName };
}

/**
 * Resolves and validates the components directory for a project.
 */
export function resolveProjectComponentsDirectoryPath(args: {
  projectName: string;
  tree: Tree;
}): string {
  return resolveProjectDirectoryPath({
    directoryPath: "src/components",
    projectName: args.projectName,
    tree: args.tree,
  });
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
 * Resolves and validates the modules directory for a project.
 */
export function resolveProjectModulesDirectoryPath(args: {
  projectName: string;
  tree: Tree;
}): string {
  return resolveProjectDirectoryPath({
    directoryPath: "src/modules",
    projectName: args.projectName,
    tree: args.tree,
  });
}

/**
 * Runs a callback-based generator command and commits tree changes.
 */
export async function runGeneratorCommandWithCallback<
  TOptions extends object,
>(args: {
  generate: (
    argumentsOrTree: GeneratorInvocationArguments<TOptions>,
  ) => Promise<GeneratorCallback | undefined>;
  logger: { log: (message: string) => void };
  options: TOptions;
  successMessage: string;
}): Promise<void> {
  const tree = createWorkspaceTree();
  const callback = await args.generate({ options: args.options, tree });
  await commitWorkspaceTree({
    ...(callback !== undefined && { callback }),
    tree,
  });
  args.logger.log(args.successMessage);
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
