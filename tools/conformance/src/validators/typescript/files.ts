import fs from "node:fs";
import path from "node:path";

import { workspaceRoot } from "@nx/devkit";

import { converterByStringCase } from "../../constants";
import { StringCase } from "../../types";

import { validateJsonConformance } from "./json/validator";
import { validateMarkdownConformance } from "./markdown/validator";
import { validateTextConformance } from "./text/validator";
import { validateTypescriptConformance } from "./validator";

import type {
  ConformanceError,
  InstanceDirectoryValidationResult,
} from "./types";

const TS_EXTENSIONS = new Set([".cjs", ".js", ".jsx", ".mjs", ".ts", ".tsx"]);

/**
 * Formats the nested results from {@link validateInstancesDirectory} into a
 * single rich multi-section error string, or `null` when all files pass.
 *
 * Errors are grouped by directory and then by file. Each error includes the
 * full paths to both the instance and template files, the error location in
 * each file (line/column or JSON path), the expected value, and a suggested
 * fix — making the output suitable for a coding agent to read and act on.
 */
export function stringifyConformanceErrors(
  results: InstanceDirectoryValidationResult[],
): null | string {
  const directoriesWithErrors = results.filter((result) =>
    result.results.some((fileResult) => fileResult.errors.length > 0),
  );
  if (directoriesWithErrors.length === 0) return null;

  const count = directoriesWithErrors.length;
  const header = `Conformance validation failed — ${String(count)} director${count === 1 ? "y" : "ies"} with errors.`;
  const body = directoriesWithErrors.flatMap(
    ({ directoryName, results: fileResults }, index) =>
      formatDirectoryLines(directoryName, fileResults, index),
  );
  return [header, ...body].join("\n");
}

/**
 * Validates all generated files in a single instance directory against their
 * corresponding Mustache templates in `templateDirectoryPath`.
 *
 * Each template filename may contain `__fieldName__` tokens (e.g.
 * `__nameKebabCase__.service.ts`) that are resolved to the instance filename
 * using the template variable substitutions derived from `instanceDirectoryPath`'s
 * basename. The same substitution map (`nameCamelCase`, `namePascalCase`,
 * `nameSnakeCase`, `nameKebabCase`) is passed to {@link validateInstanceFile}
 * when rendering each template.
 *
 * Validation uses AST superset-checking so that developer modifications to
 * method bodies, constructor arguments, and array contents do not produce
 * false failures — only structurally required template nodes are enforced.
 *
 * file, each carrying the resolved filename and any validation errors.
 */
export function validateInstanceDirectory(args: {
  instanceDirectoryPath: string;
  templateDirectoryPath: string;
}): InstanceDirectoryValidationResult {
  const { instanceDirectoryPath, templateDirectoryPath } = args;
  const name = path.basename(instanceDirectoryPath);
  const data = buildNameData(name);

  const templateFilenames = fs
    .readdirSync(templateDirectoryPath, { withFileTypes: true })
    .filter((node) => node.isFile())
    .map((node) => node.name);

  const results = templateFilenames.map((templateFilename) =>
    resolveTemplateFile({
      data,
      instanceDirectoryPath,
      templateDirectoryPath,
      templateFilename,
    }),
  );

  return { directoryName: name, results };
}

/**
 * File-system variant of {@link validateTypescriptConformance} that reads both the
 * generated instance file and the Mustache template from disk before validating.
 *
 * If either path does not exist (`ENOENT`), returns a structured error with
 * `errorType: 'file'` rather than throwing, so callers can treat a missing file
 * as a conformance failure rather than a crash.
 */
export function validateInstanceFile(args: {
  data: Record<string, unknown>;
  instanceFilePath: string;
  templateFilePath: string;
}): {
  errors: ConformanceError[];
  instanceFilePath: string;
  templateFilePath: string;
} {
  const { data, instanceFilePath, templateFilePath } = args;
  try {
    const instance = fs.readFileSync(instanceFilePath, "utf8");
    const template = fs.readFileSync(templateFilePath, "utf8");
    const filename = path.basename(instanceFilePath);
    const extension = filename.slice(filename.lastIndexOf("."));
    const { errors } = selectValidator({
      data,
      extension,
      filename,
      instance,
      template,
    });
    return { errors, instanceFilePath, templateFilePath };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return buildMissingFileError(instanceFilePath, templateFilePath);
    }
    throw error;
  }
}

/**
 * Validates every subdirectory of `instancesDirectoryPath` by calling
 * {@link validateInstanceDirectory} on each one.
 *
 * Intended for conformance test suites that need to check an entire
 * `src/modules/` tree (or equivalent) in one call rather than iterating
 * subdirectories manually.
 */
export function validateInstancesDirectory(args: {
  excludeDirectories?: string[];
  instancesDirectoryPath: string;
  templateDirectoryPath: string;
}): InstanceDirectoryValidationResult[] {
  const { excludeDirectories, instancesDirectoryPath, templateDirectoryPath } =
    args;
  return fs
    .readdirSync(instancesDirectoryPath, { withFileTypes: true })
    .filter(
      (node) => node.isDirectory() && !excludeDirectories?.includes(node.name),
    )
    .map((node) =>
      validateInstanceDirectory({
        instanceDirectoryPath: path.join(instancesDirectoryPath, node.name),
        templateDirectoryPath,
      }),
    );
}

