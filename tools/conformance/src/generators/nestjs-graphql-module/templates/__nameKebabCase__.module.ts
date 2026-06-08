import { Module } from "@nestjs/common";

import { {{namePascalCase}}DataLoader } from "./{{nameKebabCase}}.dataloader";
import { {{namePascalCase}}Resolver } from "./{{nameKebabCase}}.resolver";
import { {{namePascalCase}}Service } from "./{{nameKebabCase}}.service";

/**
 * TODO: Document the {{nameCamelCase}} module.
 */
@Module({
  exports: [{{namePascalCase}}DataLoader, {{namePascalCase}}Service],
  imports: [],
  providers: [
    {{namePascalCase}}DataLoader,
    {{namePascalCase}}Resolver,
    {{namePascalCase}}Service,
  ],
})
export class {{namePascalCase}}Module {}
