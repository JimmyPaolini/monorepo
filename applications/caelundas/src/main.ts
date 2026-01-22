/**
 * Caelundas application entry point - astronomical calendar generator.
 *
 * Orchestrates ephemeris calculation and event generation pipeline:
 * 1. Input validation from environment variables
 * 2. Day-by-day ephemeris retrieval with temporal margins
 * 3. Minute-by-minute exact event detection
 * 4. Compound aspect pattern detection
 * 5. Duration event synthesis from exact event pairs
 * 6. iCalendar file generation and export
 */

import fs from "fs";

import moment from "moment-timezone";

import {
  type Event as CalendarEvent,
  MARGIN_MINUTES,
} from "./calendar.utilities";
import { getCalendar } from "./calendar.utilities";
import {
  getActiveAspectsAt,
  getAllEvents,
  upsertEvents,
} from "./database.utilities";
import { getEphemerides } from "./ephemeris/ephemeris.aggregates";
import {
  getAnnualSolarCycleEvents,
  getSolarApsisDurationEvents,
  getSolarApsisEvents,
} from "./events/annualSolarCycle/annualSolarCycle.events";
import {
  getMajorAspectDurationEvents,
  getMajorAspectEvents,
} from "./events/aspects/majorAspects.events";
import {
  getMinorAspectDurationEvents,
  getMinorAspectEvents,
} from "./events/aspects/minorAspects.events";
import {
  getQuadrupleAspectDurationEvents,
  getQuadrupleAspectEvents,
} from "./events/aspects/quadrupleAspects.events";
import {
  getQuintupleAspectDurationEvents,
  getQuintupleAspectEvents,
} from "./events/aspects/quintupleAspects.events";
import {
  getSextupleAspectDurationEvents,
  getSextupleAspectEvents,
} from "./events/aspects/sextupleAspects.events";
import {
  getSpecialtyAspectDurationEvents,
  getSpecialtyAspectEvents,
} from "./events/aspects/specialtyAspects.events";
import {
  getStelliumDurationEvents,
  getStelliumEvents,
} from "./events/aspects/stellium.events";
import {
  getTripleAspectDurationEvents,
  getTripleAspectEvents,
} from "./events/aspects/tripleAspects.events";
import { getDailyLunarCycleEvents } from "./events/dailyCycles/dailyLunarCycle.events";
import { getDailySolarCycleEvents } from "./events/dailyCycles/dailySolarCycle.events";
import {
  getEclipseDurationEvents,
  getEclipseEvents,
} from "./events/eclipses/eclipses.events";
import {
  getDecanIngressEvents,
  getPeakIngressEvents,
  getSignIngressDurationEvents,
  getSignIngressEvents,
} from "./events/ingresses/ingresses.events";
import {
  getMonthlyLunarCycleDurationEvents,
  getMonthlyLunarCycleEvents,
} from "./events/monthlyLunarCycle/monthlyLunarCycle.events";
import {
  getPlanetaryPhaseDurationEvents,
  getPlanetaryPhaseEvents,
} from "./events/phases/phases.events";
import {
  getRetrogradeDurationEvents,
  getRetrogradeEvents,
} from "./events/retrogrades/retrogrades.events";
import {
  getTwilightDurationEvents,
  getTwilightEvents,
} from "./events/twilights/twilights.events";
import { inputSchema } from "./input.schema";
import { getOutputPath } from "./output.utilities";

import type { Coordinates } from "./ephemeris/ephemeris.types";

