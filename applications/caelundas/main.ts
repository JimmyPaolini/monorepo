import _ from "npm:lodash";
import moment from "npm:moment-timezone";
import { getChoices } from "./choices/choices.service.ts";
import type { Event } from "./calendar.utilities.ts";
import type { Coordinates } from "./ephemeris/ephemeris.types.ts";
import {
  getEphemerides,
  shouldGetEphemeris,
} from "./ephemeris/ephemeris.aggregates.ts";
import {
  getSignIngressEvents,
  writeSignIngressEvents,
  type SignIngressEvent,
  getDecanIngressEvents,
  writeDecanIngressEvents,
  type DecanIngressEvent,
  getPeakIngressEvents,
  writePeakIngressEvents,
  type PeakIngressEvent,
} from "./events/ingresses/ingresses.events.ts";
import {
  type MajorAspectEvent,
  getMajorAspectEvents,
  writeMajorAspectEvents,
} from "./events/aspects/majorAspects.events.ts";
import {
  type MinorAspectEvent,
  getMinorAspectEvents,
  writeMinorAspectEvents,
} from "./events/aspects/minorAspects.events.ts";
import {
  type SpecialtyAspectEvent,
  getSpecialtyAspectEvents,
  writeSpecialtyAspectEvents,
} from "./events/aspects/specialtyAspects.events.ts";
import {
  getRetrogradeEvents,
  writeRetrogradeEvents,
  type RetrogradeEvent,
} from "./events/retrogrades/retrogrades.events.ts";
import {
  getAnnualSolarCycleEvents,
  getSolarApsisEvents,
  writeAnnualSolarCycleEvents,
} from "./events/annualSolarCycle/annualSolarCycle.events.ts";
import {
  getMonthlyLunarCycleEvents,
  writeMonthlyLunarCycleEvents,
} from "./events/monthlyLunarCycle/monthlyLunarCycle.events.ts";
import { getEclipseEvents } from "./events/eclipses/eclipses.events.ts";
import {
  getDailyLunarCycleEvents,
  writeDailyLunarCycleEvents,
} from "./events/dailyCycles/dailyLunarCycle.events.ts";
import {
  getDailySolarCycleEvents,
  writeDailySolarCycleEvents,
} from "./events/dailyCycles/dailySolarCycle.events.ts";
import {
  getTwilightEvents,
  writeTwilightEvents,
} from "./events/twilights/twilights.events.ts";
import {
  getPlanetaryPhaseEvents,
  type PlanetaryPhaseEvent,
  writePlanetaryPhaseEvents,
} from "./events/phases/phases.events.ts";
import { initializeLogs, print, setDate } from "./logs/logs.service.tsx";

export const MARGIN_MINUTES = 30;

