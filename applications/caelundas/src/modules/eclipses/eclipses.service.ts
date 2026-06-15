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

interface EclipseCoordinates {
  diameterMoon: number;
  diameterSun: number;
  latitudeMoon: number;
  latitudeSun: number;
  longitudeMoon: number;
  longitudeSun: number;
}

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

  private buildEclipseEvent(args: {
    body: "Lunar" | "Solar";
    date: Moment;
    description: string;
    frame: EclipseFrame;
    summary: string;
  }): Event {
    const { body, date, description, frame, summary } = args;
    const frameLabel =
      frame === "geocentric" ? "Geocentric" : "Topocentric Visibility";
    const frameSymbol = frame === "geocentric" ? "🌐" : "📍";
    const framedDescription = `${description} (${frameLabel})`;
    const framedSummary = `${frameSymbol} ${summary}`;
    const dateString = this.formatTimeZoneIso(date, "America/New_York");
    this.logger.log(`${framedSummary} at ${dateString}`);
    return {
      categories: [...this.categories, body, frameLabel],
      description: framedDescription,
      end: date,
      start: date,
      summary: framedSummary,
    };
  }

  private buildGeocentricEclipseEvents(
    minute: Moment,
    solarPhase: EclipsePhase | null,
    lunarPhase: EclipsePhase | null,
  ): Event[] {
    const events: Event[] = [];
    if (solarPhase) {
      events.push(
        this.buildSolarEclipseEvent({
          date: minute,
          frame: "geocentric",
          phase: solarPhase,
        }),
      );
    }
    if (lunarPhase) {
      events.push(
        this.buildLunarEclipseEvent({
          date: minute,
          frame: "geocentric",
          phase: lunarPhase,
        }),
      );
    }
    return events;
  }

  private detectProgressiveFrame(
    eclipseEvents: Event[],
    frameLabel: "Geocentric" | "Topocentric Visibility",
    body: "Lunar" | "Solar",
  ): Event[] {
    const events = eclipseEvents.filter(
      (event) =>
        event.categories.includes(body) &&
        event.categories.includes(frameLabel),
    );
    const beginnings = events.filter((event) =>
      event.description.includes("begins"),
    );
    const endings = events.filter((event) =>
      event.description.includes("ends"),
    );

    const pairs = this.progressiveUtilitiesService.pairProgressiveEvents(
      beginnings,
      endings,
      `${body.toLowerCase()} eclipse (${frameLabel.toLowerCase()})`,
    );

    return pairs.map(([beginning, ending]) =>
      body === "Solar"
        ? this.getSolarEclipseDurationEvent(beginning, ending, frameLabel)
        : this.getLunarEclipseDurationEvent(beginning, ending, frameLabel),
    );
  }

  private formatTimeZoneIso(date: Moment, timezone: string): string {
    return date.clone().tz(timezone).toISOString(true);
  }

  private getAllEclipseCoordinates(args: {
    minute: Moment;
    moonCoordinateEphemeris: CoordinateEphemeris;
    moonDiameterEphemeris: DiameterEphemeris;
    sunCoordinateEphemeris: CoordinateEphemeris;
    sunDiameterEphemeris: DiameterEphemeris;
  }): {
    currentCoordinates: EclipseCoordinates;
    nextCoordinates: EclipseCoordinates;
    previousCoordinates: EclipseCoordinates;
  } {
    const minuteIso = args.minute.toISOString();
    const previousIso = args.minute.clone().subtract(1, "minute").toISOString();
    const nextIso = args.minute.clone().add(1, "minute").toISOString();

    const common = {
      moonCoordinateEphemeris: args.moonCoordinateEphemeris,
      moonDiameterEphemeris: args.moonDiameterEphemeris,
      sunCoordinateEphemeris: args.sunCoordinateEphemeris,
      sunDiameterEphemeris: args.sunDiameterEphemeris,
    };

    return {
      currentCoordinates: this.getEclipseCoordinates({ minuteIso, ...common }),
      nextCoordinates: this.getEclipseCoordinates({
        minuteIso: nextIso,
        ...common,
      }),
      previousCoordinates: this.getEclipseCoordinates({
        minuteIso: previousIso,
        ...common,
      }),
    };
  }

  private getAllTopocentricVisibilities(args: {
    minute: Moment;
    moonAzimuthElevationEphemeris: AzimuthElevationEphemeris;
    sunAzimuthElevationEphemeris: AzimuthElevationEphemeris;
  }): {
    currentVis: { isLunarVisible: boolean; isSolarVisible: boolean };
    nextVis: { isLunarVisible: boolean; isSolarVisible: boolean };
    previousVis: { isLunarVisible: boolean; isSolarVisible: boolean };
  } {
    const minuteIso = args.minute.toISOString();
    const previousIso = args.minute.clone().subtract(1, "minute").toISOString();
    const nextIso = args.minute.clone().add(1, "minute").toISOString();

    const common = {
      moonAzimuthElevationEphemeris: args.moonAzimuthElevationEphemeris,
      sunAzimuthElevationEphemeris: args.sunAzimuthElevationEphemeris,
    };

    return {
      currentVis: this.getTopocentricVisibility({ minuteIso, ...common }),
      nextVis: this.getTopocentricVisibility({ minuteIso: nextIso, ...common }),
      previousVis: this.getTopocentricVisibility({
        minuteIso: previousIso,
        ...common,
      }),
    };
  }

  private getEclipseAngles(
    current: EclipseCoordinates,
    previous: EclipseCoordinates,
    next: EclipseCoordinates,
  ): {
    currentDiameter: number;
    currentLatitudeAngle: number;
    currentLongitudeAngle: number;
    nextLongitudeAngle: number;
    previousLongitudeAngle: number;
  } {
    return {
      currentDiameter: current.diameterSun + current.diameterMoon,
      currentLatitudeAngle: this.mathService.getAngle(
        current.latitudeMoon,
        current.latitudeSun,
      ),
      currentLongitudeAngle: this.mathService.getAngle(
        current.longitudeMoon,
        current.longitudeSun,
      ),
      nextLongitudeAngle: this.mathService.getAngle(
        next.longitudeMoon,
        next.longitudeSun,
      ),
      previousLongitudeAngle: this.mathService.getAngle(
        previous.longitudeMoon,
        previous.longitudeSun,
      ),
    };
  }

  private getEclipseCoordinateDiameters(
    minuteIso: string,
    moonDiameterEphemeris: DiameterEphemeris,
    sunDiameterEphemeris: DiameterEphemeris,
  ): { diameterMoon: number; diameterSun: number } {
    return {
      diameterMoon: this.ephemerisService.getDiameterFromEphemeris(
        moonDiameterEphemeris,
        minuteIso,
        "currentDiameterMoon",
      ),
      diameterSun: this.ephemerisService.getDiameterFromEphemeris(
        sunDiameterEphemeris,
        minuteIso,
        "currentDiameterSun",
      ),
    };
  }

  private getEclipseCoordinateLatLons(
    minuteIso: string,
    moonCoordinateEphemeris: CoordinateEphemeris,
    sunCoordinateEphemeris: CoordinateEphemeris,
  ): {
    latitudeMoon: number;
    latitudeSun: number;
    longitudeMoon: number;
    longitudeSun: number;
  } {
    return {
      latitudeMoon: this.ephemerisService.getCoordinateFromEphemeris(
        moonCoordinateEphemeris,
        minuteIso,
        "latitude",
      ),
      latitudeSun: this.ephemerisService.getCoordinateFromEphemeris(
        sunCoordinateEphemeris,
        minuteIso,
        "latitude",
      ),
      longitudeMoon: this.ephemerisService.getCoordinateFromEphemeris(
        moonCoordinateEphemeris,
        minuteIso,
        "longitude",
      ),
      longitudeSun: this.ephemerisService.getCoordinateFromEphemeris(
        sunCoordinateEphemeris,
        minuteIso,
        "longitude",
      ),
    };
  }

  private getEclipseCoordinates(args: {
    minuteIso: string;
    moonCoordinateEphemeris: CoordinateEphemeris;
    moonDiameterEphemeris: DiameterEphemeris;
    sunCoordinateEphemeris: CoordinateEphemeris;
    sunDiameterEphemeris: DiameterEphemeris;
  }): EclipseCoordinates {
    const {
      minuteIso,
      moonCoordinateEphemeris,
      moonDiameterEphemeris,
      sunCoordinateEphemeris,
      sunDiameterEphemeris,
    } = args;
    return {
      ...this.getEclipseCoordinateDiameters(
        minuteIso,
        moonDiameterEphemeris,
        sunDiameterEphemeris,
      ),
      ...this.getEclipseCoordinateLatLons(
        minuteIso,
        moonCoordinateEphemeris,
        sunCoordinateEphemeris,
      ),
    };
  }

  private getGeocentricEvents(args: {
    currentCoordinates: EclipseCoordinates;
    minute: Moment;
    nextCoordinates: EclipseCoordinates;
    previousCoordinates: EclipseCoordinates;
  }): {
    events: Event[];
    lunarPhase: EclipsePhase | null;
    solarPhase: EclipsePhase | null;
  } {
    const solarPhase = this.isSolarEclipse(
      args.currentCoordinates,
      args.previousCoordinates,
      args.nextCoordinates,
    );
    const lunarPhase = this.isLunarEclipse(
      args.currentCoordinates,
      args.previousCoordinates,
      args.nextCoordinates,
    );
    const events = this.buildGeocentricEclipseEvents(
      args.minute,
      solarPhase,
      lunarPhase,
    );
    return { events, lunarPhase, solarPhase };
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

  private getLunarEclipsePhase(args: {
    currentDiameter: number;
    currentLongitudeAngle: number;
    isCurrentInEclipse: boolean;
    isMaximumLongitudeAngle: boolean;
    nextLongitudeAngle: number;
    previousLongitudeAngle: number;
  }): EclipsePhase | null {
    if (!args.isCurrentInEclipse) {
      return null;
    }

    if (args.isMaximumLongitudeAngle) {
      return "maximum";
    }

    const threshold = 180 - args.currentDiameter;

    if (this.isLunarEclipseBeginning(args, threshold)) {
      return "beginning";
    }

    if (this.isLunarEclipseEnding(args, threshold)) {
      return "ending";
    }

    return null;
  }

  private getLunarEclipsePhaseLabels(phase: EclipsePhase): {
    description: string;
    summary: string;
  } {
    if (phase === "maximum") {
      return {
        description: "Lunar Eclipse maximum",
        summary: "🌙🐉🎯 Lunar Eclipse maximum",
      };
    }
    if (phase === "beginning") {
      return {
        description: "Lunar Eclipse begins",
        summary: "🌙🐉▶️ Lunar Eclipse begins",
      };
    }
    return {
      description: "Lunar Eclipse ends",
      summary: "🌙🐉◀️ Lunar Eclipse ends",
    };
  }

  private getLunarTopocentricEvent(args: {
    currentCoordinates: EclipseCoordinates;
    currentVis: boolean;
    geocentricPhase: EclipsePhase | null;
    minute: Moment;
    nextCoordinates: EclipseCoordinates;
    nextVis: boolean;
    previousCoordinates: EclipseCoordinates;
    previousVis: boolean;
  }): Event | null {
    const phase = this.getTopocentricPhase({
      currentActive: this.isLunarTopocentricActive(
        args.currentCoordinates,
        args.currentVis,
      ),
      geocentricPhase: args.geocentricPhase,
      nextActive: this.isLunarTopocentricActive(
        args.nextCoordinates,
        args.nextVis,
      ),
      previousActive: this.isLunarTopocentricActive(
        args.previousCoordinates,
        args.previousVis,
      ),
    });
    return phase
      ? this.buildLunarEclipseEvent({
          date: args.minute,
          frame: "topocentric",
          phase,
        })
      : null;
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

  private getSolarEclipsePhase(args: {
    currentDiameter: number;
    currentLongitudeAngle: number;
    isCurrentInEclipse: boolean;
    isMinimumLongitudeAngle: boolean;
    nextLongitudeAngle: number;
    previousLongitudeAngle: number;
  }): EclipsePhase | null {
    if (!args.isCurrentInEclipse) {
      return null;
    }

    if (args.isMinimumLongitudeAngle) {
      return "maximum";
    }

    if (this.isSolarEclipseBeginning(args, args.currentDiameter)) {
      return "beginning";
    }

    if (this.isSolarEclipseEnding(args, args.currentDiameter)) {
      return "ending";
    }

    return null;
  }

  private getSolarEclipsePhaseLabels(phase: EclipsePhase): {
    description: string;
    summary: string;
  } {
    if (phase === "maximum") {
      return {
        description: "Solar Eclipse maximum",
        summary: "☀️🐉🎯 Solar Eclipse maximum",
      };
    }
    if (phase === "beginning") {
      return {
        description: "Solar Eclipse begins",
        summary: "☀️🐉▶️ Solar Eclipse begins",
      };
    }
    return {
      description: "Solar Eclipse ends",
      summary: "☀️🐉◀️ Solar Eclipse ends",
    };
  }

  private getSolarTopocentricEvent(args: {
    currentCoordinates: EclipseCoordinates;
    currentVis: boolean;
    geocentricPhase: EclipsePhase | null;
    minute: Moment;
    nextCoordinates: EclipseCoordinates;
    nextVis: boolean;
    previousCoordinates: EclipseCoordinates;
    previousVis: boolean;
  }): Event | null {
    const phase = this.getTopocentricPhase({
      currentActive: this.isSolarTopocentricActive(
        args.currentCoordinates,
        args.currentVis,
      ),
      geocentricPhase: args.geocentricPhase,
      nextActive: this.isSolarTopocentricActive(
        args.nextCoordinates,
        args.nextVis,
      ),
      previousActive: this.isSolarTopocentricActive(
        args.previousCoordinates,
        args.previousVis,
      ),
    });
    return phase
      ? this.buildSolarEclipseEvent({
          date: args.minute,
          frame: "topocentric",
          phase,
        })
      : null;
  }

  private getTopocentricEvents(args: {
    currentCoordinates: EclipseCoordinates;
    lunarPhase: EclipsePhase | null;
    minute: Moment;
    moonAzimuthElevationEphemeris: AzimuthElevationEphemeris;
    nextCoordinates: EclipseCoordinates;
    previousCoordinates: EclipseCoordinates;
    solarPhase: EclipsePhase | null;
    sunAzimuthElevationEphemeris: AzimuthElevationEphemeris;
  }): Event[] {
    const vis = this.getAllTopocentricVisibilities(args);
    const events: Event[] = [];
    const solarEvent = this.getSolarTopocentricEvent({
      currentCoordinates: args.currentCoordinates,
      currentVis: vis.currentVis.isSolarVisible,
      geocentricPhase: args.solarPhase,
      minute: args.minute,
      nextCoordinates: args.nextCoordinates,
      nextVis: vis.nextVis.isSolarVisible,
      previousCoordinates: args.previousCoordinates,
      previousVis: vis.previousVis.isSolarVisible,
    });
    if (solarEvent) events.push(solarEvent);
    const lunarEvent = this.getLunarTopocentricEvent({
      currentCoordinates: args.currentCoordinates,
      currentVis: vis.currentVis.isLunarVisible,
      geocentricPhase: args.lunarPhase,
      minute: args.minute,
      nextCoordinates: args.nextCoordinates,
      nextVis: vis.nextVis.isLunarVisible,
      previousCoordinates: args.previousCoordinates,
      previousVis: vis.previousVis.isLunarVisible,
    });
    if (lunarEvent) events.push(lunarEvent);
    return events;
  }

  private getTopocentricEventsForDetect(
    minute: Moment,
    moonAzimuthElevationEphemeris: AzimuthElevationEphemeris,
    sunAzimuthElevationEphemeris: AzimuthElevationEphemeris,
    coords: {
      currentCoordinates: EclipseCoordinates;
      nextCoordinates: EclipseCoordinates;
      previousCoordinates: EclipseCoordinates;
    },
    geocentric: {
      lunarPhase: EclipsePhase | null;
      solarPhase: EclipsePhase | null;
    },
  ): Event[] {
    return this.getTopocentricEvents({
      ...coords,
      lunarPhase: geocentric.lunarPhase,
      minute,
      moonAzimuthElevationEphemeris,
      solarPhase: geocentric.solarPhase,
      sunAzimuthElevationEphemeris,
    });
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

  private getTopocentricVisibility(args: {
    minuteIso: string;
    moonAzimuthElevationEphemeris: AzimuthElevationEphemeris;
    sunAzimuthElevationEphemeris: AzimuthElevationEphemeris;
  }): { isLunarVisible: boolean; isSolarVisible: boolean } {
    const {
      minuteIso,
      moonAzimuthElevationEphemeris,
      sunAzimuthElevationEphemeris,
    } = args;
    const moonElevation =
      this.ephemerisService.getAzimuthElevationFromEphemeris(
        moonAzimuthElevationEphemeris,
        minuteIso,
        "elevation",
      );
    const sunElevation = this.ephemerisService.getAzimuthElevationFromEphemeris(
      sunAzimuthElevationEphemeris,
      minuteIso,
      "elevation",
    );

    return {
      isLunarVisible: moonElevation > 0,
      isSolarVisible: sunElevation > 0 && moonElevation > 0,
    };
  }

  private isLunarEclipse(
    current: EclipseCoordinates,
    previous: EclipseCoordinates,
    next: EclipseCoordinates,
  ): EclipsePhase | null {
    const {
      currentDiameter,
      currentLatitudeAngle,
      currentLongitudeAngle,
      nextLongitudeAngle,
      previousLongitudeAngle,
    } = this.getEclipseAngles(current, previous, next);
    const isCurrentInEclipse = currentLatitudeAngle < currentDiameter;
    const isMaximumLongitudeAngle = this.mathService.isMaximum({
      current: currentLongitudeAngle,
      next: nextLongitudeAngle,
      previous: previousLongitudeAngle,
    });
    return this.getLunarEclipsePhase({
      currentDiameter,
      currentLongitudeAngle,
      isCurrentInEclipse,
      isMaximumLongitudeAngle,
      nextLongitudeAngle,
      previousLongitudeAngle,
    });
  }

  private isLunarEclipseActive(current: EclipseCoordinates): boolean {
    const currentLongitudeAngle = this.mathService.getAngle(
      current.longitudeMoon,
      current.longitudeSun,
    );
    const currentLatitudeAngle = this.mathService.getAngle(
      current.latitudeMoon,
      current.latitudeSun,
    );
    const currentDiameter = current.diameterSun + current.diameterMoon;
    const oppositionThreshold = 180 - currentDiameter;

    return (
      currentLatitudeAngle < currentDiameter &&
      currentLongitudeAngle >= oppositionThreshold
    );
  }

  private isLunarEclipseBeginning(
    args: { currentLongitudeAngle: number; previousLongitudeAngle: number },
    threshold: number,
  ): boolean {
    const isApproaching =
      args.previousLongitudeAngle < args.currentLongitudeAngle;
    return (
      isApproaching &&
      args.previousLongitudeAngle < threshold &&
      args.currentLongitudeAngle >= threshold
    );
  }

  private isLunarEclipseEnding(
    args: { currentLongitudeAngle: number; nextLongitudeAngle: number },
    threshold: number,
  ): boolean {
    const isLeaving = args.currentLongitudeAngle > args.nextLongitudeAngle;
    return (
      isLeaving &&
      args.nextLongitudeAngle < threshold &&
      args.currentLongitudeAngle >= threshold
    );
  }

  private isLunarTopocentricActive(
    coordinates: EclipseCoordinates,
    isVisible: boolean,
  ): boolean {
    return this.isLunarEclipseActive(coordinates) && isVisible;
  }

  private isSolarEclipse(
    current: EclipseCoordinates,
    previous: EclipseCoordinates,
    next: EclipseCoordinates,
  ): EclipsePhase | null {
    const {
      currentDiameter,
      currentLatitudeAngle,
      currentLongitudeAngle,
      nextLongitudeAngle,
      previousLongitudeAngle,
    } = this.getEclipseAngles(current, previous, next);
    const isCurrentInEclipse = currentLatitudeAngle < currentDiameter;
    const isMinimumLongitudeAngle = this.mathService.isMinimum({
      current: currentLongitudeAngle,
      next: nextLongitudeAngle,
      previous: previousLongitudeAngle,
    });
    return this.getSolarEclipsePhase({
      currentDiameter,
      currentLongitudeAngle,
      isCurrentInEclipse,
      isMinimumLongitudeAngle,
      nextLongitudeAngle,
      previousLongitudeAngle,
    });
  }

  private isSolarEclipseActive(current: EclipseCoordinates): boolean {
    const currentLongitudeAngle = this.mathService.getAngle(
      current.longitudeMoon,
      current.longitudeSun,
    );
    const currentLatitudeAngle = this.mathService.getAngle(
      current.latitudeMoon,
      current.latitudeSun,
    );
    const currentDiameter = current.diameterSun + current.diameterMoon;

    return (
      currentLatitudeAngle < currentDiameter &&
      currentLongitudeAngle <= currentDiameter
    );
  }

  private isSolarEclipseBeginning(
    args: { currentLongitudeAngle: number; previousLongitudeAngle: number },
    threshold: number,
  ): boolean {
    const isApproaching =
      args.previousLongitudeAngle > args.currentLongitudeAngle;
    return (
      isApproaching &&
      args.previousLongitudeAngle > threshold &&
      args.currentLongitudeAngle <= threshold
    );
  }

  private isSolarEclipseEnding(
    args: { currentLongitudeAngle: number; nextLongitudeAngle: number },
    threshold: number,
  ): boolean {
    const isLeaving = args.currentLongitudeAngle < args.nextLongitudeAngle;
    return (
      isLeaving &&
      args.nextLongitudeAngle > threshold &&
      args.currentLongitudeAngle <= threshold
    );
  }

  private isSolarTopocentricActive(
    coordinates: EclipseCoordinates,
    isVisible: boolean,
  ): boolean {
    return this.isSolarEclipseActive(coordinates) && isVisible;
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
    const { description, summary } = this.getLunarEclipsePhaseLabels(phase);
    return this.buildEclipseEvent({
      body: "Lunar",
      date,
      description,
      frame,
      summary,
    });
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
    const { description, summary } = this.getSolarEclipsePhaseLabels(phase);
    return this.buildEclipseEvent({
      body: "Solar",
      date,
      description,
      frame,
      summary,
    });
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
    const coords = this.getAllEclipseCoordinates({
      minute: args.minute,
      moonCoordinateEphemeris: args.moonCoordinateEphemeris,
      moonDiameterEphemeris: args.moonDiameterEphemeris,
      sunCoordinateEphemeris: args.sunCoordinateEphemeris,
      sunDiameterEphemeris: args.sunDiameterEphemeris,
    });
    const geocentric = this.getGeocentricEvents({
      minute: args.minute,
      ...coords,
    });
    const eclipseEvents: Event[] = [...geocentric.events];
    if (
      args.moonAzimuthElevationEphemeris &&
      args.sunAzimuthElevationEphemeris
    ) {
      eclipseEvents.push(
        ...this.getTopocentricEventsForDetect(
          args.minute,
          args.moonAzimuthElevationEphemeris,
          args.sunAzimuthElevationEphemeris,
          coords,
          geocentric,
        ),
      );
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
    const eclipseEvents = events.filter((event) =>
      event.categories.includes("Eclipse"),
    );

    return [
      ...this.detectProgressiveFrame(eclipseEvents, "Geocentric", "Lunar"),
      ...this.detectProgressiveFrame(eclipseEvents, "Geocentric", "Solar"),
      ...this.detectProgressiveFrame(
        eclipseEvents,
        "Topocentric Visibility",
        "Lunar",
      ),
      ...this.detectProgressiveFrame(
        eclipseEvents,
        "Topocentric Visibility",
        "Solar",
      ),
    ];
  }
}