/**
 * Main application function - orchestrates the complete ephemeris calculation pipeline.
 *
 * Executes the following stages:
 * 1. Validates environment variables (location, timezone, date range)
 * 2. Iterates through each day in the date range
 * 3. Fetches ephemeris data with temporal margins for accuracy
 * 4. Detects exact events at 1-minute resolution
 * 5. Identifies compound aspect patterns from active aspects
 * 6. Synthesizes duration events from exact event pairs
 * 7. Generates and exports iCalendar file
 *
 * @returns Promise that resolves when calendar generation completes
 *
 * @remarks
 * Environment variables required:
 * - LATITUDE: Observer latitude in decimal degrees (-90 to 90)
 * - LONGITUDE: Observer longitude in decimal degrees (-180 to 180)
 * - TIMEZONE: IANA timezone identifier (e.g., "America/New_York")
 * - START_DATE: Range start in ISO 8601 format
 * - END_DATE: Range end in ISO 8601 format
 *
 * Processing approach:
 * - Day-by-day iteration manages memory efficiently for long date ranges
 * - 30-minute margins ensure events near midnight are captured correctly
 * - Minute-by-minute sampling provides high temporal resolution
 * - Database caching minimizes redundant ephemeris API calls
 * - Compound aspects detected after simple aspects are saved
 *
 * Output:
 * - Single .ics file containing all detected events
 * - Filename format: `caelundas_<start>_to_<end>.ics`
 * - Saved to output/ directory
 *
 * @throws {z.ZodError} When environment variables fail validation
 * @throws {Error} When NASA JPL Horizons API is unavailable
 * @throws {Error} When database operations fail
 *
 * @see {@link inputSchema} for environment variable validation
 * @see {@link getEphemerides} for ephemeris aggregation
 * @see {@link upsertEvents} for database persistence
 * @see {@link getCalendar} for iCalendar generation
 *
 * @example
 * ```bash
 * # Set environment variables
 * export LATITUDE=40.7128
 * export LONGITUDE=-74.0060
 * export TIMEZONE=America/New_York
 * export START_DATE=2026-01-21
 * export END_DATE=2026-01-22
 *
 * # Run application
 * npm run develop
 *
 * # Output: output/caelundas_2026-01-21T00:00:00-05:00_to_2026-01-22T00:00:00-05:00.ics
 * ```
 */