if (import.meta.main) {
  // #region 🔮 Choices
  const choices = await getChoices();

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
  } = choices;

  initializeLogs({
    choices,
    date: start,
    start,
    end,
    logs: [],
    count: 0,
  });

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
    let currentDay = moment.tz(start, "America/New_York");
    currentDay.isBefore(end);
    currentDay = currentDay.add(1, "day")
  ) {
    const nextDay = currentDay.clone().add(1, "day");
    const currentDayLabel = currentDay.format("YYYY-MM-DD");
    setDate(currentDay.toDate());

    const signIngressEvents: SignIngressEvent[] = [];
    const decanIngressEvents: DecanIngressEvent[] = [];
    const peakIngressEvents: PeakIngressEvent[] = [];

    const majorAspectEvents: MajorAspectEvent[] = [];
    const minorAspectEvents: MinorAspectEvent[] = [];
    const specialtyAspectEvents: SpecialtyAspectEvent[] = [];

    const retrogradeEvents: RetrogradeEvent[] = [];
    const planetaryPhaseEvents: PlanetaryPhaseEvent[] = [];

    const annualSolarCycleEvents: Event[] = [];
    const monthlyLunarCycleEvents: Event[] = [];
    const dailySolarCycleEvents: Event[] = [];
    const dailyLunarCycleEvents: Event[] = [];
    const twilightEvents: Event[] = [];

    // #region 🔮 Ephemerides
    const start = currentDay
      .clone()
      .subtract(MARGIN_MINUTES, "minutes")
      .toDate();
    const end = nextDay.clone().add(MARGIN_MINUTES, "minutes").toDate();
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
      let currentMinute = moment.tz(currentDay, "America/New_York");
      currentMinute.isBefore(nextDay);
      currentMinute = currentMinute.add(1, "minute")
    ) {
      // #region 🪧 Sign Ingresses
      if (eventTypes.includes("ingresses") && signIngressBodies.length > 0) {
        signIngressEvents.push(
          ...getSignIngressEvents({
            coordinateEphemerisByBody,
            currentMinute,
            signIngressBodies,
          })
        );
      }

      // #region 🔟 Decan Ingresses
      if (eventTypes.includes("ingresses") && decanIngressBodies.length > 0) {
        decanIngressEvents.push(
          ...getDecanIngressEvents({
            coordinateEphemerisByBody,
            currentMinute,
            decanIngressBodies,
          })
        );
      }

      // #region ⛰️ Peak Ingresses
      if (eventTypes.includes("ingresses") && peakIngressBodies.length > 0) {
        peakIngressEvents.push(
          ...getPeakIngressEvents({
            coordinateEphemerisByBody,
            currentMinute,
            peakIngressBodies,
          })
        );
      }

      // #region 📐 Major Aspects
      if (eventTypes.includes("aspects") && majorAspectBodies.length > 0) {
        majorAspectEvents.push(
          ...getMajorAspectEvents({
            coordinateEphemerisByBody,
            currentMinute,
            majorAspectBodies,
          })
        );
      }

      // #region 📐 Minor Aspects
      if (eventTypes.includes("aspects") && minorAspectBodies.length > 0) {
        minorAspectEvents.push(
          ...getMinorAspectEvents({
            coordinateEphemerisByBody,
            currentMinute,
            minorAspectBodies,
          })
        );
      }

      // #region 📐 Specialty Aspects
      if (eventTypes.includes("aspects") && specialtyAspectBodies.length > 0) {
        specialtyAspectEvents.push(
          ...getSpecialtyAspectEvents({
            coordinateEphemerisByBody,
            currentMinute,
            specialtyAspectBodies,
          })
        );
      }

      // #region ↩️ Retrogrades
      if (eventTypes.includes("retrogrades") && retrogradeBodies.length > 0) {
        retrogradeEvents.push(
          ...getRetrogradeEvents({
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
        planetaryPhaseEvents.push(
          ...getPlanetaryPhaseEvents({
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
        annualSolarCycleEvents.push(
          ...getAnnualSolarCycleEvents({
            currentMinute,
            ephemeris: coordinateEphemerisByBody["sun"],
          })
        );
      }

      // #region 📏 Apsides
      if (eventTypes.includes("annualSolarCycle")) {
        annualSolarCycleEvents.push(
          ...getSolarApsisEvents({
            currentMinute,
            sunDistanceEphemeris: distanceEphemerisByBody["sun"],
          })
        );
      }

      // #region 🐉 Eclipses
      if (eventTypes.includes("monthlyLunarCycle")) {
        monthlyLunarCycleEvents.push(
          ...getEclipseEvents({
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
        monthlyLunarCycleEvents.push(
          ...getMonthlyLunarCycleEvents({
            currentMinute,
            moonIlluminationEphemeris: illuminationEphemerisByBody["moon"],
          })
        );
      }

      // #region ☀️ Daily Solar Cycle
      if (eventTypes.includes("dailySolarCycle")) {
        dailySolarCycleEvents.push(
          ...getDailySolarCycleEvents({
            currentMinute,
            sunAzimuthElevationEphemeris:
              azimuthElevationEphemerisByBody["sun"],
          })
        );
      }

      // #region 🌙 Daily Lunar Cycle
      if (eventTypes.includes("dailyLunarCycle")) {
        dailyLunarCycleEvents.push(
          ...getDailyLunarCycleEvents({
            currentMinute,
            moonAzimuthElevationEphemeris:
              azimuthElevationEphemerisByBody["moon"],
          })
        );
      }

      // #region 🌄 Twilights
      if (eventTypes.includes("twilights")) {
        twilightEvents.push(
          ...getTwilightEvents({
            currentMinute,
            sunAzimuthElevationEphemeris:
              azimuthElevationEphemerisByBody["sun"],
          })
        );
      }
    }

    // #region ✏️ Write Events

    print(`📅 Writing calendar files for ${currentDayLabel}`);

    const times = { start, end };

    writeSignIngressEvents({ signIngressBodies, signIngressEvents, ...times });
    const decanIngresses = { decanIngressBodies, decanIngressEvents };
    writeDecanIngressEvents({ ...decanIngresses, ...times });
    writePeakIngressEvents({ peakIngressBodies, peakIngressEvents, ...times });

    writeMajorAspectEvents({ majorAspectBodies, majorAspectEvents, ...times });
    writeMinorAspectEvents({ minorAspectBodies, minorAspectEvents, ...times });
    const specialtyAspects = { specialtyAspectBodies, specialtyAspectEvents };
    writeSpecialtyAspectEvents({ ...specialtyAspects, ...times });

    writeRetrogradeEvents({ retrogradeBodies, retrogradeEvents, ...times });
    const planetaryPhases = { planetaryPhaseBodies, planetaryPhaseEvents };
    writePlanetaryPhaseEvents({ ...planetaryPhases, ...times });

    writeAnnualSolarCycleEvents({ annualSolarCycleEvents, ...times });
    writeMonthlyLunarCycleEvents({ monthlyLunarCycleEvents, ...times });
    writeDailySolarCycleEvents({ dailySolarCycleEvents, ...times });
    writeDailyLunarCycleEvents({ dailyLunarCycleEvents, ...times });
    writeTwilightEvents({ twilightEvents, ...times });

    print(`📅 Wrote calendar files for ${currentDayLabel}`);
  }

  print(`🔭 Caelundas from choices:`, JSON.stringify(choices));

  Deno.exit();
}
