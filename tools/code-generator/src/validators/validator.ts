import fs from "node:fs";
import path from "node:path";

import ejs from "ejs";
import { createSourceFile, ScriptKind, ScriptTarget } from "typescript";

import { converterByStringCase } from "../constants";
import { StringCase } from "../types";

import { validateDepthFirstSearch } from "./abstract-syntax-tree";

import type { InstanceDirectoryValidationResult } from "./types";

/**
 * Validates that a generated TypeScript file is a structural superset of its
 * EJS template by comparing their parsed ASTs node-by-node.
 *
 * The template is first rendered with data via EJS, then both the rendered
 * template and instance are parsed into TypeScript ASTs. A depth-first walk
 * checks that every node in the template exists somewhere in the instance at
 * the same depth (superset, not equality — the instance may contain extra nodes
 * not present in the template). Type annotations, decorator arguments, import
 * specifiers, and named declarations are all checked; empty method bodies and
 * array literals are not (recursion stops where the template has no children).
 *
 * Comments are validated in template order via the TypeScript trivia API. TODO
 * comments match loosely (any `// ... TODO ...` line); all others must match
 * exactly.
 *
 * Use this function when `template` and `instance` are already in memory. For
 * file-system reads use {@link validateInstanceFile}.
 */
export function validateConformance(args: {
  data: Record<string, unknown>;
  filename: string;
  instance: string;
  template: string;
}): {
  errors: string[];
} {
  const { instance, template, data, filename } = args;

  const scriptKind = filename.endsWith(".tsx") ? ScriptKind.TSX : ScriptKind.TS;
  const templateFile = createSourceFile(
    filename,
    ejs.render(template, data),
    ScriptTarget.Latest,
    true,
    scriptKind,
  );
  const instanceFile = createSourceFile(
    filename,
    instance,
    ScriptTarget.Latest,
    true,
    scriptKind,
  );

  const errors = validateDepthFirstSearch({
    templateNode: templateFile,
    instanceNode: instanceFile,
    instanceFile,
  });

  return { errors };
}

/**
 * File-system variant of {@link validateConformance} that reads both the
 * generated instance file and the EJS template from disk before validating.
 *
 * If either path does not exist (`ENOENT`), returns \{ errors: ["Missing file:
 * <path>"] \} rather than throwing, so callers can treat a missing file as a
 * conformance failure rather than a crash.
 */
export function validateInstanceFile(args: {
  instanceFilePath: string;
  templateFilePath: string;
  data: Record<string, unknown>;
}): {
  errors: string[];
} {
  const { instanceFilePath, templateFilePath, data } = args;
  try {
    const instance = fs.readFileSync(instanceFilePath, "utf8");
    const template = fs.readFileSync(templateFilePath, "utf8");
    return validateConformance({
      instance,
      template,
      data,
      filename: path.basename(instanceFilePath),
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { errors: [`Missing file: ${instanceFilePath}`] };
    }
    throw error;
  }
}

/**
 * Validates all generated files in a single instance directory against their
 * corresponding EJS templates in `templateDirectoryPath`.
 *
 * Each template filename may contain `__fieldName__` tokens (e.g.
 * `__nameCamelCase__.service.ts`) that are resolved to the instance filename
 * using the EJS variable substitutions derived from `instanceDirectoryPath`'s
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
    namePascalCase: converterByStringCase[StringCase.PASCAL_CASE](name),
    nameSnakeCase: converterByStringCase[StringCase.SNAKE_CASE](name),
    nameKebabCase: converterByStringCase[StringCase.KEBAB_CASE](name),
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
        instanceFilePath,
        templateFilePath,
        data,
      }),
    };
  });

  return { directoryName: name, results };
}

/**
 * Validates every subdirectory of `instancesDirectoryPath` by calling
 * {@link validateInstanceDirectory} on each one.
 *
 * Intended for conformance test suites that need to check an entire
 * `src/modules/` tree (or equivalent) in one call rather than iterating
 * subdirectories manually.
 *
 * @returns One result entry per instance subdirectory, in filesystem order.
 */
export function validateInstancesDirectory(args: {
  instancesDirectoryPath: string;
  templateDirectoryPath: string;
}): InstanceDirectoryValidationResult[] {
  const { instancesDirectoryPath, templateDirectoryPath } = args;
  return fs
    .readdirSync(instancesDirectoryPath, { withFileTypes: true })
    .filter((node) => node.isDirectory())
    .map((node) =>
      validateInstanceDirectory({
        instanceDirectoryPath: path.join(instancesDirectoryPath, node.name),
        templateDirectoryPath,
      }),
    );
}

/**
 * Flattens the nested results from {@link validateInstancesDirectory} into a
 * single newline-joined error string, or `null` when all files pass.
 *
 * Each failing file contributes one line per error in the form
 * `"<instanceName>/<file>: <error>"`, making the output suitable for a Jest
 * `expect(errors).toBeNull()` assertion message or a CI log.
 */
export function collectConformanceErrors(
  results: InstanceDirectoryValidationResult[],
): string | null {
  const errors = results.flatMap((result) => {
    const { directoryName, results: fileResults } = result;
    return fileResults.flatMap((fileResult) => {
      const { filename, errors: fileErrors } = fileResult;
      return fileErrors.length === 0
        ? []
        : fileErrors.map(
            (fileError) => `${directoryName}/${filename}: ${fileError}`,
          );
    });
  });
  return errors.length === 0 ? null : errors.join("\n");
}
