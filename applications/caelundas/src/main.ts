import _ from "lodash";
import moment from "moment-timezone";
import { MARGIN_MINUTES, type Event } from "./calendar.utilities";
import type { Coordinates } from "./ephemeris/ephemeris.types";
import {
  getEphemerides,
  shouldGetEphemeris,
} from "./ephemeris/ephemeris.aggregates";
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
    eventTypes: process.env.EVENT_TYPES,
    ingresses: process.env.INGRESSES,
    signIngressBodies: process.env.SIGN_INGRESS_BODIES,
    decanIngressBodies: process.env.DECAN_INGRESS_BODIES,
    peakIngressBodies: process.env.PEAK_INGRESS_BODIES,
    aspects: process.env.ASPECTS,
    majorAspectBodies: process.env.MAJOR_ASPECT_BODIES,
    minorAspectBodies: process.env.MINOR_ASPECT_BODIES,
    specialtyAspectBodies: process.env.SPECIALTY_ASPECT_BODIES,
    retrogradeBodies: process.env.RETROGRADE_BODIES,
    planetaryPhaseBodies: process.env.PLANETARY_PHASE_BODIES,
    latitude: process.env.LATITUDE,
    longitude: process.env.LONGITUDE,
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

  const {
    end,
    eventTypes,
    signIngressBodies,
    decanIngressBodies,
    latitude,
    longitude,
    majorAspectBodies,
    minorAspectBodies,
    peakIngressBodies,
    planetaryPhaseBodies,
    retrogradeBodies,
    specialtyAspectBodies,
    start,
  } = input;

  const ephemerisBodies = shouldGetEphemeris({
    eventTypes,
    signIngressBodies,
    decanIngressBodies,
    majorAspectBodies,
    minorAspectBodies,
    peakIngressBodies,
    planetaryPhaseBodies,
    retrogradeBodies,
    specialtyAspectBodies,
  });

  // #region 🌅 Day Loop
  for (
    let thisDay = moment.tz(start, "America/New_York");
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
    } = await getEphemerides({ ...ephemerisBodies, coordinates, end, start });

    // #region ⏱️ Minute Loop
    for (
      let currentMinute = moment.tz(thisDay, "America/New_York");
      currentMinute.isBefore(nextDay);
      currentMinute = currentMinute.add(1, "minute")
    ) {
      // #region 🪧 Sign Ingresses
      if (eventTypes.includes("ingresses") && signIngressBodies.length > 0) {
        await upsertEvents(
          getSignIngressEvents({
            coordinateEphemerisByBody,
            currentMinute,
            signIngressBodies,
          })
        );
      }

      // #region 🔟 Decan Ingresses
      if (eventTypes.includes("ingresses") && decanIngressBodies.length > 0) {
        await upsertEvents(
          getDecanIngressEvents({
            coordinateEphemerisByBody,
            currentMinute,
            decanIngressBodies,
          })
        );
      }

      // #region ⛰️ Peak Ingresses
      if (eventTypes.includes("ingresses") && peakIngressBodies.length > 0) {
        await upsertEvents(
          getPeakIngressEvents({
            coordinateEphemerisByBody,
            currentMinute,
            peakIngressBodies,
          })
        );
      }

      // #region 📐 Major Aspects
      if (eventTypes.includes("aspects") && majorAspectBodies.length > 0) {
        await upsertEvents(
          getMajorAspectEvents({
            coordinateEphemerisByBody,
            currentMinute,
            majorAspectBodies,
          })
        );
      }

      // #region 📐 Minor Aspects
      if (eventTypes.includes("aspects") && minorAspectBodies.length > 0) {
        await upsertEvents(
          getMinorAspectEvents({
            coordinateEphemerisByBody,
            currentMinute,
            minorAspectBodies,
          })
        );
      }

      // #region 📐 Specialty Aspects
      if (eventTypes.includes("aspects") && specialtyAspectBodies.length > 0) {
        await upsertEvents(
          getSpecialtyAspectEvents({
            coordinateEphemerisByBody,
            currentMinute,
            specialtyAspectBodies,
          })
        );
      }

      // #region ↩️ Retrogrades
      if (eventTypes.includes("retrogrades") && retrogradeBodies.length > 0) {
        await upsertEvents(
          getRetrogradeEvents({
            coordinateEphemerisByBody,
            currentMinute,
            retrogradeBodies,
          })
        );
      }

      // #region 🌓 Planetary Phases
      if (
        eventTypes.includes("planetaryPhases") &&
        planetaryPhaseBodies.length > 0
      ) {
        await upsertEvents(
          getPlanetaryPhaseEvents({
            coordinateEphemerisByBody,
            currentMinute,
            distanceEphemerisByBody,
            illuminationEphemerisByBody,
            planetaryPhaseBodies,
          })
        );
      }

      // #region 🌸 Annual Solar Cycle
      if (eventTypes.includes("annualSolarCycle")) {
        await upsertEvents(
          getAnnualSolarCycleEvents({
            currentMinute,
            ephemeris: coordinateEphemerisByBody["sun"],
          })
        );
      }

      // #region 📏 Apsides
      if (eventTypes.includes("annualSolarCycle")) {
        await upsertEvents(
          getSolarApsisEvents({
            currentMinute,
            sunDistanceEphemeris: distanceEphemerisByBody["sun"],
          })
        );
      }

      // #region 🐉 Eclipses
      if (eventTypes.includes("monthlyLunarCycle")) {
        await upsertEvents(
          getEclipseEvents({
            currentMinute,
            moonCoordinateEphemeris: coordinateEphemerisByBody["moon"],
            moonDiameterEphemeris: diameterEphemerisByBody["moon"],
            sunCoordinateEphemeris: coordinateEphemerisByBody["sun"],
            sunDiameterEphemeris: diameterEphemerisByBody["sun"],
          })
        );
      }

      // #region 🌒 Monthly Lunar Cycle
      if (eventTypes.includes("monthlyLunarCycle")) {
        await upsertEvents(
          getMonthlyLunarCycleEvents({
            currentMinute,
            moonIlluminationEphemeris: illuminationEphemerisByBody["moon"],
          })
        );
      }

      // #region ☀️ Daily Solar Cycle
      if (eventTypes.includes("dailySolarCycle")) {
        await upsertEvents(
          getDailySolarCycleEvents({
            currentMinute,
            sunAzimuthElevationEphemeris:
              azimuthElevationEphemerisByBody["sun"],
          })
        );
      }

      // #region 🌙 Daily Lunar Cycle
      if (eventTypes.includes("dailyLunarCycle")) {
        await upsertEvents(
          getDailyLunarCycleEvents({
            currentMinute,
            moonAzimuthElevationEphemeris:
              azimuthElevationEphemerisByBody["moon"],
          })
        );
      }

      // #region 🌄 Twilights
      if (eventTypes.includes("twilights")) {
        await upsertEvents(
          getTwilightEvents({
            currentMinute,
            sunAzimuthElevationEphemeris:
              azimuthElevationEphemerisByBody["sun"],
          })
        );
      }
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
