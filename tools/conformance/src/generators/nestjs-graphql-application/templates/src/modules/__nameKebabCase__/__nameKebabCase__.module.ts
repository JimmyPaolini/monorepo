import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver } from "@nestjs/apollo";

import type { ApolloDriverConfig } from "@nestjs/apollo";

import { LoggerModule } from "../logger/logger.module";
import { SampleModule } from "../sample/sample.module";
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
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      sortSchema: true,
      playground: process.env["NODE_ENV"] !== "production",
    }),
    LoggerModule,
    SampleModule,
  ],
})
export class {{namePascalCase}}Module {}
