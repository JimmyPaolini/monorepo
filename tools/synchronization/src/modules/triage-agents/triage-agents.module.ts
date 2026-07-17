import { Module } from "@nestjs/common";

import { LoggerModule } from "../logger/logger.module";
import { SynchronizationModeService } from "../synchronization/synchronization-mode.service";

import { TriageAgentsCommand } from "./triage-agents.command";

/** NestJS module that registers the triage-agents sync command. */
@Module({
  imports: [LoggerModule],
  providers: [TriageAgentsCommand, SynchronizationModeService],
})
export class TriageAgentsModule {}
