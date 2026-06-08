import { Resolver } from "@nestjs/graphql";

import { {{namePascalCase}}DataLoader } from "./{{nameKebabCase}}.dataloader";
import { {{namePascalCase}}Entity } from "./{{nameKebabCase}}.entities";
import { {{namePascalCase}}Service } from "./{{nameKebabCase}}.service";

/**
 * TODO: Document the {{nameCamelCase}} resolver.
 */
@Resolver(() => {{namePascalCase}}Entity)
export class {{namePascalCase}}Resolver {
  // 🏗 Dependency Injection

  constructor(
    private readonly {{nameCamelCase}}DataLoader: {{namePascalCase}}DataLoader,
    private readonly {{nameCamelCase}}Service: {{namePascalCase}}Service,
  ) {}

  // 🔎 Queries

  // 🖋️ Mutations

  // 🔗 Relations
}
