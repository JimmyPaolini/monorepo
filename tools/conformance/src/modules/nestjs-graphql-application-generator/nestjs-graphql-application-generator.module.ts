import { Module } from "@nestjs/common";

import { NestjsGraphqlApplicationGeneratorCommand } from "./nestjs-graphql-application-generator.command";

/**
 * TODO: Document the nestjsGraphqlApplicationGenerator module.
 */
@Module({
  controllers: [],
  exports: [NestjsGraphqlApplicationGeneratorCommand],
  imports: [],
  providers: [NestjsGraphqlApplicationGeneratorCommand],
})
export class NestjsGraphqlApplicationGeneratorModule {}
