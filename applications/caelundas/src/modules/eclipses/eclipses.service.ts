import { EphemerisService } from "@caelundas/src/modules/ephemeris/ephemeris.service";
import { MathService } from "@caelundas/src/modules/math/math.service";
import { ProgressiveUtilities } from "@caelundas/src/modules/progressive/progressive.utilities";
import { Injectable } from "@nestjs/common";

import { LoggerService } from "../logger/logger.service";

import type { EclipseFrame } from "./eclipses.types";
import type { EclipsePhase } from "@caelundas/src/modules/caelundas/caelundas.types";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";
import type {
  AzimuthElevationEphemeris,
  CoordinateEphemeris,
  DiameterEphemeris,
} from "@caelundas/src/modules/ephemeris/ephemeris.types";
import type { Moment } from "moment-timezone";

/**
 * Detects solar and lunar eclipse events using Sun and Moon positional and diameter data.
 *
 * Identifies eclipse phases (beginning, maximum, ending) for both geocentric events and
 * topocentric visibility windows, comparing angular diameters with ecliptic separations.
 */
@Injectable()
export class EclipsesService {
  // 🏗 Dependency Injection

  constructor(
    private readonly logger: LoggerService,
    private readonly ephemerisService: EphemerisService,
    private readonly mathService: MathService,
    private readonly progressiveUtilitiesService: ProgressiveUtilities,
  ) {
    this.logger.setContext(EclipsesService.name);
  }

  // 🔐 Private Fields

  private readonly categories = ["Astronomy", "Astrology", "Eclipse"];

  // 🔑 Public Fields

  // 🔏 Private Methods

  private formatTimeZoneIso(date: Moment, timezone: string): string {
    return date.clone().tz(timezone).toISOString(true);
  }

  private getLunarEclipseDurationEvent(
    beginning: Event,
    ending: Event,
    frameLabel: "Geocentric" | "Topocentric Visibility",
  ): Event {
    const frameSymbol = frameLabel === "Geocentric" ? "🌐" : "📍";
    return {
      categories: [...this.categories, "Lunar", frameLabel],
      description: `Lunar Eclipse (${frameLabel})`,
      end: ending.start,
      start: beginning.start,
      summary: `${frameSymbol} 🌙🐉 Lunar Eclipse (${frameLabel})`,
    };
  }

  private getSolarEclipseDurationEvent(
    beginning: Event,
    ending: Event,
    frameLabel: "Geocentric" | "Topocentric Visibility",
  ): Event {
    const frameSymbol = frameLabel === "Geocentric" ? "🌐" : "📍";
    return {
      categories: [...this.categories, "Solar", frameLabel],
      description: `Solar Eclipse (${frameLabel})`,
      end: ending.start,
      start: beginning.start,
      summary: `${frameSymbol} ☀️🐉 Solar Eclipse (${frameLabel})`,
    };
  }

  private getTopocentricPhase(args: {
    currentActive: boolean;
    geocentricPhase: EclipsePhase | null;
    nextActive: boolean;
    previousActive: boolean;
  }): EclipsePhase | null {
    const { currentActive, geocentricPhase, nextActive, previousActive } = args;

    if (!currentActive) {
      return null;
    }
    if (!previousActive) {
      return "beginning";
    }
    if (!nextActive) {
      return "ending";
    }
    if (geocentricPhase === "maximum") {
      return "maximum";
    }

    return null;
  }

