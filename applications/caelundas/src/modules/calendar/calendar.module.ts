import { Module } from "@nestjs/common";

import { CalendarService } from "./calendar.service";

/**
 * NestJS module providing calendar generation utilities.
 * Exports {@link CalendarService} for building iCal calendar data from detected events.
 */
@Module({
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}
