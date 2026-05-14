import fs from "node:fs";
import path from "node:path";

import ejs from "ejs";
import ts, {
  type ClassDeclaration,
  type ConstructorDeclaration,
  type Decorator,
  forEachChild,
  type HasDecorators,
  type Identifier,
  type ImportDeclaration,
  isCallExpression,
  isClassDeclaration,
  isConstructorDeclaration,
  isDecorator,
  isIdentifier,
  isImportDeclaration,
  isMethodDeclaration,
  isNamedImports,
  isObjectLiteralExpression,
  isPropertyAssignment,
  ScriptKind,
  ScriptTarget,
  type SourceFile,
  type StringLiteral,
  SyntaxKind,
} from "typescript";

// ─── AST helpers ─────────────────────────────────────────────────────────────

function createSourceFile(sourceText: string, fileName: string): SourceFile {
  return ts.createSourceFile(
    fileName,
    sourceText,
    ScriptTarget.Latest,
    true,
    fileName.endsWith(".tsx") ? ScriptKind.TSX : ScriptKind.TS,
  );
}

function getDecorators(node: HasDecorators): readonly Decorator[] {
  return node.modifiers?.filter((modifier) => isDecorator(modifier)) ?? [];
}

function getDecoratorName(decorator: Decorator): string | undefined {
  const expression = decorator.expression;
  if (isIdentifier(expression)) return expression.text;
  if (isCallExpression(expression) && isIdentifier(expression.expression))
    return expression.expression.text;
  return undefined;
}

function getNamedImports(node: ImportDeclaration): string[] {
  const { namedBindings } = node.importClause ?? {};
  if (!namedBindings || !isNamedImports(namedBindings)) return [];
  return namedBindings.elements.map((element) => element.name.text);
}

function isEmptyConstructor(node: ConstructorDeclaration): boolean {
  return (
    node.parameters.length === 0 &&
    (node.body === undefined || node.body.statements.length === 0)
  );
}

function extractLineComments(
  sourceText: string,
  start: number,
  end: number,
): string[] {
  const slice = sourceText.slice(start, end);
  const results: string[] = [];
  const regex = /\/\/[^\n]*/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(slice)) !== null) {
    results.push(match[0].trim());
  }
  return results;
}

// ─── Structural subset check ──────────────────────────────────────────────────

/**
 * Checks that every top-level import and class declaration in `templateFile`
 * is structurally present in `fileFile`, allowing the file to have additional
 * declarations. Array contents in decorator arguments are not checked — only
 * property key presence — so developer additions (e.g. `controllers: [Foo]`)
 * do not cause failures.
 *
 * Also collects comment texts found inside empty constructors in the template
 * so they can be excluded from string-based section-marker checks.
 *
 * @param templateFile - Parsed rendered template.
 * @param templateSource - Raw source of the rendered template, used for
 *   comment extraction within constructor ranges.
 * @param fileFile - Parsed generated file.
 * @returns Validation errors and comments to exclude from string checks.
 */
