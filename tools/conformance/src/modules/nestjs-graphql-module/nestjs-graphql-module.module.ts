import { Module } from "@nestjs/common";

import { NestjsGraphqlModuleCommand } from "./nestjs-graphql-module.command";

/**
 * TODO: Document the nestjsGraphqlModuleGenerator module.
 */
@Module({
  controllers: [],
  exports: [NestjsGraphqlModuleCommand],
  imports: [],
  providers: [NestjsGraphqlModuleCommand],
})
export class NestjsGraphqlModuleModule {}
