import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { {{namePascalCase}}Command } from "./{{nameCamelCase}}.command";
import { environmentSchema } from "./{{nameCamelCase}}.constants";

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
  ],
  providers: [{{namePascalCase}}Command],
})
export class {{namePascalCase}}Module {}
