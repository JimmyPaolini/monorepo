import fs from "node:fs";
import path from "node:path";

import ejs from "ejs";

const TODO_LINE_REGEX = /\bTODO\b/u;

/**
 * Validates that a generated file still conforms to its source template's
 * structural skeleton.
 *
 * The template is rendered with `data` to produce the expected structural
 * lines. Lines containing `TODO` are excluded — these mark scaffolding that
 * excluded — these mark scaffolding that developers are expected to replace.
 * Each remaining line must appear in `fileContent` in order. Missing lines are
 * reported as errors, distinguishing emoji section markers from other
 * structural lines.
 *
 * @param fileContent - The current content of the generated file.
 * @param template - The EJS template source used to generate the file.
 * @param data - The variable substitutions to render the template with.
 * @returns An object with `valid` (true when no errors) and `errors` (list of
 *   human-readable descriptions of missing lines).
 */
export function validateConformance(
  fileContent: string,
  template: string,
  data: Record<string, unknown>,
): { valid: boolean; errors: string[] } {
  const content = ejs.render(template, data);
  const structural = content
    .split("\n")
    .filter((line) => line.trim() !== "")
    .filter((line) => !TODO_LINE_REGEX.test(line));
  const errors: string[] = [];
  let cursor = 0;

  for (const line of structural) {
    const index = fileContent.indexOf(line, cursor);
    if (index === -1) {
      errors.push(`Missing template code: "${line.trim()}"`);
    } else {
      cursor = index + line.length;
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * File-system variant of {@link validateConformance} that reads both the
 * generated file and the template from disk before validating.
 *
 * Returns `{ valid: false, errors: [...] }` when either path does not exist,
 * rather than throwing.
 *
 * @param filePath - Absolute path to the generated file.
 * @param templatePath - Absolute path to the EJS template.
 * @param data - The variable substitutions to render the template with.
 */
export function validateConformanceFiles(
  filePath: string,
  templatePath: string,
  data: Record<string, unknown>,
): { valid: boolean; errors: string[] } {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const template = fs.readFileSync(templatePath, "utf8");
    return validateConformance(content, template, data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { valid: false, errors: [`File not found: ${filePath}`] };
    }
    throw error;
  }
}

function resolveTemplateName(
  templateFileName: string,
  data: Record<string, unknown>,
): string {
  return templateFileName.replaceAll(
    /__(\w+)__/g,
    (_: string, field: string) => {
      const value = data[field];
      return typeof value === "string" ? value : "";
    },
  );
}

/**
 * Validates every subdirectory of a generated output directory against the
 * corresponding templates.
 *
 * For each subdirectory (representing one generated module), every template
 * file is resolved to its generated filename using `vars`, then validated via
 * {@link validateConformanceFiles}.
 *
 * @param dirPath - Path to the directory containing generated module
 *   subdirectories.
 * @param templateDirPath - Path to the directory containing EJS template
 *   files.
 * @param varsFromName - Maps a subdirectory name to the EJS variable
 *   substitutions for that module.
 * @returns One result entry per subdirectory, each containing the module name
 *   and per-file validation results.
 */
export function validateGeneratedDirectory(
  dirPath: string,
  templateDirPath: string,
  varsFromName: (name: string) => Record<string, unknown>,
): {
  name: string;
  results: { file: string; valid: boolean; errors: string[] }[];
}[] {
  const subdirectories = fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  const templateFiles = fs
    .readdirSync(templateDirPath, { withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => e.name);

  return subdirectories.map((subdirectory) => {
    const data = varsFromName(subdirectory);
    const results = templateFiles.map((templateFilename) => {
      const generatedFilename = resolveTemplateName(templateFilename, data);
      const filePath = path.join(dirPath, subdirectory, generatedFilename);
      const templatePath = path.join(templateDirPath, templateFilename);
      return {
        file: generatedFilename,
        ...validateConformanceFiles(filePath, templatePath, data),
      };
    });
    return { name: subdirectory, results };
  });
}
