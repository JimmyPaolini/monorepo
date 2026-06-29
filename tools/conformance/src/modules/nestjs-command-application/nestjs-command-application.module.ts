import { Module } from "@nestjs/common";

import { NestjsCommandApplicationCommand } from "./nestjs-command-application.command";

/**
 * TODO: Document the nestjsCommandApplicationGenerator module.
 */
@Module({
  controllers: [],
  exports: [NestjsCommandApplicationCommand],
  imports: [],
  providers: [NestjsCommandApplicationCommand],
})
export class NestjsCommandApplicationModule {}
