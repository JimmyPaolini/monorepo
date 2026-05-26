import mustache from "mustache";
import { createSourceFile, ScriptKind, ScriptTarget } from "typescript";

import { validateDepthFirstSearch } from "./abstract-syntax-tree";

function resolveScriptKind(filename: string): ScriptKind {
  const extension = filename.slice(filename.lastIndexOf("."));
  switch (extension) {
    case ".tsx": {
      return ScriptKind.TSX;
    }
    case ".ts": {
      return ScriptKind.TS;
    }
    case ".jsx": {
      return ScriptKind.JSX;
    }
    case ".mjs": {
      return ScriptKind.JS;
    }
    case ".cjs": {
      return ScriptKind.JS;
    }
    case ".js": {
      return ScriptKind.JS;
    }
    default: {
      return ScriptKind.TS;
    }
  }
}

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
 * Comments are validated in template order via the TypeScript trivia API. TODO
 * comments match loosely (any `// ... TODO ...` line); all others must match
 * exactly.
 *
 * Use this function when `template` and `instance` are already in memory.
 */
export function validateTypescriptConformance(args: {
  data: Record<string, unknown>;
  filename: string;
  instance: string;
  template: string;
}): {
  errors: string[];
} {
  const { instance, template, data, filename } = args;

  const scriptKind = resolveScriptKind(filename);
  const templateFile = createSourceFile(
    filename,
    mustache.render(template, data),
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
