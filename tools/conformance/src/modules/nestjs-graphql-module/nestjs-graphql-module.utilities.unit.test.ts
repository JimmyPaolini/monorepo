import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { describe, expect, it, vi } from "vitest";

import { NestjsGraphqlModuleCommand } from "./nestjs-graphql-module.command";
import { generateNestjsGraphqlModule } from "./nestjs-graphql-module.utilities";

describe(generateNestjsGraphqlModule, () => {
  it("routes invocation arguments through the command", async () => {
    const tree = createTreeWithEmptyWorkspace();
    const callback = (): undefined => undefined;
    const commandSpy = vi
      .spyOn(NestjsGraphqlModuleCommand, "generateNestjsGraphqlModule")
      .mockResolvedValue(callback);

    await expect(
      generateNestjsGraphqlModule({
        options: { name: "alpha-graphql", project: "my-app" },
        tree,
      }),
    ).resolves.toBe(callback);
    await expect(generateNestjsGraphqlModule(tree)).resolves.toBe(callback);
    await expect(
      generateNestjsGraphqlModule(tree, {
        name: "beta-graphql",
        project: "my-app",
      }),
    ).resolves.toBe(callback);

    expect(commandSpy.mock.calls).toStrictEqual([
      [tree, { name: "alpha-graphql", project: "my-app" }],
      [tree, {}],
      [tree, { name: "beta-graphql", project: "my-app" }],
    ]);

    commandSpy.mockRestore();
  });
});
