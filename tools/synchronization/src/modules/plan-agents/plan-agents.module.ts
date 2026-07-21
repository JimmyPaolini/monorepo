import { Module } from "@nestjs/common";

import { LoggerModule } from "../logger/logger.module";
import { SynchronizationModeService } from "../synchronization/synchronization-mode.service";

import { PlanAgentsCommand } from "./plan-agents.command";

/** NestJS module that registers the plan-agents sync command. */
@Module({
  imports: [LoggerModule],
  providers: [PlanAgentsCommand, SynchronizationModeService],
})
export class PlanAgentsModule {}
