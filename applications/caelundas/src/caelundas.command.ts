import { Inject, Injectable } from "@nestjs/common";
import { Command, CommandRunner } from "nest-commander";

import { CalendarService } from "./modules/calendar/calendar.service";
import { InputService } from "./modules/input/input.service";
import { PerfectiveService } from "./modules/perfective/perfective.service";
import { ProgressiveService } from "./modules/progressive/progressive.service";

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
    @Inject(InputService)
    private readonly inputService: InputService,
    @Inject(PerfectiveService)
    private readonly perfectiveEventsService: PerfectiveService,
    @Inject(ProgressiveService)
    private readonly progressiveEventsService: ProgressiveService,
    @Inject(CalendarService)
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
