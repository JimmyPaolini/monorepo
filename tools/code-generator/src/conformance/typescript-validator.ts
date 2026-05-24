import { Node, Project, SyntaxKind } from "ts-morph";

import type { ConformanceError } from "./types";
import type {
  ClassDeclaration,
  FunctionDeclaration,
  InterfaceDeclaration,
  MethodDeclaration,
  SourceFile,
  TypeAliasDeclaration,
} from "ts-morph";

/**
 * Validates a TypeScript/TSX instance file against an expected (template-rendered) file
 * using ts-morph for structural AST comparison.
 *
 * Checks that all exports in the expected file exist in the instance with
 * matching signatures, JSDoc comments, and leading non-JSDoc comments.
 *
 * @param file - Relative filename (used in error `file` field).
 * @param expectedContent - The template-rendered expected file content.
 * @param actualContent - The actual instance file content.
 * @returns Array of conformance errors (empty if the file conforms).
 */
export function validateTypeScriptFile(
  file: string,
  expectedContent: string,
  actualContent: string,
): ConformanceError[] {
  const errors: ConformanceError[] = [];

  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: { strict: true },
  });

  const expectedFile = project.createSourceFile(
    `expected_${file}`,
    expectedContent,
  );
  const actualFile = project.createSourceFile(`actual_${file}`, actualContent);

  validateExports(file, expectedFile, actualFile, errors);

  return errors;
}

function validateExports(
  file: string,
  expectedFile: SourceFile,
  actualFile: SourceFile,
  errors: ConformanceError[],
): void {
  for (const expectedDecl of expectedFile.getExportedDeclarations().values()) {
    for (const decl of expectedDecl) {
      if (decl.getKind() === SyntaxKind.FunctionDeclaration) {
        validateFunctionDeclaration(
          file,
          decl as FunctionDeclaration,
          actualFile,
          errors,
        );
      } else if (decl.getKind() === SyntaxKind.ClassDeclaration) {
        validateClassDeclaration(
          file,
          decl as ClassDeclaration,
          actualFile,
          errors,
        );
      } else if (decl.getKind() === SyntaxKind.InterfaceDeclaration) {
        validateInterfaceDeclaration(
          file,
          decl as InterfaceDeclaration,
          actualFile,
          errors,
        );
      } else if (decl.getKind() === SyntaxKind.TypeAliasDeclaration) {
        validateTypeAliasDeclaration(
          file,
          decl as TypeAliasDeclaration,
          actualFile,
          errors,
        );
      }
    }
  }
}

function validateFunctionDeclaration(
  file: string,
  expectedFn: FunctionDeclaration,
  actualFile: SourceFile,
  errors: ConformanceError[],
): void {
  const name = expectedFn.getName();
  if (!name) return;

  const actualFn = actualFile
    .getFunctions()
    .find((fn) => fn.getName() === name);

  if (!actualFn) {
    errors.push({
      kind: "missing_function",
      file,
      expected: renderFunctionSignature(expectedFn),
      found: null,
      hint: `Add a function named '${name}' with the matching signature`,
    });
    return;
  }

  validateFunctionSignatures(file, name, expectedFn, actualFn, errors);
  validateNodeComments(file, expectedFn, actualFn, errors);
}

function validateClassDeclaration(
  file: string,
  expectedClass: ClassDeclaration,
  actualFile: SourceFile,
  errors: ConformanceError[],
): void {
  const name = expectedClass.getName();
  if (!name) return;

  const actualClass = actualFile.getClass(name);

  if (!actualClass) {
    errors.push({
      kind: "missing_export",
      file,
      expected: `export class ${name}`,
      found: null,
      hint: `Add an exported class named '${name}'`,
    });
    return;
  }

  validateNodeComments(file, expectedClass, actualClass, errors);
  validateClassMembers(file, name, expectedClass, actualClass, errors);
}

function validateClassMembers(
  file: string,
  className: string,
  expectedClass: ClassDeclaration,
  actualClass: ClassDeclaration,
  errors: ConformanceError[],
): void {
  for (const expectedMethod of expectedClass.getMethods()) {
    const methodName = expectedMethod.getName();
    const actualMethod = actualClass
      .getMethods()
      .find((m) => m.getName() === methodName);

    if (!actualMethod) {
      errors.push({
        kind: "missing_function",
        file,
        expected: `${className}.${methodName}(${renderMethodParams(expectedMethod)})`,
        found: null,
        hint: `Add method '${methodName}' to class '${className}'`,
      });
      continue;
    }

    validateMethodSignatures(
      file,
      `${className}.${methodName}`,
      expectedMethod,
      actualMethod,
      errors,
    );
    validateNodeComments(file, expectedMethod, actualMethod, errors);
  }

  for (const expectedProp of expectedClass.getProperties()) {
    const propName = expectedProp.getName();
    const actualProp = actualClass
      .getProperties()
      .find((p) => p.getName() === propName);

    if (!actualProp) {
      errors.push({
        kind: "missing_export",
        file,
        expected: `${className}.${propName}: ${expectedProp.getType().getText()}`,
        found: null,
        hint: `Add property '${propName}' to class '${className}'`,
      });
    }
  }
}

