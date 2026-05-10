import { Injectable } from "@nestjs/common";
import { Command, CommandRunner } from "nest-commander";

import type { CalendarService } from "./calendar/calendar.service";
import type { InputService } from "./input/input.service";
import type { PerfectiveEventsService } from "./perfective-events/perfective-events.service";
import type { ProgressiveEventsService } from "./progressive-events/progressive-events.service";

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
    private readonly inputService: InputService,
    private readonly perfectiveEventsService: PerfectiveEventsService,
    private readonly progressiveEventsService: ProgressiveEventsService,
    private readonly calendarService: CalendarService,
  ) {
    super();
  }

  /**
   *
   */
  async run(): Promise<void> {
    const input = this.inputService.parse();

    const perfectiveEvents = this.perfectiveEventsService.detect(input);
    const progressiveEvents =
      this.progressiveEventsService.detect(perfectiveEvents);

    const allEvents = [...perfectiveEvents, ...progressiveEvents].toSorted(
      (a, b) => a.start.valueOf() - b.start.valueOf(),
    );

    await this.calendarService.write(allEvents, input);
  }
}