function checkSubset(
  templateFile: SourceFile,
  templateSource: string,
  fileFile: SourceFile,
): { errors: string[]; excludedComments: Set<string> } {
  const errors: string[] = [];
  const excludedComments = new Set<string>();

  const fileImports: ImportDeclaration[] = [];
  const fileClasses = new Map<string, ClassDeclaration>();
  forEachChild(fileFile, (node) => {
    if (isImportDeclaration(node)) fileImports.push(node);
    else if (isClassDeclaration(node) && node.name)
      fileClasses.set(node.name.text, node);
  });

  forEachChild(templateFile, (node) => {
    if (isImportDeclaration(node)) {
      const specifier = (node.moduleSpecifier as StringLiteral).text;
      const fileImport = fileImports.find(
        (fileImport) =>
          (fileImport.moduleSpecifier as StringLiteral).text === specifier,
      );
      if (!fileImport) {
        errors.push(`Missing import from "${specifier}"`);
        return;
      }
      for (const name of getNamedImports(node)) {
        if (!getNamedImports(fileImport).includes(name)) {
          errors.push(`Missing named import "${name}" from "${specifier}"`);
        }
      }
      const templateDefault = node.importClause?.name?.text;
      if (
        templateDefault !== undefined &&
        fileImport.importClause?.name?.text !== templateDefault
      ) {
        errors.push(
          `Missing default import "${templateDefault}" from "${specifier}"`,
        );
      }
    } else if (isClassDeclaration(node) && node.name) {
      const className = node.name.text;
      const fileClass = fileClasses.get(className);
      if (!fileClass) {
        errors.push(`Missing class "${className}"`);
        return;
      }

      const fileDecoratorNames = new Set(
        getDecorators(fileClass)
          .map((decorator) => getDecoratorName(decorator))
          .filter((name): name is string => name !== undefined),
      );

      for (const decorator of getDecorators(node)) {
        const decoratorName = getDecoratorName(decorator);
        if (!decoratorName) continue;

        if (!fileDecoratorNames.has(decoratorName)) {
          errors.push(
            `Missing decorator "@${decoratorName}" on class "${className}"`,
          );
          continue;
        }

        if (
          !isCallExpression(decorator.expression) ||
          decorator.expression.arguments.length === 0
        )
          continue;

        const templateArg = decorator.expression.arguments[0];
        if (!templateArg || !isObjectLiteralExpression(templateArg)) continue;

        const fileDecorator = getDecorators(fileClass).find(
          (d) => getDecoratorName(d) === decoratorName,
        );
        const fileArgExpr =
          fileDecorator &&
          isCallExpression(fileDecorator.expression) &&
          fileDecorator.expression.arguments[0];
        if (!fileArgExpr || !isObjectLiteralExpression(fileArgExpr)) {
          errors.push(
            `Missing "@${decoratorName}" decorator argument on class "${className}"`,
          );
          continue;
        }

        const fileKeys = new Set(
          fileArgExpr.properties
            .filter((property) => isPropertyAssignment(property))
            .filter((property) => isIdentifier(property.name))
            .map((property) => (property.name as Identifier).text),
        );

        for (const property of templateArg.properties) {
          if (!isPropertyAssignment(property) || !isIdentifier(property.name))
            continue;
          if (!fileKeys.has(property.name.text)) {
            errors.push(
              `Missing property "${property.name.text}" in "@${decoratorName}" decorator on class "${className}"`,
            );
          }
        }
      }

      for (const member of node.members) {
        if (isConstructorDeclaration(member)) {
          if (isEmptyConstructor(member)) {
            for (const comment of extractLineComments(
              templateSource,
              member.pos,
              member.end,
            )) {
              excludedComments.add(comment);
            }
          } else if (
            !fileClass.members.some((member) =>
              isConstructorDeclaration(member),
            )
          ) {
            errors.push(`Missing constructor in class "${className}"`);
          }
        } else if (isMethodDeclaration(member) && isIdentifier(member.name)) {
          const methodName = member.name.text;
          const isStatic =
            member.modifiers?.some(
              (modifier) => modifier.kind === SyntaxKind.StaticKeyword,
            ) ?? false;
          const isPrivate =
            member.modifiers?.some(
              (modifier) => modifier.kind === SyntaxKind.PrivateKeyword,
            ) ?? false;
          const found = fileClass.members.some(
            (modifier) =>
              isMethodDeclaration(modifier) &&
              isIdentifier(modifier.name) &&
              modifier.name.text === methodName &&
              (modifier.modifiers?.some(
                (modifier) => modifier.kind === SyntaxKind.StaticKeyword,
              ) ?? false) === isStatic &&
              (modifier.modifiers?.some(
                (modifier) => modifier.kind === SyntaxKind.PrivateKeyword,
              ) ?? false) === isPrivate,
          );
          if (!found) {
            errors.push(
              `Missing method "${methodName}" in class "${className}"`,
            );
          }
        }
      }
    }
  });

  return { errors, excludedComments };
}

// ─── Template conformance ─────────────────────────────────────────────────────

const TODO_LINE_REGEX = /\bTODO\b/u;
const COMMENT_LINE_REGEX = /^\s*\/\//u;
const EMOJI_REGEX = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/u;

