import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Command, CommandRunner } from "nest-commander";

import { CalendarService } from "./calendar/calendar.service";
import { EventStoreService } from "./event-store/event-store.service";
import { inputSchema } from "./input.schema";
import { PerfectiveEventsService } from "./perfective-events/perfective-events.service";
import { ProgressiveEventsService } from "./progressive-events/progressive-events.service";

/**
 *
 */
/**
 *
 */
@Injectable()
@Command({ name: "caelundas", description: "Generate astronomical calendar events for a date range" })
export class CaelundasCommand extends CommandRunner {
  constructor(
    private readonly configService: ConfigService,
    private readonly perfectiveEventsService: PerfectiveEventsService,
    private readonly progressiveEventsService: ProgressiveEventsService,
    private readonly calendarService: CalendarService,
    private readonly eventStoreService: EventStoreService,
  ) {
    super/**
   *
   */
  ();
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

    const progressiveEvents = this.progressiveEventsService.detect(perfectiveEvents);
    this.eventStoreService.add(progressiveEvents);

    const allEvents = this.eventStoreService
      .getAll()
      .toSorted((a, b) => a.start.valueOf() - b.start.valueOf());

    await this.calendarService.write(allEvents, input);
  }
}
