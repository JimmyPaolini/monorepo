import { Module } from "@nestjs/common";

import { NestjsServiceModuleCommand } from "./nestjs-service-module.command";

/**
 * TODO: Document the nestjsServiceModuleGenerator module.
 */
@Module({
  controllers: [],
  exports: [NestjsServiceModuleCommand],
  imports: [],
  providers: [NestjsServiceModuleCommand],
})
export class NestjsServiceModuleModule {}
