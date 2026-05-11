import { Module } from "@nestjs/common";

import { InputService } from "./input.service";

/**
 * Module that encapsulates environment variable validation and domain input parsing.
 *
 * Provides and exports {@link InputService}, which bridges the raw config layer
 * ({@link Env} validated by {@link validateEnv} at bootstrap) and the domain layer
 * (timezone-aware {@link Input} produced by {@link inputSchema}).
 *
 * Depends on `ConfigModule` being globally available (registered in {@link AppModule}).
 */
@Module({
  providers: [InputService],
  exports: [InputService],
})
export class InputModule {}
