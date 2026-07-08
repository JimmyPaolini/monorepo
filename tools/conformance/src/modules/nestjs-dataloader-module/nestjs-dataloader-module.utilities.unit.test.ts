import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { describe, expect, it, vi } from "vitest";

import { NestjsDataloaderModuleCommand } from "./nestjs-dataloader-module.command";
import { generateNestjsDataloaderModule } from "./nestjs-dataloader-module.utilities";

describe(generateNestjsDataloaderModule, () => {
  it("routes invocation arguments through the command", async () => {
    const tree = createTreeWithEmptyWorkspace();
    const callback = (): undefined => undefined;
    const commandSpy = vi
      .spyOn(NestjsDataloaderModuleCommand, "generateNestjsDataloaderModule")
      .mockResolvedValue(callback);

    await expect(
      generateNestjsDataloaderModule({
        options: { name: "alpha-loader", project: "my-app" },
        tree,
      }),
    ).resolves.toBe(callback);
    await expect(generateNestjsDataloaderModule(tree)).resolves.toBe(callback);
    await expect(
      generateNestjsDataloaderModule(tree, {
        name: "beta-loader",
        project: "my-app",
      }),
    ).resolves.toBe(callback);

    expect(commandSpy.mock.calls).toStrictEqual([
      [tree, { name: "alpha-loader", project: "my-app" }],
      [tree, {}],
      [tree, { name: "beta-loader", project: "my-app" }],
    ]);

    commandSpy.mockRestore();
  });
});