/**
 * Build missing file error.
 */
function buildMissingFileError(
  instanceFilePath: string,
  templateFilePath: string,
): {
  errors: ConformanceError[];
  instanceFilePath: string;
  templateFilePath: string;
} {
  return {
    errors: [
      {
        errorType: "file",
        fix: `Create the file using the generator or manually based on the template at ${templateFilePath}`,
        message: `Missing file: ${instanceFilePath}`,
      },
    ],
    instanceFilePath,
    templateFilePath,
  };
}

/**
 * Build name data.
 */
function buildNameData(name: string): Record<string, string> {
  return {
    nameCamelCase: converterByStringCase[StringCase.CAMEL_CASE](name),
    nameKebabCase: converterByStringCase[StringCase.KEBAB_CASE](name),
    namePascalCase: converterByStringCase[StringCase.PASCAL_CASE](name),
    nameSnakeCase: converterByStringCase[StringCase.SNAKE_CASE](name),
  };
}

/**
 * Format directory lines.
 */
function formatDirectoryLines(
  directoryName: string,
  fileResults: InstanceDirectoryValidationResult["results"],
  directoryIndex: number,
): string[] {
  const failingFiles = fileResults.filter((r) => r.errors.length > 0);
  const header = [
    "",
    `${String(directoryIndex + 1)}. directory: ${directoryName}`,
  ];
  const fileLines = failingFiles.flatMap((fileResult, index) =>
    formatFileResultLines(fileResult, index),
  );
  return [...header, ...fileLines];
}

/**
 * Format error lines.
 */
function formatErrorLines(error: ConformanceError, index: number): string[] {
  return [
    "",
    `     ${String(index + 1)}. ${error.message}`,
    ...formatLocationLines({
      column: error.instanceColumn,
      jsonPath: error.instancePath,
      line: error.instanceLine,
      prefix: "Instance",
    }),
    ...formatLocationLines({
      column: error.templateColumn,
      jsonPath: error.templatePath,
      line: error.templateLine,
      prefix: "Template",
    }),
    ...(error.expected === undefined
      ? []
      : [`        Expected: \`${error.expected}\``]),
    ...(error.actual === undefined
      ? []
      : [`        Actual  : \`${error.actual}\``]),
    `        Fix     : ${error.fix}`,
  ];
}

/**
 * Format file result lines.
 */
function formatFileResultLines(
  fileResult: InstanceDirectoryValidationResult["results"][number],
  fileIndex: number,
): string[] {
  const header = [
    "",
    `  ${String(fileIndex + 1)}. file: ${fileResult.filename}`,
    `     Instance: ${path.relative(workspaceRoot, fileResult.instanceFilePath)}`,
    `     Template: ${path.relative(workspaceRoot, fileResult.templateFilePath)}`,
  ];
  const errorLines = fileResult.errors.flatMap((error, index) =>
    formatErrorLines(error, index),
  );
  return [...header, ...errorLines];
}

/**
 * Format location lines.
 */
function formatLocationLines(args: {
  column: number | undefined;
  jsonPath: string | undefined;
  line: number | undefined;
  prefix: string;
}): string[] {
  const { column, jsonPath, line, prefix } = args;
  if (line !== undefined) {
    const column_ = column === undefined ? "" : `, Column ${String(column)}`;
    return [`        ${prefix}: Line ${String(line)}${column_}`];
  }
  if (jsonPath !== undefined) {
    return [`        ${prefix}: JSON path "${jsonPath}"`];
  }
  return [];
}

/**
 * Resolve template file.
 */
function resolveTemplateFile(args: {
  data: Record<string, unknown>;
  instanceDirectoryPath: string;
  templateDirectoryPath: string;
  templateFilename: string;
}): {
  errors: ConformanceError[];
  filename: string;
  instanceFilePath: string;
  templateFilePath: string;
} {
  const {
    data,
    instanceDirectoryPath,
    templateDirectoryPath,
    templateFilename,
  } = args;
  const instanceFilename = templateFilename.replaceAll(
    /__(\w+)__/g,
    (_: string, field: string) => {
      const value = data[field];
      return typeof value === "string" ? value : "";
    },
  );
  const instanceFilePath = path.join(instanceDirectoryPath, instanceFilename);
  const templateFilePath = path.join(templateDirectoryPath, templateFilename);
  return {
    filename: instanceFilename,
    ...validateInstanceFile({ data, instanceFilePath, templateFilePath }),
  };
}

/**
 * Select validator.
 */
function selectValidator(args: {
  data: Record<string, unknown>;
  extension: string;
  filename: string;
  instance: string;
  template: string;
}): { errors: ConformanceError[] } {
  const { data, extension, filename, instance, template } = args;
  if (extension === ".json") {
    return validateJsonConformance({ data, filename, instance, template });
  }
  if (extension === ".md") {
    return validateMarkdownConformance({ data, filename, instance, template });
  }
  if (TS_EXTENSIONS.has(extension)) {
    return validateTypescriptConformance({
      data,
      filename,
      instance,
      template,
    });
  }
  return validateTextConformance({ data, filename, instance, template });
}
