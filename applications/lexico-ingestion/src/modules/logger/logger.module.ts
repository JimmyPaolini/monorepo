import { Global, Module } from "@nestjs/common";

import { LoggerService } from "./logger.service";

/**
 * Global NestJS module that exports `LoggerService` so feature modules can
 * inject contextual logging without re-importing logger wiring.
 */
@Global()
@Module({
  controllers: [],
  exports: [LoggerService],
  imports: [],
  providers: [LoggerService],
})
export class LoggerModule {}
