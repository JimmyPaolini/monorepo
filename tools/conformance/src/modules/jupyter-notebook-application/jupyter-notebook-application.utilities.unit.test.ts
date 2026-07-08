import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { describe, expect, it, vi } from "vitest";

import { JupyterNotebookApplicationCommand } from "./jupyter-notebook-application.command";
import { generateJupyterNotebookApplication } from "./jupyter-notebook-application.utilities";

describe(generateJupyterNotebookApplication, () => {
  it("routes invocation arguments through the command", async () => {
    const tree = createTreeWithEmptyWorkspace();
    const commandSpy = vi
      .spyOn(
        JupyterNotebookApplicationCommand,
        "generateJupyterNotebookApplication",
      )
      .mockResolvedValue(undefined);

    await generateJupyterNotebookApplication({
      options: { name: "alpha-notebook" },
      tree,
    });
    await generateJupyterNotebookApplication(tree);
    await generateJupyterNotebookApplication(tree, { name: "beta-notebook" });

    expect(commandSpy.mock.calls).toStrictEqual([
      [tree, { name: "alpha-notebook" }],
      [tree, {}],
      [tree, { name: "beta-notebook" }],
    ]);

    commandSpy.mockRestore();
  });
});