  private isLunarEclipse(args: {
    currentDiameterMoon: number;
    currentDiameterSun: number;
    currentLatitudeMoon: number;
    currentLatitudeSun: number;
    currentLongitudeMoon: number;
    currentLongitudeSun: number;
    nextLongitudeMoon: number;
    nextLongitudeSun: number;
    previousLongitudeMoon: number;
    previousLongitudeSun: number;
  }): EclipsePhase | null {
    const {
      currentDiameterMoon,
      currentDiameterSun,
      currentLatitudeMoon,
      currentLatitudeSun,
      currentLongitudeMoon,
      currentLongitudeSun,
      nextLongitudeMoon,
      nextLongitudeSun,
      previousLongitudeMoon,
      previousLongitudeSun,
    } = args;

    const currentLongitudeAngle = this.mathService.getAngle(
      currentLongitudeMoon,
      currentLongitudeSun,
    );
    const nextLongitudeAngle = this.mathService.getAngle(
      nextLongitudeMoon,
      nextLongitudeSun,
    );
    const previousLongitudeAngle = this.mathService.getAngle(
      previousLongitudeMoon,
      previousLongitudeSun,
    );

    const isMaximumLongitudeAngle = this.mathService.isMaximum({
      current: currentLongitudeAngle,
      next: nextLongitudeAngle,
      previous: previousLongitudeAngle,
    });

    const currentLatitudeAngle = this.mathService.getAngle(
      currentLatitudeMoon,
      currentLatitudeSun,
    );
    const currentDiameter = currentDiameterSun + currentDiameterMoon;
    const isCurrentInEclipse = currentLatitudeAngle < currentDiameter;

    const wasApproachingOpposition =
      previousLongitudeAngle < currentLongitudeAngle;
    const willBeLeavingOpposition = currentLongitudeAngle > nextLongitudeAngle;

    if (isMaximumLongitudeAngle && isCurrentInEclipse) {
      return "maximum";
    }

    const oppositionThreshold = 180 - currentDiameter;
    if (
      wasApproachingOpposition &&
      isCurrentInEclipse &&
      previousLongitudeAngle < oppositionThreshold &&
      currentLongitudeAngle >= oppositionThreshold
    ) {
      return "beginning";
    }

    if (
      willBeLeavingOpposition &&
      isCurrentInEclipse &&
      nextLongitudeAngle < oppositionThreshold &&
      currentLongitudeAngle >= oppositionThreshold
    ) {
      return "ending";
    }

    return null;
  }

  private isLunarEclipseActive(args: {
    currentDiameterMoon: number;
    currentDiameterSun: number;
    currentLatitudeMoon: number;
    currentLatitudeSun: number;
    currentLongitudeMoon: number;
    currentLongitudeSun: number;
  }): boolean {
    const {
      currentDiameterMoon,
      currentDiameterSun,
      currentLatitudeMoon,
      currentLatitudeSun,
      currentLongitudeMoon,
      currentLongitudeSun,
    } = args;

    const currentLongitudeAngle = this.mathService.getAngle(
      currentLongitudeMoon,
      currentLongitudeSun,
    );
    const currentLatitudeAngle = this.mathService.getAngle(
      currentLatitudeMoon,
      currentLatitudeSun,
    );
    const currentDiameter = currentDiameterSun + currentDiameterMoon;
    const oppositionThreshold = 180 - currentDiameter;

    return (
      currentLatitudeAngle < currentDiameter &&
      currentLongitudeAngle >= oppositionThreshold
    );
  }

  private isSolarEclipse(args: {
    currentDiameterMoon: number;
    currentDiameterSun: number;
    currentLatitudeMoon: number;
    currentLatitudeSun: number;
    currentLongitudeMoon: number;
    currentLongitudeSun: number;
    nextLongitudeMoon: number;
    nextLongitudeSun: number;
    previousLongitudeMoon: number;
    previousLongitudeSun: number;
  }): EclipsePhase | null {
    const {
      currentDiameterMoon,
      currentDiameterSun,
      currentLatitudeMoon,
      currentLatitudeSun,
      currentLongitudeMoon,
      currentLongitudeSun,
      nextLongitudeMoon,
      nextLongitudeSun,
      previousLongitudeMoon,
      previousLongitudeSun,
    } = args;

    const currentLongitudeAngle = this.mathService.getAngle(
      currentLongitudeMoon,
      currentLongitudeSun,
    );
    const nextLongitudeAngle = this.mathService.getAngle(
      nextLongitudeMoon,
      nextLongitudeSun,
    );
    const previousLongitudeAngle = this.mathService.getAngle(
      previousLongitudeMoon,
      previousLongitudeSun,
    );

    const isMinimumLongitudeAngle = this.mathService.isMinimum({
      current: currentLongitudeAngle,
      next: nextLongitudeAngle,
      previous: previousLongitudeAngle,
    });

    const currentLatitudeAngle = this.mathService.getAngle(
      currentLatitudeMoon,
      currentLatitudeSun,
    );
    const currentDiameter = currentDiameterSun + currentDiameterMoon;
    const isCurrentInEclipse = currentLatitudeAngle < currentDiameter;

    const wasApproachingConjunction =
      previousLongitudeAngle > currentLongitudeAngle;
    const willBeLeavingConjunction = currentLongitudeAngle < nextLongitudeAngle;

    if (isMinimumLongitudeAngle && isCurrentInEclipse) {
      return "maximum";
    }

    if (
      wasApproachingConjunction &&
      isCurrentInEclipse &&
      currentLongitudeAngle <= currentDiameter &&
      previousLongitudeAngle > currentDiameter
    ) {
      return "beginning";
    }

    if (
      willBeLeavingConjunction &&
      isCurrentInEclipse &&
      currentLongitudeAngle <= currentDiameter &&
      nextLongitudeAngle > currentDiameter
    ) {
      return "ending";
    }

    return null;
  }