function validateInterfaceDeclaration(
  file: string,
  expectedInterface: InterfaceDeclaration,
  actualFile: SourceFile,
  errors: ConformanceError[],
): void {
  const name = expectedInterface.getName();
  const actualInterface = actualFile.getInterface(name);

  if (!actualInterface) {
    errors.push({
      kind: "missing_export",
      file,
      expected: `export interface ${name}`,
      found: null,
      hint: `Add an exported interface named '${name}'`,
    });
    return;
  }

  validateNodeComments(file, expectedInterface, actualInterface, errors);

  for (const expectedProp of expectedInterface.getProperties()) {
    const propName = expectedProp.getName();
    const actualProp = actualInterface
      .getProperties()
      .find((p) => p.getName() === propName);

    if (actualProp === undefined) {
      errors.push({
        kind: "missing_key",
        file,
        expected: `${name}.${propName}: ${expectedProp.getType().getText()}`,
        found: null,
        hint: `Add property '${propName}' to interface '${name}'`,
      });
    } else {
      const expectedType = expectedProp.getType().getText();
      const actualType = actualProp.getType().getText();
      if (expectedType !== actualType) {
        errors.push({
          kind: "wrong_signature",
          file,
          expected: `${name}.${propName}: ${expectedType}`,
          found: `${name}.${propName}: ${actualType}`,
          hint: `Change type of '${propName}' in '${name}' to '${expectedType}'`,
        });
      }
    }
  }
}

function validateTypeAliasDeclaration(
  file: string,
  expectedAlias: TypeAliasDeclaration,
  actualFile: SourceFile,
  errors: ConformanceError[],
): void {
  const name = expectedAlias.getName();
  const actualAlias = actualFile.getTypeAlias(name);

  if (!actualAlias) {
    errors.push({
      kind: "missing_export",
      file,
      expected: `export type ${name}`,
      found: null,
      hint: `Add an exported type alias named '${name}'`,
    });
  }
}

function validateFunctionSignatures(
  file: string,
  name: string,
  expectedFn: FunctionDeclaration,
  actualFn: FunctionDeclaration,
  errors: ConformanceError[],
): void {
  const expectedSig = renderFunctionSignature(expectedFn);
  const actualSig = renderFunctionSignature(actualFn);
  if (expectedSig !== actualSig) {
    errors.push({
      kind: "wrong_signature",
      file,
      expected: expectedSig,
      found: actualSig,
      location: getLocation(actualFn),
      hint: `Update function '${name}' to match the expected signature: ${expectedSig}`,
    });
  }
}

function validateMethodSignatures(
  file: string,
  qualifiedName: string,
  expectedMethod: MethodDeclaration,
  actualMethod: MethodDeclaration,
  errors: ConformanceError[],
): void {
  const expectedSig = renderMethodSignature(expectedMethod);
  const actualSig = renderMethodSignature(actualMethod);
  if (expectedSig !== actualSig) {
    errors.push({
      kind: "wrong_signature",
      file,
      expected: `${qualifiedName}(${renderMethodParams(expectedMethod)}): ${expectedMethod.getReturnType().getText()}`,
      found: `${qualifiedName}(${renderMethodParams(actualMethod)}): ${actualMethod.getReturnType().getText()}`,
      location: getLocation(actualMethod),
      hint: `Update method '${qualifiedName}' signature to: ${expectedSig}`,
    });
  }
}

function validateNodeComments(
  file: string,
  expectedNode: Node,
  actualNode: Node,
  errors: ConformanceError[],
): void {
  // Validate JSDoc comments
  const expectedJsDocs = getJsDocTexts(expectedNode);
  const actualJsDocs = getJsDocTexts(actualNode);

  for (const expectedJsDoc of expectedJsDocs) {
    if (isTodoComment(expectedJsDoc)) continue;
    if (!actualJsDocs.includes(expectedJsDoc)) {
      errors.push({
        kind: "missing_comment",
        file,
        expected: `/** ${expectedJsDoc} */`,
        found: actualJsDocs.length > 0 ? `/** ${actualJsDocs[0]} */` : null,
        hint: `Add JSDoc comment '/** ${expectedJsDoc} */' to the declaration`,
      });
    }
  }

  // Validate leading non-JSDoc comments
  const expectedComments = getLeadingNonJsDocComments(expectedNode);
  const actualComments = getLeadingNonJsDocComments(actualNode);

  for (const expectedComment of expectedComments) {
    if (isTodoComment(expectedComment)) continue;
    if (!actualComments.includes(expectedComment)) {
      errors.push({
        kind: "missing_comment",
        file,
        expected: expectedComment,
        found: null,
        hint: `Add the comment '${expectedComment}' before the declaration`,
      });
    }
  }
}

function getJsDocTexts(node: Node): string[] {
  if (!Node.isJSDocable(node)) return [];
  return node.getJsDocs().map((doc) => doc.getDescription().trim());
}

function getLeadingNonJsDocComments(node: Node): string[] {
  const ranges = node.getLeadingCommentRanges();
  return ranges
    .map((range) => range.getText().trim())
    .filter((text) => !text.startsWith("/**") && !text.startsWith("/*"));
}

function isTodoComment(text: string): boolean {
  return text.trimStart().toLowerCase().startsWith("todo");
}

function getLocation(node: Node): { line: number; column: number } {
  const pos = node.getSourceFile().getLineAndColumnAtPos(node.getStart());
  return { line: pos.line, column: pos.column };
}

function renderFunctionSignature(fn: FunctionDeclaration): string {
  const name = fn.getName() ?? "";
  const params = fn
    .getParameters()
    .map((p) => `${p.getName()}: ${p.getType().getText()}`)
    .join(", ");
  const returnType = fn.getReturnType().getText();
  const asyncKw = fn.isAsync() ? "async " : "";
  return `${asyncKw}function ${name}(${params}): ${returnType}`;
}

function renderMethodSignature(method: MethodDeclaration): string {
  return `${method.getName()}(${renderMethodParams(method)}): ${method.getReturnType().getText()}`;
}

function renderMethodParams(
  method: MethodDeclaration | FunctionDeclaration,
): string {
  return method
    .getParameters()
    .map((p) => `${p.getName()}: ${p.getType().getText()}`)
    .join(", ");
}

// Re-export for use in other modules
export type { PropertyDeclaration } from "ts-morph";
