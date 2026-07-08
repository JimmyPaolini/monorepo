import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { describe, expect, it, vi } from "vitest";

import { NestjsCommandModuleCommand } from "./nestjs-command-module.command";
import { generateNestjsCommandModule } from "./nestjs-command-module.utilities";

describe(generateNestjsCommandModule, () => {
  it("routes invocation arguments through the command", async () => {
    const tree = createTreeWithEmptyWorkspace();
    const callback = (): undefined => undefined;
    const commandSpy = vi
      .spyOn(NestjsCommandModuleCommand, "generateNestjsCommandModule")
      .mockResolvedValue(callback);

    await expect(
      generateNestjsCommandModule({
        options: { name: "alpha-module", project: "my-app" },
        tree,
      }),
    ).resolves.toBe(callback);
    await expect(generateNestjsCommandModule(tree)).resolves.toBe(callback);
    await expect(
      generateNestjsCommandModule(tree, {
        name: "beta-module",
        project: "my-app",
      }),
    ).resolves.toBe(callback);

    expect(commandSpy.mock.calls).toStrictEqual([
      [tree, { name: "alpha-module", project: "my-app" }],
      [tree, {}],
      [tree, { name: "beta-module", project: "my-app" }],
    ]);

    commandSpy.mockRestore();
  });
});
