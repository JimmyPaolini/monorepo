import { Module } from "@nestjs/common";

import { NestjsCommandApplicationGeneratorCommand } from "./nestjs-command-application-generator.command";

/**
 * TODO: Document the nestjsCommandApplicationGenerator module.
 */
@Module({
  controllers: [],
  exports: [NestjsCommandApplicationGeneratorCommand],
  imports: [],
  providers: [NestjsCommandApplicationGeneratorCommand],
})
export class NestjsCommandApplicationGeneratorModule {}
