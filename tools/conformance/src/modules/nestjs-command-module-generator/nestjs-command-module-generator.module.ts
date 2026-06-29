import { Module } from "@nestjs/common";

import { NestjsCommandModuleGeneratorCommand } from "./nestjs-command-module-generator.command";

/**
 * TODO: Document the nestjsCommandModuleGenerator module.
 */
@Module({
  controllers: [],
  exports: [NestjsCommandModuleGeneratorCommand],
  imports: [],
  providers: [NestjsCommandModuleGeneratorCommand],
})
export class NestjsCommandModuleGeneratorModule {}