  private isSolarEclipseActive(args: {
    currentDiameterMoon: number;
    currentDiameterSun: number;
    currentLatitudeMoon: number;
    currentLatitudeSun: number;
    currentLongitudeMoon: number;
    currentLongitudeSun: number;
  }): boolean {
    const {
      currentDiameterMoon,
      currentDiameterSun,
      currentLatitudeMoon,
      currentLatitudeSun,
      currentLongitudeMoon,
      currentLongitudeSun,
    } = args;

    const currentLongitudeAngle = this.mathService.getAngle(
      currentLongitudeMoon,
      currentLongitudeSun,
    );
    const currentLatitudeAngle = this.mathService.getAngle(
      currentLatitudeMoon,
      currentLatitudeSun,
    );
    const currentDiameter = currentDiameterSun + currentDiameterMoon;

    return (
      currentLatitudeAngle < currentDiameter &&
      currentLongitudeAngle <= currentDiameter
    );
  }

  // 🌎 Public Methods

  /**
   * Creates a lunar eclipse calendar event.
   *
   * Lunar eclipses occur when Earth passes between Sun and Moon,
   * casting Earth's shadow on the Moon.
   *
   * @param args - Configuration object
   * @param date - Precise UTC time of eclipse phase
   * @param phase - Eclipse phase: beginning, maximum, or ending
   * @returns Calendar event for lunar eclipse phase
   * @see {@link isLunarEclipse} for detection algorithm
   */
  buildLunarEclipseEvent(args: {
    date: Moment;
    frame: EclipseFrame;
    phase: EclipsePhase;
    // type: "partial" | "total" | "penumbral";
  }): Event {
    const { date, frame, phase } = args;

    let description: string;
    let summary: string;

    if (phase === "maximum") {
      description = `Lunar Eclipse maximum`;
      summary = `🌙🐉🎯 ${description}`;
    } else if (phase === "beginning") {
      description = `Lunar Eclipse begins`;
      summary = `🌙🐉▶️ ${description}`;
    } else {
      description = `Lunar Eclipse ends`;
      summary = `🌙🐉◀️ ${description}`;
    }

    const frameLabel =
      frame === "geocentric" ? "Geocentric" : "Topocentric Visibility";
    const frameSymbol = frame === "geocentric" ? "🌐" : "📍";
    const framedDescription = `${description} (${frameLabel})`;
    const framedSummary = `${frameSymbol} ${summary}`;

    const dateString = this.formatTimeZoneIso(date, "America/New_York");
    this.logger.log(`${framedSummary} at ${dateString}`);

    const lunarEclipseEvent: Event = {
      categories: [...this.categories, "Lunar", frameLabel],
      description: framedDescription,
      end: date,
      start: date,
      summary: framedSummary,
    };
    return lunarEclipseEvent;
  }

