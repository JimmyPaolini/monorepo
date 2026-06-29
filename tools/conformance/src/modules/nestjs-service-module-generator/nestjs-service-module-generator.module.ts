import { Module } from "@nestjs/common";

import { NestjsServiceModuleGeneratorCommand } from "./nestjs-service-module-generator.command";

/**
 * TODO: Document the nestjsServiceModuleGenerator module.
 */
@Module({
  controllers: [],
  exports: [NestjsServiceModuleGeneratorCommand],
  imports: [],
  providers: [NestjsServiceModuleGeneratorCommand],
})
export class NestjsServiceModuleGeneratorModule {}
