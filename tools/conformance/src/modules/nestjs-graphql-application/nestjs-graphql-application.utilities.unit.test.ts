import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { describe, expect, it, vi } from "vitest";

import { NestjsGraphqlApplicationCommand } from "./nestjs-graphql-application.command";
import { generateNestjsGraphqlApplication } from "./nestjs-graphql-application.utilities";

describe(generateNestjsGraphqlApplication, () => {
  it("routes invocation arguments through the command", async () => {
    const tree = createTreeWithEmptyWorkspace();
    const commandSpy = vi
      .spyOn(
        NestjsGraphqlApplicationCommand,
        "generateNestjsGraphqlApplication",
      )
      .mockResolvedValue(undefined);

    await generateNestjsGraphqlApplication({
      options: { name: "alpha-api" },
      tree,
    });
    await generateNestjsGraphqlApplication(tree);
    await generateNestjsGraphqlApplication(tree, { name: "beta-api" });

    expect(commandSpy.mock.calls).toStrictEqual([
      [tree, { name: "alpha-api" }],
      [tree, {}],
      [tree, { name: "beta-api" }],
    ]);

    commandSpy.mockRestore();
  });
});
