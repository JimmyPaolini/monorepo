import { Module } from "@nestjs/common";

import { <%= namePascalCase %>Service } from "./<%= nameCamelCase %>.service";

/**
 * TODO: Document the <%= nameCamelCase %> module.
 */
@Module({
  controllers: [],
  exports: [<%= namePascalCase %>Service],
  imports: [],
  providers: [<%= namePascalCase %>Service],
})
export class <%= namePascalCase %>Module {}
