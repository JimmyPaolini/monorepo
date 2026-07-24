import { Module } from "@nestjs/common";

import { LoggerModule } from "../logger/logger.module";
import { SynchronizationService } from "../synchronization/synchronization.service";

import { AgentSkillsCommand } from "./agent-skills.command";

/**
 * TODO: Document the agentSkills module.
 */
@Module({
  controllers: [],
  exports: [AgentSkillsCommand],
  imports: [LoggerModule],
  providers: [AgentSkillsCommand, SynchronizationService],
})
export class AgentSkillsModule {}
