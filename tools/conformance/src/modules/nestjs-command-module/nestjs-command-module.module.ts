import { Module } from "@nestjs/common";

import { NestjsCommandModuleCommand } from "./nestjs-command-module.command";

/**
 * TODO: Document the nestjsCommandModuleGenerator module.
 */
@Module({
  controllers: [],
  exports: [NestjsCommandModuleCommand],
  imports: [],
  providers: [NestjsCommandModuleCommand],
})
export class NestjsCommandModuleModule {}
