import { describe, expect, it } from "vitest";

import { MainModule } from "../main.module";

import { JupyterNotebookApplicationModule } from "./jupyter-notebook-application/jupyter-notebook-application.module";
import { LoggerModule } from "./logger/logger.module";
import { NestjsCommandApplicationModule } from "./nestjs-command-application/nestjs-command-application.module";
import { NestjsCommandModuleModule } from "./nestjs-command-module/nestjs-command-module.module";
import { NestjsDataloaderModuleModule } from "./nestjs-dataloader-module/nestjs-dataloader-module.module";
import { NestjsGraphqlApplicationModule } from "./nestjs-graphql-application/nestjs-graphql-application.module";
import { NestjsGraphqlModuleModule } from "./nestjs-graphql-module/nestjs-graphql-module.module";
import { NestjsServiceFileModule } from "./nestjs-service-file/nestjs-service-file.module";
import { NestjsServiceModuleModule } from "./nestjs-service-module/nestjs-service-module.module";
import { ReactComponentModule } from "./react-component/react-component.module";
import { ValidatorModule } from "./validator/validator.module";

describe("module wiring", () => {
  it("instantiates all generator and validator modules", () => {
    expect(new MainModule()).toBeDefined();
    expect(new LoggerModule()).toBeDefined();
    expect(new JupyterNotebookApplicationModule()).toBeDefined();
    expect(new NestjsCommandApplicationModule()).toBeDefined();
    expect(new NestjsCommandModuleModule()).toBeDefined();
    expect(new NestjsDataloaderModuleModule()).toBeDefined();
    expect(new NestjsGraphqlApplicationModule()).toBeDefined();
    expect(new NestjsGraphqlModuleModule()).toBeDefined();
    expect(new NestjsServiceFileModule()).toBeDefined();
    expect(new NestjsServiceModuleModule()).toBeDefined();
    expect(new ReactComponentModule()).toBeDefined();
    expect(new ValidatorModule()).toBeDefined();
  });
});
