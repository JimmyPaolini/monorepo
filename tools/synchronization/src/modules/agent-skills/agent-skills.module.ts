import { Module } from "@nestjs/common";

import { LoggerModule } from "../logger/logger.module";
import { SynchronizationModeService } from "../synchronization/synchronization-mode.service";

import { AgentSkillsCommand } from "./agent-skills.command";

/**
 * TODO: Document the agentSkills module.
 */
@Module({
  controllers: [],
  exports: [AgentSkillsCommand],
  imports: [LoggerModule],
  providers: [AgentSkillsCommand, SynchronizationModeService],
})
export class AgentSkillsModule {}
