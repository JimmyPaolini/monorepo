import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AgentSkillsModule } from "../agent-skills/agent-skills.module";
import { ConformanceGeneratorsModule } from "../conformance-generators/conformance-generators.module";
import { ConventionalConfigModule } from "../conventional-config/conventional-config.module";
import { DevcontainerConfigurationModule } from "../devcontainer-configuration/devcontainer-configuration.module";
import { LoggerModule } from "../logger/logger.module";
import { PullRequestTemplateModule } from "../pull-request-template/pull-request-template.module";

import { environmentSchema } from "./synchronization.constants";
import { SynchronizationService } from "./synchronization.service";

/**
 * Root NestJS application module.
 */
@Module({
  controllers: [],
  exports: [SynchronizationService],
  imports: [
    ConfigModule.forRoot({
      envFilePath: ".env",
      isGlobal: true,
      validate: (config: Record<string, unknown>) =>
        environmentSchema.parse(config),
    }),
    LoggerModule,
    AgentSkillsModule,
    ConformanceGeneratorsModule,
    ConventionalConfigModule,
    DevcontainerConfigurationModule,
    PullRequestTemplateModule,
  ],
  providers: [SynchronizationService],
})
export class SynchronizationModule {}
