import { addProjectConfiguration } from "@nx/devkit";
import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { beforeEach, describe, expect, it } from "vitest";

import { generateComponent } from "./generator";

import type { Tree } from "@nx/devkit";

const PROJECT_NAME = "my-app";
const PROJECT_ROOT = "applications/my-app";
const COMPONENTS_DIR = `${PROJECT_ROOT}/src/components`;

describe("generateComponent", () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    addProjectConfiguration(tree, PROJECT_NAME, {
      root: PROJECT_ROOT,
      tags: ["framework:react"],
    });
    tree.write(`${COMPONENTS_DIR}/.gitkeep`, "");
  });

  describe("file generation", () => {
    it("should generate component and test files under src/components", async () => {
      await generateComponent(tree, {
        name: "button",
        project: PROJECT_NAME,
      });

      expect(tree.exists(`${COMPONENTS_DIR}/Button.tsx`)).toBeTruthy();
      expect(tree.exists(`${COMPONENTS_DIR}/Button.test.tsx`)).toBeTruthy();
    });

    it("should use PascalCase component name in generated component file", async () => {
      await generateComponent(tree, {
        name: "button",
        project: PROJECT_NAME,
      });

      const componentContent = tree.read(
        `${COMPONENTS_DIR}/Button.tsx`,
        "utf8",
      );
      expect(componentContent).toContain("ButtonProps");
      expect(componentContent).toContain("export const Button");
    });

    it("should use PascalCase component name in generated test file", async () => {
      await generateComponent(tree, {
        name: "button",
        project: PROJECT_NAME,
      });

      const testContent = tree.read(
        `${COMPONENTS_DIR}/Button.test.tsx`,
        "utf8",
      );
      expect(testContent).toContain("Button");
      expect(testContent).toContain("ButtonProps");
    });

    it("should use PascalCase for file names", async () => {
      await generateComponent(tree, {
        name: "my-button",
        project: PROJECT_NAME,
      });

      expect(tree.exists(`${COMPONENTS_DIR}/MyButton.tsx`)).toBeTruthy();
      expect(tree.exists(`${COMPONENTS_DIR}/MyButton.test.tsx`)).toBeTruthy();
    });
  });

  describe("name validation", () => {
    it("should throw when name is PascalCase", async () => {
      await expect(
        generateComponent(tree, {
          name: "Button",
          project: PROJECT_NAME,
        }),
      ).rejects.toThrow(
        'Component name "Button" must be in kebab-case. Did you mean "button"?',
      );
    });

    it("should throw when name is camelCase", async () => {
      await expect(
        generateComponent(tree, {
          name: "myButton",
          project: PROJECT_NAME,
        }),
      ).rejects.toThrow(
        'Component name "myButton" must be in kebab-case. Did you mean "my-button"?',
      );
    });
  });

  describe("project selection", () => {
    it("should throw when no framework:react projects exist in the workspace", async () => {
      const emptyTree = createTreeWithEmptyWorkspace();
      addProjectConfiguration(emptyTree, "no-tag-app", {
        root: "applications/no-tag-app",
        tags: ["language:typescript"],
      });

      await expect(
        generateComponent(emptyTree, {
          name: "button",
          project: "no-tag-app",
        }),
      ).rejects.toThrow(
        'No projects with tag "framework:react" found in the workspace',
      );
    });

    it("should throw when specified project does not have the framework:react tag", async () => {
      addProjectConfiguration(tree, "non-react-app", {
        root: "applications/non-react-app",
        tags: ["language:typescript"],
      });

      await expect(
        generateComponent(tree, {
          name: "button",
          project: "non-react-app",
        }),
      ).rejects.toThrow(
        'Project "non-react-app" does not have the "framework:react" tag.',
      );
    });

    it("should throw when src/components directory does not exist in the project", async () => {
      addProjectConfiguration(tree, "react-no-components", {
        root: "applications/react-no-components",
        tags: ["framework:react"],
      });

      await expect(
        generateComponent(tree, {
          name: "button",
          project: "react-no-components",
        }),
      ).rejects.toThrow(
        'Directory "applications/react-no-components/src/components" does not exist in project "react-no-components"',
      );
    });
  });
});
