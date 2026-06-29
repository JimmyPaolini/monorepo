import { Module } from "@nestjs/common";

import { NestjsGraphqlApplicationCommand } from "./nestjs-graphql-application.command";

/**
 * TODO: Document the nestjsGraphqlApplicationGenerator module.
 */
@Module({
  controllers: [],
  exports: [NestjsGraphqlApplicationCommand],
  imports: [],
  providers: [NestjsGraphqlApplicationCommand],
})
export class NestjsGraphqlApplicationModule {}