function escapeRegex(str: string): string {
  return str.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

/**
 * AST-aware variant of {@link validateConformance} for generated TypeScript
 * files where some template lines are expected to be updated by developers.
 *
 * Parses both the rendered template and the file into TypeScript ASTs and
 * checks that the template's structure is a subset of the file's structure —
 * so added imports, grown arrays, and expanded method bodies do not cause
 * failures.
 *
 * Comment lines are validated separately: emoji section markers (`// 🔑 ...`)
 * are matched via regex with cursor-based order enforcement; non-emoji comments
 * are checked for existence only.
 *
 * @param content - The current content of the generated file.
 * @param template - The EJS template source used to generate the file.
 * @param data - The variable substitutions to render the template with.
 * @param fileName - File name with `.ts` or `.tsx` extension for script-kind inference.
 */
export function validateConformance(
  content: string,
  template: string,
  data: Record<string, unknown>,
  fileName: string,
): { valid: boolean; errors: string[] } {
  const rendered = ejs.render(template, data);

  const commentLines = rendered
    .split("\n")
    .filter((line) => line.trim() !== "")
    .filter((line) => !TODO_LINE_REGEX.test(line))
    .filter((line) => COMMENT_LINE_REGEX.test(line.trim()));

  const { errors, excludedComments } = checkSubset(
    createSourceFile(rendered, fileName),
    rendered,
    createSourceFile(content, fileName),
  );

  const emojiComments = commentLines.filter((line) => EMOJI_REGEX.test(line));
  const blockComments = commentLines.filter((line) => !EMOJI_REGEX.test(line));

  let cursor = 0;
  for (const line of emojiComments) {
    const trimmed = line.trim();
    if (excludedComments.has(trimmed)) continue;
    const regex = new RegExp(escapeRegex(trimmed), "u");
    const match = regex.exec(content.slice(cursor));
    if (match) {
      cursor += match.index + match[0].length;
    } else {
      errors.push(`Missing template code: "${trimmed}"`);
    }
  }

  for (const line of blockComments) {
    const trimmed = line.trim();
    if (excludedComments.has(trimmed)) continue;
    if (!content.includes(trimmed)) {
      errors.push(`Missing template code: "${trimmed}"`);
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
export function validateFileConformance(
  filePath: string,
  templatePath: string,
  data: Record<string, unknown>,
): { valid: boolean; errors: string[] } {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const template = fs.readFileSync(templatePath, "utf8");
    return validateConformance(
      content,
      template,
      data,
      path.basename(filePath),
    );
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
 * corresponding templates using AST structural subset checking.
 *
 * For each subdirectory (representing one generated module), every template
 * file is resolved to its generated filename using `dataFromName`, then
 * validated via {@link validateFileConformance} so that developer
 * modifications to array contents, method bodies, and constructors do not cause
 * false failures.
 *
 * @param directoryPath - Path to the directory containing generated module subdirectories.
 * @param templateDirectoryPath - Path to the directory containing EJS template files.
 * @param dataFromName - Maps a subdirectory name to the EJS variable substitutions for that module.
 * @returns One result entry per subdirectory, each containing the module name and per-file validation results.
 */
export function validateGeneratedDirectory(
  directoryPath: string,
  templateDirectoryPath: string,
  dataFromName: (name: string) => Record<string, unknown>,
): {
  name: string;
  results: { file: string; valid: boolean; errors: string[] }[];
}[] {
  const subdirectories = fs
    .readdirSync(directoryPath, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  const templateFiles = fs
    .readdirSync(templateDirectoryPath, { withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => e.name);

  return subdirectories.map((subdirectory) => {
    const data = dataFromName(subdirectory);
    const results = templateFiles.map((templateFilename) => {
      const generatedFilename = resolveTemplateName(templateFilename, data);
      const filePath = path.join(
        directoryPath,
        subdirectory,
        generatedFilename,
      );
      const templatePath = path.join(templateDirectoryPath, templateFilename);
      return {
        file: generatedFilename,
        ...validateFileConformance(filePath, templatePath, data),
      };
    });
    return { name: subdirectory, results };
  });
}
