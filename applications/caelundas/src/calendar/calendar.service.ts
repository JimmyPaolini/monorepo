import { writeFile } from "node:fs/promises";

import { Injectable } from "@nestjs/common";

import { buildCalendarFileContent } from "../calendar.utilities";
import { getOutputPath } from "../output.utilities";

import type { Event } from "../calendar.utilities";
import type { Input } from "../input.schema";

@Injectable()
export class CalendarService {
  async write(events: Event[], input: Input): Promise<void> {
    const timespan = `${input.start.toISOString(true)} to ${input.end.toISOString(true)}`;
    const calendarFilename = `caelundas_${timespan}.ics`;
    const calendarFileContent = buildCalendarFileContent({
      events,
      name: "Caelundas 🔭",
      description: "Astronomical events and celestial phenomena",
      timezone: input.timezone,
    });
    await writeFile(
      getOutputPath(calendarFilename),
      new TextEncoder().encode(calendarFileContent),
    );
    console.log(`✏️ Wrote ${events.length} events to file "${calendarFilename}"`);
  }
}
