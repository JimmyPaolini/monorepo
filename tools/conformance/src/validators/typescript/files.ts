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

  const lines: string[] = [];

  const dirCount = directoriesWithErrors.length;
  lines.push(
    `Conformance validation failed — ${String(dirCount)} director${dirCount === 1 ? "y" : "ies"} with errors.`,
  );

  directoriesWithErrors.forEach(
    ({ directoryName, results: fileResults }, dirIndex) => {
      const failingFiles = fileResults.filter((r) => r.errors.length > 0);

      lines.push("", `${String(dirIndex + 1)}. directory: ${directoryName}`);

      failingFiles.forEach((fileResult, fileIndex) => {
        lines.push(
          "",
          `  ${String(fileIndex + 1)}. file: ${fileResult.filename}`,
          `     Instance: ${path.relative(workspaceRoot, fileResult.instanceFilePath)}`,
          `     Template: ${path.relative(workspaceRoot, fileResult.templateFilePath)}`,
        );

        fileResult.errors.forEach((err, i) => {
          lines.push("", `     ${String(i + 1)}. ${err.message}`);

          // Instance location
          if (err.instanceLine !== undefined) {
            const col =
              err.instanceColumn === undefined
                ? ""
                : `, Column ${String(err.instanceColumn)}`;
            lines.push(
              `        Instance: Line ${String(err.instanceLine)}${col}`,
            );
          } else if (err.instancePath !== undefined) {
            lines.push(`        Instance: JSON path "${err.instancePath}"`);
          }

          // Template location
          if (err.templateLine !== undefined) {
            const col =
              err.templateColumn === undefined
                ? ""
                : `, Column ${String(err.templateColumn)}`;
            lines.push(
              `        Template: Line ${String(err.templateLine)}${col}`,
            );
          } else if (err.templatePath !== undefined) {
            lines.push(`        Template: JSON path "${err.templatePath}"`);
          }

          if (err.expected !== undefined) {
            lines.push(`        Expected: \`${err.expected}\``);
          }
          if (err.actual !== undefined) {
            lines.push(`        Actual  : \`${err.actual}\``);
          }
          lines.push(`        Fix     : ${err.fix}`);
        });
      });
    },
  );

  return lines.join("\n");
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
 * @returns The instance directory's basename and one result entry per template
 * file, each carrying the resolved filename and any validation errors.
 */
export function validateInstanceDirectory(args: {
  instanceDirectoryPath: string;
  templateDirectoryPath: string;
}): InstanceDirectoryValidationResult {
  const { instanceDirectoryPath, templateDirectoryPath } = args;
  const name = path.basename(instanceDirectoryPath);

  const data = {
    nameCamelCase: converterByStringCase[StringCase.CAMEL_CASE](name),
    nameKebabCase: converterByStringCase[StringCase.KEBAB_CASE](name),
    namePascalCase: converterByStringCase[StringCase.PASCAL_CASE](name),
    nameSnakeCase: converterByStringCase[StringCase.SNAKE_CASE](name),
  };

  const templateFilenames = fs
    .readdirSync(templateDirectoryPath, { withFileTypes: true })
    .filter((node) => node.isFile())
    .map((node) => node.name);

  const results = templateFilenames.map((templateFilename) => {
    const instanceFilename = templateFilename.replaceAll(
      /__(\w+)__/g,
      (_: string, field: string) => {
        const value = (data as Record<string, unknown>)[field];
        return typeof value === "string" ? value : "";
      },
    );
    const instanceFilePath = path.join(instanceDirectoryPath, instanceFilename);
    const templateFilePath = path.join(templateDirectoryPath, templateFilename);
    return {
      filename: instanceFilename,
      ...validateInstanceFile({
        data,
        instanceFilePath,
        templateFilePath,
      }),
    };
  });

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

    let errors: ConformanceError[];
    if (extension === ".json") {
      ({ errors } = validateJsonConformance({
        data,
        filename,
        instance,
        template,
      }));
    } else if (extension === ".md") {
      ({ errors } = validateMarkdownConformance({
        data,
        filename,
        instance,
        template,
      }));
    } else if (TS_EXTENSIONS.has(extension)) {
      ({ errors } = validateTypescriptConformance({
        data,
        filename,
        instance,
        template,
      }));
    } else {
      ({ errors } = validateTextConformance({
        data,
        filename,
        instance,
        template,
      }));
    }

    return { errors, instanceFilePath, templateFilePath };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
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
 *
 * @param args.excludeDirectories - Optional list of subdirectory names to skip.
 * Use this to exclude hand-crafted infrastructure modules (e.g. `logger`) that
 * intentionally diverge from the generator template.
 *
 * @returns One result entry per instance subdirectory, in filesystem order.
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
