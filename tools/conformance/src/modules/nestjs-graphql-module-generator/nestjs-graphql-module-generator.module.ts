import { Module } from "@nestjs/common";

import { NestjsGraphqlModuleGeneratorCommand } from "./nestjs-graphql-module-generator.command";

/**
 * TODO: Document the nestjsGraphqlModuleGenerator module.
 */
@Module({
  controllers: [],
  exports: [NestjsGraphqlModuleGeneratorCommand],
  imports: [],
  providers: [NestjsGraphqlModuleGeneratorCommand],
})
export class NestjsGraphqlModuleGeneratorModule {}
