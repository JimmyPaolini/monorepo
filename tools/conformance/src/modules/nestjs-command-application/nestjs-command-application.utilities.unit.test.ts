import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { describe, expect, it, vi } from "vitest";

import { NestjsCommandApplicationCommand } from "./nestjs-command-application.command";
import { generateNestjsCommandApplication } from "./nestjs-command-application.utilities";

describe(generateNestjsCommandApplication, () => {
  it("routes invocation arguments through the command", async () => {
    const tree = createTreeWithEmptyWorkspace();
    const commandSpy = vi
      .spyOn(
        NestjsCommandApplicationCommand,
        "generateNestjsCommandApplication",
      )
      .mockResolvedValue(undefined);

    await generateNestjsCommandApplication({
      options: { name: "alpha-app" },
      tree,
    });
    await generateNestjsCommandApplication(tree);
    await generateNestjsCommandApplication(tree, { name: "beta-app" });

    expect(commandSpy.mock.calls).toStrictEqual([
      [tree, { name: "alpha-app" }],
      [tree, {}],
      [tree, { name: "beta-app" }],
    ]);

    commandSpy.mockRestore();
  });
});
