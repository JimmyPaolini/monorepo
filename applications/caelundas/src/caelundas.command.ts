import { Injectable } from "@nestjs/common";

import { Command, CommandRunner } from "nest-commander";

import type { CalendarService } from "./calendar/calendar.service";
import type { EventStoreService } from "./event-store/event-store.service";
import { inputSchema } from "./input.schema";
import type { PerfectiveEventsService } from "./perfective-events/perfective-events.service";
import type { ProgressiveEventsService } from "./progressive-events/progressive-events.service";
import type { ConfigService } from "@nestjs/config";

/**
 * CLI entry point that orchestrates the full calendar generation pipeline.
 *
 * Reads observer coordinates and date range from environment variables,
 * runs perfective and progressive event detection in sequence, and writes
 * the result to an `.ics` file via {@link CalendarService}.
 */
@Injectable()
@Command({
  name: "caelundas",
  description: "Generate astronomical calendar events for a date range",
})
export class CaelundasCommand extends CommandRunner {
  constructor(
    private readonly configService: ConfigService,
    private readonly perfectiveEventsService: PerfectiveEventsService,
    private readonly progressiveEventsService: ProgressiveEventsService,
    private readonly calendarService: CalendarService,
    private readonly eventStoreService: EventStoreService,
  ) {
    super();
  }

  /**
   *
   */
  async run(): Promise<void> {
    const input = inputSchema.parse({
      latitude: this.configService.get<string>("LATITUDE"),
      longitude: this.configService.get<string>("LONGITUDE"),
      start: this.configService.get<string>("START_DATE"),
      end: this.configService.get<string>("END_DATE"),
    });

    const perfectiveEvents = this.perfectiveEventsService.detect(input);
    this.eventStoreService.add(perfectiveEvents);

    const progressiveEvents =
      this.progressiveEventsService.detect(perfectiveEvents);
    this.eventStoreService.add(progressiveEvents);

    const allEvents = this.eventStoreService
      .getAll()
      .toSorted((a, b) => a.start.valueOf() - b.start.valueOf());

    await this.calendarService.write(allEvents, input);
  }
}
