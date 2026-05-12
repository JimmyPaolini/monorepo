import { Module } from "@nestjs/common";

import { MathService } from "./math.service";

/**
 * NestJS module providing mathematical utility functions.
 * Exports {@link MathService} for angular math, interpolation, and related calculations.
 */
@Module({
  providers: [MathService],
  exports: [MathService],
})
export class MathModule {}
