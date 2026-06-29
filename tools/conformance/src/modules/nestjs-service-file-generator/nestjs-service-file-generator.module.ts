import { Module } from "@nestjs/common";

import { NestjsServiceFileGeneratorCommand } from "./nestjs-service-file-generator.command";

/**
 * TODO: Document the nestjsServiceFileGenerator module.
 */
@Module({
  controllers: [],
  exports: [NestjsServiceFileGeneratorCommand],
  imports: [],
  providers: [NestjsServiceFileGeneratorCommand],
})
export class NestjsServiceFileGeneratorModule {}
