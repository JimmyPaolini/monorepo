import { Module } from "@nestjs/common";

import { {{namePascal}}Service } from "./{{nameCamel}}.service";

/**
 * TODO: Document the {{nameCamel}} module.
 */
@Module({
  controllers: [],
  exports: [{{namePascal}}Service],
  imports: [],
  providers: [{{namePascal}}Service],
})
export class {{namePascal}}Module {}
