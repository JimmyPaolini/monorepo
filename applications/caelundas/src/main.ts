import moment from "moment-timezone";
import { MARGIN_MINUTES } from "./calendar.utilities";
import type { Coordinates } from "./ephemeris/ephemeris.types";
import { getEphemerides } from "./ephemeris/ephemeris.aggregates";
import {
  getSignIngressEvents,
  getDecanIngressEvents,
  getPeakIngressEvents,
  getSignIngressDurationEvents,
} from "./events/ingresses/ingresses.events";
import {
  getMajorAspectEvents,
  getMajorAspectDurationEvents,
} from "./events/aspects/majorAspects.events";
import {
  getMinorAspectEvents,
  getMinorAspectDurationEvents,
} from "./events/aspects/minorAspects.events";
import {
  getSpecialtyAspectEvents,
  getSpecialtyAspectDurationEvents,
} from "./events/aspects/specialtyAspects.events";
import {
  getTripleAspectEvents,
  getTripleAspectDurationEvents,
} from "./events/aspects/tripleAspects.events";
import {
  getQuadrupleAspectEvents,
  getQuadrupleAspectDurationEvents,
} from "./events/aspects/quadrupleAspects.events";
import {
  getQuintupleAspectEvents,
  getQuintupleAspectDurationEvents,
} from "./events/aspects/quintupleAspects.events";
import {
  getSextupleAspectEvents,
  getSextupleAspectDurationEvents,
} from "./events/aspects/sextupleAspects.events";
import {
  getStelliumEvents,
  getStelliumDurationEvents,
} from "./events/aspects/stellium.events";
import {
  getRetrogradeDurationEvents,
  getRetrogradeEvents,
} from "./events/retrogrades/retrogrades.events";
import {
  getAnnualSolarCycleEvents,
  getSolarApsisEvents,
  getSolarApsisDurationEvents,
} from "./events/annualSolarCycle/annualSolarCycle.events";
import {
  getMonthlyLunarCycleEvents,
  getMonthlyLunarCycleDurationEvents,
} from "./events/monthlyLunarCycle/monthlyLunarCycle.events";
import {
  getEclipseEvents,
  getEclipseDurationEvents,
} from "./events/eclipses/eclipses.events";
import { getDailyLunarCycleEvents } from "./events/dailyCycles/dailyLunarCycle.events";
import { getDailySolarCycleEvents } from "./events/dailyCycles/dailySolarCycle.events";
import {
  getTwilightEvents,
  getTwilightDurationEvents,
} from "./events/twilights/twilights.events";
import {
  getPlanetaryPhaseEvents,
  getPlanetaryPhaseDurationEvents,
} from "./events/phases/phases.events";
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
    startDate: process.env.START_DATE,
    endDate: process.env.END_DATE,
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
    console.log(`📅 Processing from ${timespan}`);

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
      await upsertEvents([
        ...getSignIngressEvents({ coordinateEphemerisByBody, currentMinute }),
        ...getDecanIngressEvents({ coordinateEphemerisByBody, currentMinute }),
        ...getPeakIngressEvents({ coordinateEphemerisByBody, currentMinute }),
        ...getMajorAspectEvents({ coordinateEphemerisByBody, currentMinute }),
        ...getMinorAspectEvents({ coordinateEphemerisByBody, currentMinute }),
        ...getSpecialtyAspectEvents({
          coordinateEphemerisByBody,
          currentMinute,
        }),
        ...getTripleAspectEvents({ coordinateEphemerisByBody, currentMinute }),
        ...getQuadrupleAspectEvents({
          coordinateEphemerisByBody,
          currentMinute,
        }),
        ...getQuintupleAspectEvents({
          coordinateEphemerisByBody,
          currentMinute,
        }),
        ...getSextupleAspectEvents({
          coordinateEphemerisByBody,
          currentMinute,
        }),
        ...getStelliumEvents({
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
          sunCoordinateEphemeris: coordinateEphemerisByBody["sun"],
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

  // #region ⏱️ Duration Events
  console.log(`🔍 Fetching exact events from the database`);
  const exactEvents = await getAllEvents();
  console.log(
    `🔍 Fetched ${exactEvents.length} exact events from the database`
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
    `⏱️ Created ${durationEvents.length} duration events from exact events`
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
main();
