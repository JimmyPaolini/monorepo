import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { formatFiles, type Tree } from "@nx/devkit";
import _ from "lodash";
import mustache from "mustache";

import { StringCase } from "../../types";
import { resolveName } from "../../utilities";

interface GenerateNestjsCommandApplicationOptions {
  name?: string;
}

export const APPLICATIONS_DIRECTORY = "applications";
export const MODULES_DIRECTORY = "src/modules";
export const TEMPLATES_DIRECTORY_PATH = fileURLToPath(
  new URL("templates", import.meta.url),
);

function renderTemplateDirectory(args: {
  tree: Tree;
  templateDirectoryPath: string;
  instanceDirectoryPath: string;
  substitutions: Record<string, string>;
}): void {
  const { tree, templateDirectoryPath, instanceDirectoryPath, substitutions } =
    args;

  const nodes = fs.readdirSync(templateDirectoryPath, { withFileTypes: true });

  for (const node of nodes) {
    const templatePath = path.join(templateDirectoryPath, node.name);
    const outputName = node.name
      .replaceAll(/__(\w+)__/g, (templateToken: string, field: string) => {
        return substitutions[field] ?? templateToken;
      })
      .replace(/\.mustache$/, "");
    const outputPath = path.join(instanceDirectoryPath, outputName);

    if (node.isDirectory()) {
      renderTemplateDirectory({
        tree,
        templateDirectoryPath: templatePath,
        instanceDirectoryPath: outputPath,
        substitutions,
      });
      continue;
    }

    const template = fs.readFileSync(templatePath, "utf8");
    const rendered = mustache.render(template, substitutions);
    tree.write(outputPath, rendered);
  }
}

/**
 * Generates a new NestJS command-line application scaffold using nest-commander.
 *
 * @param tree - The Nx virtual file system tree
 * @param options - Configuration options for the NestJS command application
 */
export async function generateNestjsCommandApplication(
  tree: Tree,
  options: GenerateNestjsCommandApplicationOptions,
): Promise<void> {
  const nameKebab = await resolveName({
    ...(options.name !== undefined && { name: options.name }),
    case: StringCase.KEBAB_CASE,
    message: "What is the name of the application? (kebab-case)",
    subject: "Application name",
  });

  const projectRoot = path.join(APPLICATIONS_DIRECTORY, nameKebab);

  if (tree.exists(projectRoot)) {
    throw new Error(
      `Directory "${projectRoot}" already exists. Choose a different application name.`,
    );
  }

  const nameCamelCase = _.camelCase(nameKebab);
  const namePascalCase = _.upperFirst(nameCamelCase);

  renderTemplateDirectory({
    tree,
    templateDirectoryPath: TEMPLATES_DIRECTORY_PATH,
    instanceDirectoryPath: projectRoot,
    substitutions: {
      nameKebab,
      nameCamelCase,
      namePascalCase,
    },
  });

  await formatFiles(tree);
}
