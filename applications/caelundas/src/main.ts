/**
 * Caelundas application entry point - astronomical calendar generator.
 *
 * Pipeline:
 * 1. Validate environment input
 * 2. Retrieve day ephemerides with boundary margins
 * 3. Detect minute-level perfective events (including compound aspects via active aspect snapshots)
 * 4. Synthesize progressive events (simple aspects, compound aspects, ingresses, etc.)
 * 5. Generate iCalendar output
 */

import fs from "node:fs";

import { getCalendar } from "./calendar.utilities";
import { getAllEvents } from "./events.store";
import { inputSchema } from "./input.schema";
import { getOutputPath } from "./output.utilities";
import { detectPerfectiveEvents } from "./perfective.events";
import { detectProgressiveEvents } from "./progressive.events";

/**
 * Executes the full Caelundas generation pipeline for the configured date range.
 */
function main(): void {
  const input = inputSchema.parse({
    latitude: process.env["LATITUDE"],
    longitude: process.env["LONGITUDE"],
    timezone: process.env["TIMEZONE"],
    startDate: process.env["START_DATE"],
    endDate: process.env["END_DATE"],
  });

  console.log(`🔭 Processing input:`, JSON.stringify(input));

  const { end, latitude, longitude, start, timezone } = input;

  const timespan = `${start.toISOString(true)} to ${end.toISOString(true)}`;

  console.log(`⏲️ Detecting perfective events for timespan ${timespan}`);
  const perfectiveEvents = detectPerfectiveEvents({
    start,
    end,
    latitude,
    longitude,
    timezone,
  });
  console.log(`⏲️ Detected perfective events for timespan ${timespan}`);

  console.log(
    `⏳ Detecting progressive events from ${perfectiveEvents.length} perfective events for timespan ${timespan}`,
  );
  const progressiveEvents = detectProgressiveEvents(perfectiveEvents);
  console.log(
    `⏳ Detected ${progressiveEvents.length} progressive events from ${perfectiveEvents.length} perfective events for timespan ${timespan}`,
  );

  const filename = `caelundas_${timespan}.ics`;
  const allEvents = getAllEvents();
  console.log(`✏️ Writing ${allEvents.length} events to ${filename}`);
  const calendar = getCalendar({
    events: allEvents,
    name: "Caelundas 🔭",
    description: "Astronomical events and celestial phenomena",
  });
  fs.writeFileSync(getOutputPath(filename), new TextEncoder().encode(calendar));
  console.log(`✏️ Wrote ${allEvents.length} events to ${filename}`);

  console.log(`🔭 Processed input:`, JSON.stringify(input));

  process.exit(0);
}

main();
