import { Module } from "@nestjs/common";

import { NestjsServiceFileCommand } from "./nestjs-service-file.command";

/**
 * TODO: Document the nestjsServiceFileGenerator module.
 */
@Module({
  controllers: [],
  exports: [NestjsServiceFileCommand],
  imports: [],
  providers: [NestjsServiceFileCommand],
})
export class NestjsServiceFileModule {}
