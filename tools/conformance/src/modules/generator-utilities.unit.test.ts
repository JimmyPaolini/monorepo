import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { describe, expect, it, vi } from "vitest";

import { JupyterNotebookApplicationCommand } from "./jupyter-notebook-application/jupyter-notebook-application.command";
import { generateJupyterNotebookApplication } from "./jupyter-notebook-application/jupyter-notebook-application.utilities";
import { NestjsCommandApplicationCommand } from "./nestjs-command-application/nestjs-command-application.command";
import { generateNestjsCommandApplication } from "./nestjs-command-application/nestjs-command-application.utilities";
import { NestjsCommandModuleCommand } from "./nestjs-command-module/nestjs-command-module.command";
import { generateNestjsCommandModule } from "./nestjs-command-module/nestjs-command-module.utilities";
import { NestjsDataloaderModuleCommand } from "./nestjs-dataloader-module/nestjs-dataloader-module.command";
import { generateNestjsDataloaderModule } from "./nestjs-dataloader-module/nestjs-dataloader-module.utilities";
import { NestjsGraphqlApplicationCommand } from "./nestjs-graphql-application/nestjs-graphql-application.command";
import { generateNestjsGraphqlApplication } from "./nestjs-graphql-application/nestjs-graphql-application.utilities";
import { NestjsGraphqlModuleCommand } from "./nestjs-graphql-module/nestjs-graphql-module.command";
import { generateNestjsGraphqlModule } from "./nestjs-graphql-module/nestjs-graphql-module.utilities";
import { NestjsServiceFileCommand } from "./nestjs-service-file/nestjs-service-file.command";
import { generateNestjsServiceFile } from "./nestjs-service-file/nestjs-service-file.utilities";
import { NestjsServiceModuleCommand } from "./nestjs-service-module/nestjs-service-module.command";
import { generateNestjsServiceModule } from "./nestjs-service-module/nestjs-service-module.utilities";
import { ReactComponentCommand } from "./react-component/react-component.command";
import { generateReactComponent } from "./react-component/react-component.utilities";

import type { GeneratorCallback } from "@nx/devkit";

describe("generator utility wrappers", () => {
  it("routes void wrappers through all invocation paths", async () => {
    const tree = createTreeWithEmptyWorkspace();

    const jupyterSpy = vi
      .spyOn(
        JupyterNotebookApplicationCommand,
        "generateJupyterNotebookApplication",
      )
      .mockResolvedValue(undefined);
    const commandApplicationSpy = vi
      .spyOn(
        NestjsCommandApplicationCommand,
        "generateNestjsCommandApplication",
      )
      .mockResolvedValue(undefined);
    const graphqlApplicationSpy = vi
      .spyOn(
        NestjsGraphqlApplicationCommand,
        "generateNestjsGraphqlApplication",
      )
      .mockResolvedValue(undefined);
    const reactComponentSpy = vi
      .spyOn(ReactComponentCommand, "generateReactComponent")
      .mockResolvedValue(undefined);

    await generateJupyterNotebookApplication({
      options: { name: "alpha-notebook" },
      tree,
    });
    await generateJupyterNotebookApplication(tree);
    await generateJupyterNotebookApplication(tree, { name: "beta-notebook" });

    await generateNestjsCommandApplication({
      options: { name: "alpha-app" },
      tree,
    });
    await generateNestjsCommandApplication(tree);
    await generateNestjsCommandApplication(tree, { name: "beta-app" });

    await generateNestjsGraphqlApplication({
      options: { name: "alpha-api" },
      tree,
    });
    await generateNestjsGraphqlApplication(tree);
    await generateNestjsGraphqlApplication(tree, { name: "beta-api" });

    await generateReactComponent({
      options: { name: "alert-banner", project: "lexico-components" },
      tree,
    });
    await generateReactComponent(tree);
    await generateReactComponent(tree, {
      name: "status-pill",
      project: "lexico-components",
    });

    expect(jupyterSpy.mock.calls).toStrictEqual([
      [tree, { name: "alpha-notebook" }],
      [tree, {}],
      [tree, { name: "beta-notebook" }],
    ]);
    expect(commandApplicationSpy.mock.calls).toStrictEqual([
      [tree, { name: "alpha-app" }],
      [tree, {}],
      [tree, { name: "beta-app" }],
    ]);
    expect(graphqlApplicationSpy.mock.calls).toStrictEqual([
      [tree, { name: "alpha-api" }],
      [tree, {}],
      [tree, { name: "beta-api" }],
    ]);
    expect(reactComponentSpy.mock.calls).toStrictEqual([
      [tree, { name: "alert-banner", project: "lexico-components" }],
      [tree, {}],
      [tree, { name: "status-pill", project: "lexico-components" }],
    ]);

    jupyterSpy.mockRestore();
    commandApplicationSpy.mockRestore();
    graphqlApplicationSpy.mockRestore();
    reactComponentSpy.mockRestore();
  });

  it("routes callback wrappers through all invocation paths", async () => {
    const tree = createTreeWithEmptyWorkspace();
    const callback: GeneratorCallback = () => undefined;

    const commandModuleSpy = vi
      .spyOn(NestjsCommandModuleCommand, "generateNestjsCommandModule")
      .mockResolvedValue(callback);
    const dataloaderModuleSpy = vi
      .spyOn(NestjsDataloaderModuleCommand, "generateNestjsDataloaderModule")
      .mockResolvedValue(callback);
    const graphqlModuleSpy = vi
      .spyOn(NestjsGraphqlModuleCommand, "generateNestjsGraphqlModule")
      .mockResolvedValue(callback);
    const serviceFileSpy = vi
      .spyOn(NestjsServiceFileCommand, "generateNestjsServiceFile")
      .mockResolvedValue(callback);
    const serviceModuleSpy = vi
      .spyOn(NestjsServiceModuleCommand, "generateNestjsServiceModule")
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

    await expect(
      generateNestjsServiceFile({
        options: { module: "alpha", name: "alpha-service", project: "my-app" },
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

    expect(commandModuleSpy.mock.calls).toStrictEqual([
      [tree, { name: "alpha-module", project: "my-app" }],
      [tree, {}],
      [tree, { name: "beta-module", project: "my-app" }],
    ]);
    expect(dataloaderModuleSpy.mock.calls).toStrictEqual([
      [tree, { name: "alpha-loader", project: "my-app" }],
      [tree, {}],
      [tree, { name: "beta-loader", project: "my-app" }],
    ]);
    expect(graphqlModuleSpy.mock.calls).toStrictEqual([
      [tree, { name: "alpha-graphql", project: "my-app" }],
      [tree, {}],
      [tree, { name: "beta-graphql", project: "my-app" }],
    ]);
    expect(serviceFileSpy.mock.calls).toStrictEqual([
      [tree, { module: "alpha", name: "alpha-service", project: "my-app" }],
      [tree, {}],
      [tree, { module: "beta", name: "beta-service", project: "my-app" }],
    ]);
    expect(serviceModuleSpy.mock.calls).toStrictEqual([
      [tree, { name: "alpha-service", project: "my-app" }],
      [tree, {}],
      [tree, { name: "beta-service", project: "my-app" }],
    ]);

    commandModuleSpy.mockRestore();
    dataloaderModuleSpy.mockRestore();
    graphqlModuleSpy.mockRestore();
    serviceFileSpy.mockRestore();
    serviceModuleSpy.mockRestore();
  });
});
