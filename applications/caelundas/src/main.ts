import moment from "moment-timezone";
import { MARGIN_MINUTES } from "./calendar.utilities";
import type { Coordinates } from "./ephemeris/ephemeris.types";
import { getEphemerides } from "./ephemeris/ephemeris.aggregates";
import {
  getSignIngressEvents,
  getDecanIngressEvents,
  getPeakIngressEvents,
} from "./events/ingresses/ingresses.events";
import { getMajorAspectEvents } from "./events/aspects/majorAspects.events";
import { getMinorAspectEvents } from "./events/aspects/minorAspects.events";
import { getSpecialtyAspectEvents } from "./events/aspects/specialtyAspects.events";
import { getRetrogradeEvents } from "./events/retrogrades/retrogrades.events";
import {
  getAnnualSolarCycleEvents,
  getSolarApsisEvents,
} from "./events/annualSolarCycle/annualSolarCycle.events";
import { getMonthlyLunarCycleEvents } from "./events/monthlyLunarCycle/monthlyLunarCycle.events";
import { getEclipseEvents } from "./events/eclipses/eclipses.events";
import { getDailyLunarCycleEvents } from "./events/dailyCycles/dailyLunarCycle.events";
import { getDailySolarCycleEvents } from "./events/dailyCycles/dailySolarCycle.events";
import { getTwilightEvents } from "./events/twilights/twilights.events";
import { getPlanetaryPhaseEvents } from "./events/phases/phases.events";
import { getCalendar } from "./calendar.utilities";
import { getOutputPath } from "./output.utilities";
import { upsertEvents, getAllEvents } from "./database.utilities";
import fs from "fs";
import { inputSchema } from "./input.schema";

async function main() {
  // #region 🔮 Input
  const input = inputSchema.parse({
    latitude: process.env.LATITUDE,
    longitude: process.env.LONGITUDE,
    timezone: process.env.TIMEZONE,
    start: moment
      .tz(
        process.env.START_DATE || "2025-01-01",
        process.env.TIMEZONE || "America/New_York"
      )
      .toDate(),
    end: moment
      .tz(
        process.env.END_DATE || "2025-12-31",
        process.env.TIMEZONE || "America/New_York"
      )
      .toDate(),
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
    const start = thisDay.clone().subtract(MARGIN_MINUTES, "minutes").toDate();
    const end = nextDay.clone().add(MARGIN_MINUTES, "minutes").toDate();

    const timespan = `${start.toISOString()}_${end.toISOString()}`;
    console.log(`📅 Processing from ${timespan}`);

    const coordinates = [longitude, latitude] as Coordinates;

    const {
      azimuthElevationEphemerisByBody,
      coordinateEphemerisByBody,
      diameterEphemerisByBody,
      distanceEphemerisByBody,
      illuminationEphemerisByBody,
    } = await getEphemerides({ coordinates, end, start });

    // #region ⏱️ Minute Loop
    for (
      let currentMinute = moment.tz(thisDay, timezone);
      currentMinute.isBefore(nextDay);
      currentMinute = currentMinute.add(1, "minute")
    ) {
      await upsertEvents([
        ...getSignIngressEvents({
          coordinateEphemerisByBody,
          currentMinute,
        }),
        ...getDecanIngressEvents({
          coordinateEphemerisByBody,
          currentMinute,
        }),
        ...getPeakIngressEvents({
          coordinateEphemerisByBody,
          currentMinute,
        }),
        ...getMajorAspectEvents({
          coordinateEphemerisByBody,
          currentMinute,
        }),
        ...getMinorAspectEvents({
          coordinateEphemerisByBody,
          currentMinute,
        }),
        ...getSpecialtyAspectEvents({
          coordinateEphemerisByBody,
          currentMinute,
        }),
        ...getRetrogradeEvents({
          coordinateEphemerisByBody,
          currentMinute,
        }),
        ...getPlanetaryPhaseEvents({
          coordinateEphemerisByBody,
          currentMinute,
          distanceEphemerisByBody,
          illuminationEphemerisByBody,
        }),
        ...getAnnualSolarCycleEvents({
          currentMinute,
          ephemeris: coordinateEphemerisByBody["sun"],
        }),
        ...getSolarApsisEvents({
          currentMinute,
          sunDistanceEphemeris: distanceEphemerisByBody["sun"],
        }),
        ...getEclipseEvents({
          currentMinute,
          moonCoordinateEphemeris: coordinateEphemerisByBody["moon"],
          moonDiameterEphemeris: diameterEphemerisByBody["moon"],
          sunCoordinateEphemeris: coordinateEphemerisByBody["sun"],
          sunDiameterEphemeris: diameterEphemerisByBody["sun"],
        }),
        ...getMonthlyLunarCycleEvents({
          currentMinute,
          moonIlluminationEphemeris: illuminationEphemerisByBody["moon"],
        }),
        ...getDailySolarCycleEvents({
          currentMinute,
          sunAzimuthElevationEphemeris: azimuthElevationEphemerisByBody["sun"],
        }),
        ...getDailyLunarCycleEvents({
          currentMinute,
          moonAzimuthElevationEphemeris:
            azimuthElevationEphemerisByBody["moon"],
        }),
        ...getTwilightEvents({
          currentMinute,
          sunAzimuthElevationEphemeris: azimuthElevationEphemerisByBody["sun"],
        }),
      ]);
    }

    console.log(`📅 Processed from ${timespan}`);
  }

  // #region 💾 Save Events
  console.log(`🔍 Fetching all events from the database`);
  const allEvents = await getAllEvents();
  console.log(`🔍 Fetched ${allEvents.length} events from the database`);

  const calendar = getCalendar({
    events: allEvents,
    name: "Caelundas 🔭",
    description: "Astronomical events and celestial phenomena",
  });

  const timespan = `${start.toISOString()}_${end.toISOString()}`;
  const filename = `caelundas_${timespan}.ics`;

  console.log(`✏️ Writing ${allEvents.length} events to ${filename}`);
  fs.writeFileSync(getOutputPath(filename), new TextEncoder().encode(calendar));
  console.log(`✏️ Wrote ${allEvents.length} events to ${filename}`);

  console.log(`🔭 Caelundas from input:`, JSON.stringify(input));

  process.exit(0);
}
main();
