import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { describe, expect, it, vi } from "vitest";

import { NestjsServiceFileCommand } from "./nestjs-service-file.command";
import { generateNestjsServiceFile } from "./nestjs-service-file.utilities";

describe(generateNestjsServiceFile, () => {
  it("routes invocation arguments through the command", async () => {
    const tree = createTreeWithEmptyWorkspace();
    const callback = (): undefined => undefined;
    const commandSpy = vi
      .spyOn(NestjsServiceFileCommand, "generateNestjsServiceFile")
      .mockResolvedValue(callback);

    await expect(
      generateNestjsServiceFile({
        options: {
          module: "alpha",
          name: "alpha-service",
          project: "my-app",
        },
        tree,
      }),
    ).resolves.toBe(callback);
    await expect(generateNestjsServiceFile(tree)).resolves.toBe(callback);
    await expect(
      generateNestjsServiceFile(tree, {
        module: "beta",
        name: "beta-service",
        project: "my-app",
      }),
    ).resolves.toBe(callback);

    expect(commandSpy.mock.calls).toStrictEqual([
      [tree, { module: "alpha", name: "alpha-service", project: "my-app" }],
      [tree, {}],
      [tree, { module: "beta", name: "beta-service", project: "my-app" }],
    ]);

    commandSpy.mockRestore();
  });
});
