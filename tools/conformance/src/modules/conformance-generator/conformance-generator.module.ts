import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DiscoveryModule } from "@nestjs/core";

import { JupyterNotebookApplicationGeneratorModule } from "../jupyter-notebook-application-generator/jupyter-notebook-application-generator.module";
import { LoggerModule } from "../logger/logger.module";
import { NestjsCommandApplicationGeneratorModule } from "../nestjs-command-application-generator/nestjs-command-application-generator.module";
import { NestjsCommandModuleGeneratorModule } from "../nestjs-command-module-generator/nestjs-command-module-generator.module";
import { NestjsDataloaderModuleGeneratorModule } from "../nestjs-dataloader-module-generator/nestjs-dataloader-module-generator.module";
import { NestjsGraphqlApplicationGeneratorModule } from "../nestjs-graphql-application-generator/nestjs-graphql-application-generator.module";
import { NestjsGraphqlModuleGeneratorModule } from "../nestjs-graphql-module-generator/nestjs-graphql-module-generator.module";
import { NestjsServiceFileGeneratorModule } from "../nestjs-service-file-generator/nestjs-service-file-generator.module";
import { NestjsServiceModuleGeneratorModule } from "../nestjs-service-module-generator/nestjs-service-module-generator.module";
import { ReactComponentGeneratorModule } from "../react-component-generator/react-component-generator.module";
import { ValidatorModule } from "../validator/validator.module";

import { ConformanceGeneratorCommand } from "./conformance-generator.command";
import { environmentSchema } from "./conformance-generator.constants";

/**
 * Root NestJS application module.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ".env",
      isGlobal: true,
      validate: (config: Record<string, unknown>) =>
        environmentSchema.parse(config),
    }),
    DiscoveryModule,
    LoggerModule,
    JupyterNotebookApplicationGeneratorModule,
    NestjsCommandApplicationGeneratorModule,
    NestjsCommandModuleGeneratorModule,
    NestjsDataloaderModuleGeneratorModule,
    NestjsGraphqlApplicationGeneratorModule,
    NestjsGraphqlModuleGeneratorModule,
    NestjsServiceFileGeneratorModule,
    NestjsServiceModuleGeneratorModule,
    ReactComponentGeneratorModule,
    ValidatorModule,
  ],
  providers: [ConformanceGeneratorCommand],
})
export class ConformanceGeneratorModule {}