  /**
   * Creates a solar eclipse calendar event.
   *
   * Solar eclipses occur when the Moon passes between Earth and Sun,
   * casting a shadow on Earth's surface.
   *
   * @param args - Configuration object
   * @param date - Precise UTC time of eclipse phase
   * @param phase - Eclipse phase: beginning, maximum, or ending
   * @returns Calendar event for solar eclipse phase
   * @see {@link isSolarEclipse} for detection algorithm
   */
  buildSolarEclipseEvent(args: {
    date: Moment;
    frame: EclipseFrame;
    phase: EclipsePhase;
    // type: "partial" | "total" | "annular";
  }): Event {
    const { date, frame, phase } = args;

    let description: string;
    let summary: string;

    if (phase === "maximum") {
      description = `Solar Eclipse maximum`;
      summary = `☀️🐉🎯 ${description}`;
    } else if (phase === "beginning") {
      description = `Solar Eclipse begins`;
      summary = `☀️🐉▶️ ${description}`;
    } else {
      description = `Solar Eclipse ends`;
      summary = `☀️🐉◀️ ${description}`;
    }

    const frameLabel =
      frame === "geocentric" ? "Geocentric" : "Topocentric Visibility";
    const frameSymbol = frame === "geocentric" ? "🌐" : "📍";
    const framedDescription = `${description} (${frameLabel})`;
    const framedSummary = `${frameSymbol} ${summary}`;

    const dateString = this.formatTimeZoneIso(date, "America/New_York");
    this.logger.log(`${framedSummary} at ${dateString}`);

    const solarEclipseEvent: Event = {
      categories: [...this.categories, "Solar", frameLabel],
      description: framedDescription,
      end: date,
      start: date,
      summary: framedSummary,
    };
    return solarEclipseEvent;
  }

