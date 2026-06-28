import { Module } from "@nestjs/common";

import { LoggerModule } from "../logger/logger.module";

import { AgentSkillsCommand } from "./agent-skills.command";

/**
 * TODO: Document the agentSkills module.
 */
@Module({
  controllers: [],
  exports: [AgentSkillsCommand],
  imports: [LoggerModule],
  providers: [AgentSkillsCommand],
})
export class AgentSkillsModule {}
