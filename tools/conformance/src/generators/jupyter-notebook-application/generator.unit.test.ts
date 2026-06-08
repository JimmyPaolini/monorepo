import path from "node:path";

import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { beforeEach, describe, expect, it } from "vitest";

import { generateJupyterNotebookApplication } from "./generator";

import type { Tree } from "@nx/devkit";

describe("generateJupyterNotebookApplication", () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it("creates expected files under applications/<name>", async () => {
    await generateJupyterNotebookApplication(tree, { name: "daily-notebook" });

    const appRoot = path.join("applications", "daily-notebook");

    expect(tree.exists(path.join(appRoot, "project.json"))).toBe(true);
    expect(tree.exists(path.join(appRoot, "pyproject.toml"))).toBe(true);
    expect(tree.exists(path.join(appRoot, ".gitignore"))).toBe(true);
    expect(tree.exists(path.join(appRoot, "README.md"))).toBe(true);
    expect(tree.exists(path.join(appRoot, "src", "__init__.py"))).toBe(true);
    expect(tree.exists(path.join(appRoot, "src", "models.py"))).toBe(true);
    expect(tree.exists(path.join(appRoot, "src", "notebook.ipynb"))).toBe(true);
    expect(tree.exists(path.join(appRoot, "testing", "__init__.py"))).toBe(
      true,
    );
  });

  it("uses provided description in pyproject.toml", async () => {
    await generateJupyterNotebookApplication(tree, {
      description: "My custom notebook app",
      name: "daily-notebook",
    });

    const pyproject = tree.read(
      path.join("applications", "daily-notebook", "pyproject.toml"),
      "utf8",
    );

    expect(pyproject).toContain('description = "My custom notebook app"');
  });
});