  /**
   * Detects solar and lunar eclipse events at a specific minute.
   *
   * Identifies eclipse phases (beginning, maximum, ending) by analyzing the alignment
   * of Sun, Earth, and Moon, accounting for angular diameters and ecliptic latitudes.
   * Solar eclipses occur at new moon (conjunction), lunar eclipses at full moon (opposition).
   *
   * @param args - Configuration object
   * @param minute - The specific minute to analyze
   * @param moonCoordinateEphemeris - Moon position data
   * @param moonDiameterEphemeris - Moon apparent diameter data
   * @param sunCoordinateEphemeris - Sun position data
   * @param sunDiameterEphemeris - Sun apparent diameter data
   * @returns Array of detected eclipse events (0-1 events per minute)
   * @see {@link isSolarEclipse} for solar eclipse detection
   * @see {@link isLunarEclipse} for lunar eclipse detection
   *
   * @remarks
   * Eclipse types:
   * - Solar: Partial, total, or annular (depends on Moon's distance)
   * - Lunar: Penumbral, partial, or total (depends on Earth's shadow depth)
   */
  detect(args: {
    minute: Moment;
    moonAzimuthElevationEphemeris?: AzimuthElevationEphemeris;
    moonCoordinateEphemeris: CoordinateEphemeris;
    moonDiameterEphemeris: DiameterEphemeris;
    sunAzimuthElevationEphemeris?: AzimuthElevationEphemeris;
    sunCoordinateEphemeris: CoordinateEphemeris;
    sunDiameterEphemeris: DiameterEphemeris;
  }): Event[] {
    const {
      minute,
      moonAzimuthElevationEphemeris,
      moonCoordinateEphemeris,
      moonDiameterEphemeris,
      sunAzimuthElevationEphemeris,
      sunCoordinateEphemeris,
      sunDiameterEphemeris,
    } = args;

    const previousMinute = minute.clone().subtract(1, "minute");
    const nextMinute = minute.clone().add(1, "minute");

    const currentLongitudeMoon =
      this.ephemerisService.getCoordinateFromEphemeris(
        moonCoordinateEphemeris,
        minute.toISOString(),
        "longitude",
      );
    const currentLatitudeMoon =
      this.ephemerisService.getCoordinateFromEphemeris(
        moonCoordinateEphemeris,
        minute.toISOString(),
        "latitude",
      );
    const currentLongitudeSun =
      this.ephemerisService.getCoordinateFromEphemeris(
        sunCoordinateEphemeris,
        minute.toISOString(),
        "longitude",
      );
    const currentLatitudeSun = this.ephemerisService.getCoordinateFromEphemeris(
      sunCoordinateEphemeris,
      minute.toISOString(),
      "latitude",
    );

    const nextLongitudeMoon = this.ephemerisService.getCoordinateFromEphemeris(
      moonCoordinateEphemeris,
      nextMinute.toISOString(),
      "longitude",
    );
    const nextLatitudeMoon = this.ephemerisService.getCoordinateFromEphemeris(
      moonCoordinateEphemeris,
      nextMinute.toISOString(),
      "latitude",
    );
    const nextLongitudeSun = this.ephemerisService.getCoordinateFromEphemeris(
      sunCoordinateEphemeris,
      nextMinute.toISOString(),
      "longitude",
    );
    const nextLatitudeSun = this.ephemerisService.getCoordinateFromEphemeris(
      sunCoordinateEphemeris,
      nextMinute.toISOString(),
      "latitude",
    );

    const previousLongitudeMoon =
      this.ephemerisService.getCoordinateFromEphemeris(
        moonCoordinateEphemeris,
        previousMinute.toISOString(),
        "longitude",
      );
    const previousLatitudeMoon =
      this.ephemerisService.getCoordinateFromEphemeris(
        moonCoordinateEphemeris,
        previousMinute.toISOString(),
        "latitude",
      );
    const previousLongitudeSun =
      this.ephemerisService.getCoordinateFromEphemeris(
        sunCoordinateEphemeris,
        previousMinute.toISOString(),
        "longitude",
      );
    const previousLatitudeSun =
      this.ephemerisService.getCoordinateFromEphemeris(
        sunCoordinateEphemeris,
        previousMinute.toISOString(),
        "latitude",
      );

    const currentDiameterMoon = this.ephemerisService.getDiameterFromEphemeris(
      moonDiameterEphemeris,
      minute.toISOString(),
      "currentDiameterMoon",
    );
    const currentDiameterSun = this.ephemerisService.getDiameterFromEphemeris(
      sunDiameterEphemeris,
      minute.toISOString(),
      "currentDiameterSun",
    );
    const nextDiameterMoon = this.ephemerisService.getDiameterFromEphemeris(
      moonDiameterEphemeris,
      nextMinute.toISOString(),
      "nextDiameterMoon",
    );
    const nextDiameterSun = this.ephemerisService.getDiameterFromEphemeris(
      sunDiameterEphemeris,
      nextMinute.toISOString(),
      "nextDiameterSun",
    );
    const previousDiameterMoon = this.ephemerisService.getDiameterFromEphemeris(
      moonDiameterEphemeris,
      previousMinute.toISOString(),
      "previousDiameterMoon",
    );
    const previousDiameterSun = this.ephemerisService.getDiameterFromEphemeris(
      sunDiameterEphemeris,
      previousMinute.toISOString(),
      "previousDiameterSun",
    );

    const parameters = {
      currentDiameterMoon,
      currentDiameterSun,
      currentLatitudeMoon,
      currentLatitudeSun,
      currentLongitudeMoon,
      currentLongitudeSun,
      nextLongitudeMoon,
      nextLongitudeSun,
      previousLongitudeMoon,
      previousLongitudeSun,
    };

    const solarEclipsePhase = this.isSolarEclipse({ ...parameters });
    const lunarEclipsePhase = this.isLunarEclipse({ ...parameters });

    const eclipseEvents: Event[] = [];

    if (solarEclipsePhase) {
      eclipseEvents.push(
        this.buildSolarEclipseEvent({
          date: minute,
          frame: "geocentric",
          phase: solarEclipsePhase,
        }),
      );
    }

    if (lunarEclipsePhase) {
      eclipseEvents.push(
        this.buildLunarEclipseEvent({
          date: minute,
          frame: "geocentric",
          phase: lunarEclipsePhase,
        }),
      );
    }

    const hasTopocentricEphemeris =
      moonAzimuthElevationEphemeris !== undefined &&
      sunAzimuthElevationEphemeris !== undefined;

    if (hasTopocentricEphemeris) {
      const currentMoonElevation =
        this.ephemerisService.getAzimuthElevationFromEphemeris(
          moonAzimuthElevationEphemeris,
          minute.toISOString(),
          "elevation",
        );
      const previousMoonElevation =
        this.ephemerisService.getAzimuthElevationFromEphemeris(
          moonAzimuthElevationEphemeris,
          previousMinute.toISOString(),
          "elevation",
        );
      const nextMoonElevation =
        this.ephemerisService.getAzimuthElevationFromEphemeris(
          moonAzimuthElevationEphemeris,
          nextMinute.toISOString(),
          "elevation",
        );

      const currentSunElevation =
        this.ephemerisService.getAzimuthElevationFromEphemeris(
          sunAzimuthElevationEphemeris,
          minute.toISOString(),
          "elevation",
        );
      const previousSunElevation =
        this.ephemerisService.getAzimuthElevationFromEphemeris(
          sunAzimuthElevationEphemeris,
          previousMinute.toISOString(),
          "elevation",
        );
      const nextSunElevation =
        this.ephemerisService.getAzimuthElevationFromEphemeris(
          sunAzimuthElevationEphemeris,
          nextMinute.toISOString(),
          "elevation",
        );

      const currentSolarGeocentricActive = this.isSolarEclipseActive({
        currentDiameterMoon,
        currentDiameterSun,
        currentLatitudeMoon,
        currentLatitudeSun,
        currentLongitudeMoon,
        currentLongitudeSun,
      });
      const previousSolarGeocentricActive = this.isSolarEclipseActive({
        currentDiameterMoon: previousDiameterMoon,
        currentDiameterSun: previousDiameterSun,
        currentLatitudeMoon: previousLatitudeMoon,
        currentLatitudeSun: previousLatitudeSun,
        currentLongitudeMoon: previousLongitudeMoon,
        currentLongitudeSun: previousLongitudeSun,
      });
      const nextSolarGeocentricActive = this.isSolarEclipseActive({
        currentDiameterMoon: nextDiameterMoon,
        currentDiameterSun: nextDiameterSun,
        currentLatitudeMoon: nextLatitudeMoon,
        currentLatitudeSun: nextLatitudeSun,
        currentLongitudeMoon: nextLongitudeMoon,
        currentLongitudeSun: nextLongitudeSun,
      });

      const isCurrentSolarVisible =
        currentSunElevation > 0 && currentMoonElevation > 0;
      const isPreviousSolarVisible =
        previousSunElevation > 0 && previousMoonElevation > 0;
      const isNextSolarVisible = nextSunElevation > 0 && nextMoonElevation > 0;

      const currentSolarTopocentricActive =
        currentSolarGeocentricActive && isCurrentSolarVisible;
      const previousSolarTopocentricActive =
        previousSolarGeocentricActive && isPreviousSolarVisible;
      const nextSolarTopocentricActive =
        nextSolarGeocentricActive && isNextSolarVisible;

      const solarTopocentricPhase = this.getTopocentricPhase({
        currentActive: currentSolarTopocentricActive,
        geocentricPhase: solarEclipsePhase,
        nextActive: nextSolarTopocentricActive,
        previousActive: previousSolarTopocentricActive,
      });

      if (solarTopocentricPhase) {
        eclipseEvents.push(
          this.buildSolarEclipseEvent({
            date: minute,
            frame: "topocentric",
            phase: solarTopocentricPhase,
          }),
        );
      }

      const currentLunarGeocentricActive = this.isLunarEclipseActive({
        currentDiameterMoon,
        currentDiameterSun,
        currentLatitudeMoon,
        currentLatitudeSun,
        currentLongitudeMoon,
        currentLongitudeSun,
      });
      const previousLunarGeocentricActive = this.isLunarEclipseActive({
        currentDiameterMoon: previousDiameterMoon,
        currentDiameterSun: previousDiameterSun,
        currentLatitudeMoon: previousLatitudeMoon,
        currentLatitudeSun: previousLatitudeSun,
        currentLongitudeMoon: previousLongitudeMoon,
        currentLongitudeSun: previousLongitudeSun,
      });
      const nextLunarGeocentricActive = this.isLunarEclipseActive({
        currentDiameterMoon: nextDiameterMoon,
        currentDiameterSun: nextDiameterSun,
        currentLatitudeMoon: nextLatitudeMoon,
        currentLatitudeSun: nextLatitudeSun,
        currentLongitudeMoon: nextLongitudeMoon,
        currentLongitudeSun: nextLongitudeSun,
      });

      const isCurrentLunarVisible = currentMoonElevation > 0;
      const isPreviousLunarVisible = previousMoonElevation > 0;
      const isNextLunarVisible = nextMoonElevation > 0;

      const currentLunarTopocentricActive =
        currentLunarGeocentricActive && isCurrentLunarVisible;
      const previousLunarTopocentricActive =
        previousLunarGeocentricActive && isPreviousLunarVisible;
      const nextLunarTopocentricActive =
        nextLunarGeocentricActive && isNextLunarVisible;

      const lunarTopocentricPhase = this.getTopocentricPhase({
        currentActive: currentLunarTopocentricActive,
        geocentricPhase: lunarEclipsePhase,
        nextActive: nextLunarTopocentricActive,
        previousActive: previousLunarTopocentricActive,
      });

      if (lunarTopocentricPhase) {
        eclipseEvents.push(
          this.buildLunarEclipseEvent({
            date: minute,
            frame: "topocentric",
            phase: lunarTopocentricPhase,
          }),
        );
      }
    }

    return eclipseEvents;
  }

