import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { describe, expect, it, vi } from "vitest";

import { ReactComponentCommand } from "./react-component.command";
import { generateReactComponent } from "./react-component.utilities";

describe(generateReactComponent, () => {
  it("routes invocation arguments through the command", async () => {
    const tree = createTreeWithEmptyWorkspace();
    const commandSpy = vi
      .spyOn(ReactComponentCommand, "generateReactComponent")
      .mockResolvedValue(undefined);

    await generateReactComponent({
      options: { name: "alert-banner", project: "lexico-components" },
      tree,
    });
    await generateReactComponent(tree);
    await generateReactComponent(tree, {
      name: "status-pill",
      project: "lexico-components",
    });

    expect(commandSpy.mock.calls).toStrictEqual([
      [tree, { name: "alert-banner", project: "lexico-components" }],
      [tree, {}],
      [tree, { name: "status-pill", project: "lexico-components" }],
    ]);

    commandSpy.mockRestore();
  });
});