async function main(): Promise<void> {
  // #region 🔮 Input
  const input = inputSchema.parse({
    latitude: process.env["LATITUDE"],
    longitude: process.env["LONGITUDE"],
    timezone: process.env["TIMEZONE"],
    startDate: process.env["START_DATE"],
    endDate: process.env["END_DATE"],
  });

  console.log(`🔭 Caelundas with input:`, JSON.stringify(input));

  const { end, latitude, longitude, start, timezone } = input;

  // #region 🌅 Day Loop
  for (
    let thisDay = moment.tz(start, timezone);
    thisDay.isBefore(end);
    thisDay = thisDay.add(1, "day")
  ) {
    const nextDay = thisDay.clone().add(1, "day");

    // #region 🔮 Ephemerides
    const startMoment = thisDay.clone().subtract(MARGIN_MINUTES, "minutes");
    const endMoment = nextDay.clone().add(MARGIN_MINUTES, "minutes");

    const timespan = `${startMoment.format()} to ${endMoment.format()}`;
    console.log(`📅 Processing day ${timespan}`);

    const start = startMoment.toDate();
    const end = endMoment.toDate();
    const coordinates = [longitude, latitude] as Coordinates;

    const {
      azimuthElevationEphemerisByBody,
      coordinateEphemerisByBody,
      diameterEphemerisByBody,
      distanceEphemerisByBody,
      illuminationEphemerisByBody,
    } = await getEphemerides({ coordinates, end, start, timezone });

    // #region 🎯 Exact Events

    for (
      let currentMinute = moment.tz(thisDay, timezone);
      currentMinute.isBefore(nextDay);
      currentMinute = currentMinute.add(1, "minute")
    ) {
      const exactEvents: CalendarEvent[] = [
        ...getSignIngressEvents({ coordinateEphemerisByBody, currentMinute }),
        ...getDecanIngressEvents({ coordinateEphemerisByBody, currentMinute }),
        ...getPeakIngressEvents({ coordinateEphemerisByBody, currentMinute }),
        ...getMajorAspectEvents({ coordinateEphemerisByBody, currentMinute }),
        ...getMinorAspectEvents({ coordinateEphemerisByBody, currentMinute }),
        ...getSpecialtyAspectEvents({
          coordinateEphemerisByBody,
          currentMinute,
        }),
        ...getRetrogradeEvents({ coordinateEphemerisByBody, currentMinute }),
        ...getPlanetaryPhaseEvents({
          coordinateEphemerisByBody,
          currentMinute,
          distanceEphemerisByBody,
          illuminationEphemerisByBody,
        }),
        ...getAnnualSolarCycleEvents({
          currentMinute,
          sunCoordinateEphemeris: coordinateEphemerisByBody.sun,
        }),
        ...getSolarApsisEvents({
          currentMinute,
          sunDistanceEphemeris: distanceEphemerisByBody.sun,
        }),
        ...getEclipseEvents({
          currentMinute,
          moonCoordinateEphemeris: coordinateEphemerisByBody.moon,
          moonDiameterEphemeris: diameterEphemerisByBody.moon,
          sunCoordinateEphemeris: coordinateEphemerisByBody.sun,
          sunDiameterEphemeris: diameterEphemerisByBody.sun,
        }),
        ...getMonthlyLunarCycleEvents({
          currentMinute,
          moonIlluminationEphemeris: illuminationEphemerisByBody.moon,
        }),
        ...getDailySolarCycleEvents({
          currentMinute,
          sunAzimuthElevationEphemeris: azimuthElevationEphemerisByBody.sun,
        }),
        ...getDailyLunarCycleEvents({
          currentMinute,
          moonAzimuthElevationEphemeris: azimuthElevationEphemerisByBody.moon,
        }),
        ...getTwilightEvents({
          currentMinute,
          sunAzimuthElevationEphemeris: azimuthElevationEphemerisByBody.sun,
        }),
      ];
      await upsertEvents(exactEvents);

      const activeAspects = await getActiveAspectsAt(currentMinute.toDate());

      const compoundAspectEvents: CalendarEvent[] = [
        ...getTripleAspectEvents(activeAspects, currentMinute),
        ...getQuadrupleAspectEvents(activeAspects, currentMinute),
        ...getQuintupleAspectEvents(activeAspects, currentMinute),
        ...getSextupleAspectEvents(activeAspects, currentMinute),
        ...getStelliumEvents(activeAspects, currentMinute),
      ];
      await upsertEvents(compoundAspectEvents);
    }

    console.log(`📅 Processed day ${timespan}`);
  }

  // #region ⏱️ Duration Events
  console.log(`🔍 Fetching exact events from the database`);
  const exactEvents = await getAllEvents();
  console.log(
    `🔍 Fetched ${exactEvents.length} exact events from the database`,
  );

  console.log(`⏱️ Creating duration events from exact events`);
  const durationEvents = [
    ...getSignIngressDurationEvents(exactEvents),
    ...getMajorAspectDurationEvents(exactEvents),
    ...getMinorAspectDurationEvents(exactEvents),
    ...getSpecialtyAspectDurationEvents(exactEvents),
    ...getTripleAspectDurationEvents(exactEvents),
    ...getQuadrupleAspectDurationEvents(exactEvents),
    ...getQuintupleAspectDurationEvents(exactEvents),
    ...getSextupleAspectDurationEvents(exactEvents),
    ...getStelliumDurationEvents(exactEvents),
    ...getMonthlyLunarCycleDurationEvents(exactEvents),
    ...getEclipseDurationEvents(exactEvents),
    ...getRetrogradeDurationEvents(exactEvents),
    ...getTwilightDurationEvents(exactEvents),
    ...getSolarApsisDurationEvents(exactEvents),
    ...getPlanetaryPhaseDurationEvents(exactEvents),
  ];
  await upsertEvents(durationEvents);
  console.log(
    `⏱️ Created ${durationEvents.length} duration events from exact events`,
  );

  // #region 💾 Save Events
  // Fetch all events again including newly created duration events
  const allEvents = await getAllEvents();
  console.log(`🔍 Total events: ${allEvents.length}`);

  const calendar = getCalendar({
    events: allEvents,
    name: "Caelundas 🔭",
    description: "Astronomical events and celestial phenomena",
  });

  const timespan = `${moment.tz(start, timezone).format()} to ${moment
    .tz(end, timezone)
    .format()}`;
  const filename = `caelundas_${timespan}.ics`;

  console.log(`✏️ Writing ${allEvents.length} events to ${filename}`);
  fs.writeFileSync(getOutputPath(filename), new TextEncoder().encode(calendar));
  console.log(`✏️ Wrote ${allEvents.length} events to ${filename}`);

  console.log(`🔭 Caelundas from input:`, JSON.stringify(input));

  process.exit(0);
}
void main();