  /**
   * Builds progressive event spans for eclipse periods.
   *
   * Pairs eclipse beginning events with their corresponding ending events to produce
   * duration-based calendar entries for each geocentric and topocentric eclipse window.
   *
   * @param events - Flat array of perfective eclipse events
   * @returns Progressive (span) calendar events covering each eclipse duration
   */
  detectProgressive(events: Event[]): Event[] {
    const progressiveEvents: Event[] = [];

    const eclipseEvents = events.filter((event) =>
      event.categories.includes("Eclipse"),
    );

    const frames = ["Geocentric", "Topocentric Visibility"] as const;

    for (const frameLabel of frames) {
      // Process solar eclipses
      const solarEvents = eclipseEvents.filter(
        (event) =>
          event.categories.includes("Solar") &&
          event.categories.includes(frameLabel),
      );
      const solarBeginnings = solarEvents.filter((event) =>
        event.description.includes("begins"),
      );
      const solarEndings = solarEvents.filter((event) =>
        event.description.includes("ends"),
      );

      const solarPairs = this.progressiveUtilitiesService.pairProgressiveEvents(
        solarBeginnings,
        solarEndings,
        `solar eclipse (${frameLabel.toLowerCase()})`,
      );

      progressiveEvents.push(
        ...solarPairs.map(([beginning, ending]) =>
          this.getSolarEclipseDurationEvent(beginning, ending, frameLabel),
        ),
      );

      // Process lunar eclipses
      const lunarEvents = eclipseEvents.filter(
        (event) =>
          event.categories.includes("Lunar") &&
          event.categories.includes(frameLabel),
      );
      const lunarBeginnings = lunarEvents.filter((event) =>
        event.description.includes("begins"),
      );
      const lunarEndings = lunarEvents.filter((event) =>
        event.description.includes("ends"),
      );

      const lunarPairs = this.progressiveUtilitiesService.pairProgressiveEvents(
        lunarBeginnings,
        lunarEndings,
        `lunar eclipse (${frameLabel.toLowerCase()})`,
      );

      progressiveEvents.push(
        ...lunarPairs.map(([beginning, ending]) =>
          this.getLunarEclipseDurationEvent(beginning, ending, frameLabel),
        ),
      );
    }

    return progressiveEvents;
  }
}
