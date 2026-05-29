import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { {{namePascalCase}}Command } from "./{{nameKebabCase}}.command";
import { environmentSchema } from "./{{nameKebabCase}}.constants";
import { SampleModule } from "./modules/sample/sample.module";

/**
 * Root NestJS application module.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ".env",
      isGlobal: true,
      validate: (config: Record<string, unknown>) =>
        environmentSchema.parse(config),
    }),
    SampleModule,
  ],
  providers: [{{namePascalCase}}Command],
})
export class {{namePascalCase}}Module {}
