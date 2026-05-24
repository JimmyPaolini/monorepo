import fs from "node:fs";
import path from "node:path";

import mustache from "mustache";

import type { NameVariables } from "./name-variables";
import type { Tree } from "@nx/devkit";

/**
 * Renders all template files in `templateDir` using Mustache and writes the
 * results into `targetDir` on the Nx virtual file system tree.
 *
 * File and directory names inside `templateDir` may contain `__fieldName__`
 * tokens (e.g. `__nameCamel__.service.ts`). These are resolved to the
 * corresponding value in `variables` before writing.
 *
 * Mustache rendering uses `variables` as the view object. HTML escaping is
 * disabled by using triple-mustache syntax in templates (`{{{var}}}`) or by
 * relying on the fact that name variables never contain HTML-special characters.
 *
 * @param tree - The Nx virtual file system tree to write output into.
 * @param templateDir - Absolute path to the directory containing template files.
 * @param targetDir - Destination path within `tree` where files will be written.
 * @param variables - Pre-computed name variables used for both Mustache rendering
 *   and `__fieldName__` substitution in output filenames.
 */
export function renderTemplates(
  tree: Tree,
  templateDir: string,
  targetDir: string,
  variables: NameVariables,
): void {
  const templateFiles = fs
    .readdirSync(templateDir, { withFileTypes: true })
    .filter((entry) => entry.isFile());

  for (const entry of templateFiles) {
    const templateContent = fs.readFileSync(
      path.join(templateDir, entry.name),
      "utf8",
    );

    const rendered = mustache.render(templateContent, variables);

    const outputFilename = resolveFilename(entry.name, variables);
    const outputPath = path.join(targetDir, outputFilename);

    tree.write(outputPath, rendered);
  }
}

/**
 * Replaces `__fieldName__` tokens in a filename with the corresponding value
 * from `variables`. Unknown tokens are replaced with an empty string.
 */
function resolveFilename(
  templateFilename: string,
  variables: Record<string, string>,
): string {
  return templateFilename.replaceAll(/__(\w+)__/g, (_, field: string) => {
    const value = variables[field];
    return typeof value === "string" ? value : "";
  });
}
