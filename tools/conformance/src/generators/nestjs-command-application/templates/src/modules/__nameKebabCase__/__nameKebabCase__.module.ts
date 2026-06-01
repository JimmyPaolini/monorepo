import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { LoggerModule } from "../logger/logger.module";
import { SampleModule } from "../sample/sample.module";
import { {{namePascalCase}}Command } from "./{{nameKebabCase}}.command";
import { environmentSchema } from "./{{nameKebabCase}}.constants";

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
    LoggerModule,
    SampleModule,
  ],
  providers: [{{namePascalCase}}Command],
})
export class {{namePascalCase}}Module {}
