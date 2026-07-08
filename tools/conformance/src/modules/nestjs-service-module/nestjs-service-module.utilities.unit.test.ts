import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { describe, expect, it, vi } from "vitest";

import { NestjsServiceModuleCommand } from "./nestjs-service-module.command";
import { generateNestjsServiceModule } from "./nestjs-service-module.utilities";

describe(generateNestjsServiceModule, () => {
  it("routes invocation arguments through the command", async () => {
    const tree = createTreeWithEmptyWorkspace();
    const callback = (): undefined => undefined;
    const commandSpy = vi
      .spyOn(NestjsServiceModuleCommand, "generateNestjsServiceModule")
      .mockResolvedValue(callback);

    await expect(
      generateNestjsServiceModule({
        options: { name: "alpha-service", project: "my-app" },
        tree,
      }),
    ).resolves.toBe(callback);
    await expect(generateNestjsServiceModule(tree)).resolves.toBe(callback);
    await expect(
      generateNestjsServiceModule(tree, {
        name: "beta-service",
        project: "my-app",
      }),
    ).resolves.toBe(callback);

    expect(commandSpy.mock.calls).toStrictEqual([
      [tree, { name: "alpha-service", project: "my-app" }],
      [tree, {}],
      [tree, { name: "beta-service", project: "my-app" }],
    ]);

    commandSpy.mockRestore();
  });
});
