import mustache from "mustache";
import {
  createSourceFile,
  ScriptKind,
  ScriptTarget,
  type SourceFile,
} from "typescript";

import { validateDepthFirstSearch } from "./abstract-syntax-tree";
import { validateAllComments } from "./comments";

import type {
  ConformanceError,
  ConformanceErrorLanguage,
} from "./validator.types";

/**
 * Validates that a generated TypeScript file is a structural superset of its
 * Mustache template by comparing their parsed ASTs node-by-node.
 *
 * The template is first rendered with data via Mustache, then both the rendered
 * template and instance are parsed into TypeScript ASTs. A depth-first walk
 * checks that every node in the template exists somewhere in the instance at
 * the same depth (superset, not equality — the instance may contain extra nodes
 * not present in the template). Type annotations, decorator arguments, import
 * specifiers, and named declarations are all checked; empty method bodies and
 * array literals are not (recursion stops where the template has no children).
 *
 * Comments are validated in template order. TODO comments match loosely
 * (any `// ... TODO ...` line); all others must match exactly.
 *
 * Use this function when `template` and `instance` are already in memory.
 */
export function validateTypescriptConformance(args: {
  data: Record<string, unknown>;
  filename: string;
  instance: string;
  template: string;
}): {
  errors: ConformanceError[];
} {
  const { data, filename, instance, template } = args;

  const scriptKind = resolveScriptKind(filename);
  const language = resolveLanguage(filename);
  const renderedTemplate = mustache.render(template, data);
  const templateFile = parseSourceFile(filename, renderedTemplate, scriptKind);
  const instanceFile = parseSourceFile(filename, instance, scriptKind);

  const errors = validateDepthFirstSearch({
    instanceFile,
    instanceNode: instanceFile,
    language,
    templateNode: templateFile,
  });

  const commentErrors = validateAllComments({
    instanceFile,
    language,
    templateFile,
  });

  return { errors: [...errors, ...commentErrors] };
}

/**
 * Parse source file.
 */
function parseSourceFile(
  filename: string,
  content: string,
  scriptKind: ScriptKind,
): SourceFile {
  return createSourceFile(
    filename,
    content,
    ScriptTarget.Latest,
    true,
    scriptKind,
  );
}

/**
 * Resolve language.
 */
function resolveLanguage(filename: string): ConformanceErrorLanguage {
  const extension = filename.slice(filename.lastIndexOf("."));
  switch (extension) {
    case ".cjs":
    case ".js":
    case ".jsx":
    case ".mjs": {
      return "javascript";
    }
    case ".ts":
    case ".tsx": {
      return "typescript";
    }
    default: {
      return "typescript";
    }
  }
}

/**
 * Resolve script kind.
 */
function resolveScriptKind(filename: string): ScriptKind {
  const extension = filename.slice(filename.lastIndexOf("."));
  switch (extension) {
    case ".cjs": {
      return ScriptKind.JS;
    }
    case ".js": {
      return ScriptKind.JS;
    }
    case ".jsx": {
      return ScriptKind.JSX;
    }
    case ".mjs": {
      return ScriptKind.JS;
    }
    case ".ts": {
      return ScriptKind.TS;
    }
    case ".tsx": {
      return ScriptKind.TSX;
    }
    default: {
      return ScriptKind.TS;
    }
  }
}
