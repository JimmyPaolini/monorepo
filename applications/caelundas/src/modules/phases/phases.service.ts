import {
  MARGIN_MINUTES,
  symbolByMartianPhase,
  symbolByMercurianPhase,
  symbolByVenusianPhase,
} from "@caelundas/src/modules/caelundas/caelundas.constants";
import { planetaryPhaseBodies } from "@caelundas/src/modules/caelundas/caelundas.types";
import { EphemerisService } from "@caelundas/src/modules/ephemeris/ephemeris.service";
import { MathService } from "@caelundas/src/modules/math/math.service";
import { ProgressiveUtilities } from "@caelundas/src/modules/progressive/progressive.utilities";
import { TwilightsService } from "@caelundas/src/modules/twilights/twilights.service";
import { Injectable } from "@nestjs/common";
import _ from "lodash";

import { LoggerService } from "../logger/logger.service";

import type {
  MartianPhase,
  MercurianPhase,
  VenusianPhase,
} from "@caelundas/src/modules/caelundas/caelundas.types";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";
import type {
  CoordinateEphemeris,
  CoordinateEphemerisBody,
  DistanceEphemeris,
  DistanceEphemerisBody,
  IlluminationEphemeris,
  IlluminationEphemerisBody,
} from "@caelundas/src/modules/ephemeris/ephemeris.types";
import type { Moment } from "moment-timezone";

/**
 * Detects planetary phase events for the inner planets Venus, Mercury, and Mars.
 *
 * Tracks the visibility and brightness cycles of inner planets as they orbit the Sun,
 * identifying key elongation and illumination milestones observed from Earth.
 */
interface DetectPhaseArguments {
  coordinateEphemerisByBody: Record<
    CoordinateEphemerisBody,
    CoordinateEphemeris
  >;
  distanceEphemerisByBody: Record<DistanceEphemerisBody, DistanceEphemeris>;
  illuminationEphemerisByBody: Record<
    IlluminationEphemerisBody,
    IlluminationEphemeris
  >;
  minute: Moment;
}

interface PhaseParameters {
  currentDistance: number;
  currentIllumination: number;
  currentLongitudePlanet: number;
  currentLongitudeSun: number;
  nextDistances: number[];
  nextIlluminations: number[];
  nextLongitudePlanet: number;
  nextLongitudeSun: number;
  previousDistances: number[];
  previousIlluminations: number[];
  previousLongitudePlanet: number;
  previousLongitudeSun: number;
}

/**
 *
 */
@Injectable()
export class PhasesService {
  // 🏗 Dependency Injection

  constructor(
    private readonly logger: LoggerService,
    private readonly ephemerisService: EphemerisService,
    private readonly mathService: MathService,
    private readonly progressiveUtilitiesService: ProgressiveUtilities,
  ) {
    this.logger.setContext(PhasesService.name);
  }

  // 🔐 Private Fields

  private static readonly categories = [
    "Astronomy",
    "Astrology",
    "Planetary Phase",
  ];
  private readonly riseSetThreshold = TwilightsService.degreesByTwilight.civil;

  // 🔑 Public Fields

  // 🔏 Private Methods

  private detectMartianEvents(
    coordinateEphemerisByBody: Record<
      CoordinateEphemerisBody,
      CoordinateEphemeris
    >,
    distanceEphemerisByBody: Record<DistanceEphemerisBody, DistanceEphemeris>,
    illuminationEphemerisByBody: Record<
      IlluminationEphemerisBody,
      IlluminationEphemeris
    >,
    minute: Moment,
  ): Event[] {
    if (!planetaryPhaseBodies.includes("mars")) return [];
    return this.getMartianPhaseEvents({
      marsCoordinateEphemeris: coordinateEphemerisByBody.mars,
      marsDistanceEphemeris: distanceEphemerisByBody.mars,
      marsIlluminationEphemeris: illuminationEphemerisByBody.mars,
      minute,
      sunCoordinateEphemeris: coordinateEphemerisByBody.sun,
    });
  }

  private detectMartianPhases(
    parameters: PhaseParameters,
    minute: Moment,
  ): Event[] {
    const events: Event[] = [];
    const checks: [boolean, MartianPhase][] = [
      [this.isMorningRise(parameters), "morning rise"],
      [this.isMorningSet(parameters), "morning set"],
      [this.isEveningRise(parameters), "evening rise"],
      [this.isEveningSet(parameters), "evening set"],
    ];
    for (const [condition, phase] of checks) {
      if (condition) {
        events.push(this.buildMartianPhaseEvent({ phase, timestamp: minute }));
      }
    }
    return events;
  }

  private detectMercurianEveningPhases(
    parameters: PhaseParameters,
    minute: Moment,
  ): Event[] {
    const events: Event[] = [];
    const checks: [boolean, MercurianPhase][] = [
      [this.isEveningRise(parameters), "evening rise"],
      [this.isEasternElongation(parameters), "eastern elongation"],
      [this.isEasternBrightest(parameters), "eastern brightest"],
      [this.isEveningSet(parameters), "evening set"],
    ];
    for (const [condition, phase] of checks) {
      if (condition) {
        events.push(
          this.buildMercurianPhaseEvent({ phase, timestamp: minute }),
        );
      }
    }
    return events;
  }

  private detectMercurianEvents(
    coordinateEphemerisByBody: Record<
      CoordinateEphemerisBody,
      CoordinateEphemeris
    >,
    distanceEphemerisByBody: Record<DistanceEphemerisBody, DistanceEphemeris>,
    illuminationEphemerisByBody: Record<
      IlluminationEphemerisBody,
      IlluminationEphemeris
    >,
    minute: Moment,
  ): Event[] {
    if (!planetaryPhaseBodies.includes("mercury")) return [];
    return this.getMercurianPhaseEvents({
      mercuryCoordinateEphemeris: coordinateEphemerisByBody.mercury,
      mercuryDistanceEphemeris: distanceEphemerisByBody.mercury,
      mercuryIlluminationEphemeris: illuminationEphemerisByBody.mercury,
      minute,
      sunCoordinateEphemeris: coordinateEphemerisByBody.sun,
    });
  }

  /**
   * Detects all Mercurian phase events at the current minute.
   *
   * Evaluates Mercury's position relative to the Sun, along with distance
   * and illumination data, to identify phase transitions. Mercury changes
   * phases more frequently than Venus due to its shorter orbital period.
   *
   * @param args - Detection parameters
   * @param minute - The minute to check
   * @param mercuryCoordinateEphemeris - Mercury position data
   * @param mercuryDistanceEphemeris - Mercury distance from Earth
   * @param mercuryIlluminationEphemeris - Mercury illumination percentage
   * @param sunCoordinateEphemeris - Sun position for relative calculations
   * @returns Array of detected Mercurian phase events
   * @see {@link isMorningRise} for morning rise detection
   * @see {@link isEasternElongation} for eastern elongation detection
   */
  private detectMercurianMorningPhases(
    parameters: PhaseParameters,
    minute: Moment,
  ): Event[] {
    const events: Event[] = [];
    const checks: [boolean, MercurianPhase][] = [
      [this.isMorningRise(parameters), "morning rise"],
      [this.isWesternBrightest(parameters), "western brightest"],
      [this.isWesternElongation(parameters), "western elongation"],
      [this.isMorningSet(parameters), "morning set"],
    ];
    for (const [condition, phase] of checks) {
      if (condition) {
        events.push(
          this.buildMercurianPhaseEvent({ phase, timestamp: minute }),
        );
      }
    }
    return events;
  }

  private detectVenusianEveningPhases(
    parameters: PhaseParameters,
    minute: Moment,
  ): Event[] {
    const events: Event[] = [];
    const checks: [boolean, VenusianPhase][] = [
      [this.isEveningRise(parameters), "evening rise"],
      [this.isEasternElongation(parameters), "eastern elongation"],
      [this.isEasternBrightest(parameters), "eastern brightest"],
      [this.isEveningSet(parameters), "evening set"],
    ];
    for (const [condition, phase] of checks) {
      if (condition) {
        events.push(this.buildVenusianPhaseEvent({ phase, timestamp: minute }));
      }
    }
    return events;
  }

  /**
   * Detects planetary phase events for Venus, Mercury, and Mars.
   *
   * Planetary phases track the visibility and brightness cycles of inner planets
   * as they orbit the Sun from Earth's perspective:
   * - Morning/Evening visibility (rise/set relative to Sun)
   * - Maximum elongation (greatest angular separation from Sun)
   * - Maximum brightness (optimal viewing conditions)
   *
   * These events are significant both astronomically (for observation planning)
   * and astrologically (for timing and interpretation).
   *
   * @param args - Detection parameters
   * @param minute - The minute to check for phase events
   * @param coordinateEphemerisByBody - Ephemeris data for all coordinate bodies
   * @param distanceEphemerisByBody - Distance data for inner planets
   * @param illuminationEphemerisByBody - Illumination data for phase calculations
   * @returns Array of all detected planetary phase events at this minute
   * @see {@link getVenusianPhaseEvents} for Venus-specific phases
   * @see {@link getMercurianPhaseEvents} for Mercury-specific phases
   * @see {@link getMartianPhaseEvents} for Mars-specific phases
   */
  private detectVenusianEvents(
    coordinateEphemerisByBody: Record<
      CoordinateEphemerisBody,
      CoordinateEphemeris
    >,
    distanceEphemerisByBody: Record<DistanceEphemerisBody, DistanceEphemeris>,
    illuminationEphemerisByBody: Record<
      IlluminationEphemerisBody,
      IlluminationEphemeris
    >,
    minute: Moment,
  ): Event[] {
    if (!planetaryPhaseBodies.includes("venus")) return [];
    return this.getVenusianPhaseEvents({
      minute,
      sunCoordinateEphemeris: coordinateEphemerisByBody.sun,
      venusCoordinateEphemeris: coordinateEphemerisByBody.venus,
      venusDistanceEphemeris: distanceEphemerisByBody.venus,
      venusIlluminationEphemeris: illuminationEphemerisByBody.venus,
    });
  }

  /**
   * Detects all Venusian phase events at the current minute.
   *
   * Evaluates Venus's position relative to the Sun, along with distance
   * and illumination data, to identify phase transitions. Uses a margin
   * of minutes before and after for accurate extrema detection (brightest,
   * elongation).
   *
   * @param args - Detection parameters
   * @param minute - The minute to check
   * @param venusCoordinateEphemeris - Venus position data
   * @param venusDistanceEphemeris - Venus distance from Earth
   * @param venusIlluminationEphemeris - Venus illumination percentage
   * @param sunCoordinateEphemeris - Sun position for relative calculations
   * @returns Array of detected Venusian phase events
   * @see {@link isMorningRise} for morning rise detection
   * @see {@link isWesternElongation} for western elongation detection
   */
  private detectVenusianMorningPhases(
    parameters: PhaseParameters,
    minute: Moment,
  ): Event[] {
    const events: Event[] = [];
    const checks: [boolean, VenusianPhase][] = [
      [this.isMorningRise(parameters), "morning rise"],
      [this.isWesternBrightest(parameters), "western brightest"],
      [this.isWesternElongation(parameters), "western elongation"],
      [this.isMorningSet(parameters), "morning set"],
    ];
    for (const [condition, phase] of checks) {
      if (condition) {
        events.push(this.buildVenusianPhaseEvent({ phase, timestamp: minute }));
      }
    }
    return events;
  }

  private filterByCategory(events: Event[], category: string): Event[] {
    return events.filter((event) => event.categories.includes(category));
  }

  private formatTimeZoneIso(date: Moment, timezone: string): string {
    return date.clone().tz(timezone).toISOString(true);
  }

  /**
   * Detects all Martian phase events at the current minute.
   *
   * Mars has a simpler visibility cycle than inner planets, tracking only
   * rise and set times relative to the Sun. No elongation or brightness
   * maxima are calculated since Mars can appear anywhere in the sky.
   *
   * @param args - Detection parameters
   * @param minute - The minute to check
   * @param marsCoordinateEphemeris - Mars position data
   * @param marsDistanceEphemeris - Mars distance from Earth
   * @param marsIlluminationEphemeris - Mars illumination percentage
   * @param sunCoordinateEphemeris - Sun position for relative calculations
   * @returns Array of detected Martian phase events
   * @see {@link isMorningRise} for morning rise detection
   * @see {@link isEveningSet} for evening set detection
   */
  private gatherCurrentEphemeris(
    planetCoordinateEphemeris: CoordinateEphemeris,
    sunCoordinateEphemeris: CoordinateEphemeris,
    distanceEphemeris: DistanceEphemeris,
    illuminationEphemeris: IlluminationEphemeris,
    isoNow: string,
  ): Pick<
    PhaseParameters,
    | "currentDistance"
    | "currentIllumination"
    | "currentLongitudePlanet"
    | "currentLongitudeSun"
  > {
    return {
      currentDistance: this.ephemerisService.getDistanceFromEphemeris(
        distanceEphemeris,
        isoNow,
        "currentDistance",
      ),
      currentIllumination: this.ephemerisService.getIlluminationFromEphemeris(
        illuminationEphemeris,
        isoNow,
        "currentIllumination",
      ),
      currentLongitudePlanet: this.ephemerisService.getCoordinateFromEphemeris(
        planetCoordinateEphemeris,
        isoNow,
        "longitude",
      ),
      currentLongitudeSun: this.ephemerisService.getCoordinateFromEphemeris(
        sunCoordinateEphemeris,
        isoNow,
        "longitude",
      ),
    };
  }

  private gatherMarginEphemeris(
    distanceEphemeris: DistanceEphemeris,
    illuminationEphemeris: IlluminationEphemeris,
    minute: Moment,
    direction: "next" | "previous",
  ): { distances: number[]; illuminations: number[] } {
    const distances = Array.from({ length: MARGIN_MINUTES }, (_, index) => {
      const m =
        direction === "previous"
          ? minute.clone().subtract(MARGIN_MINUTES - index, "minutes")
          : minute.clone().add(index + 1, "minute");
      return this.ephemerisService.getDistanceFromEphemeris(
        distanceEphemeris,
        m.toISOString(),
        `${direction}Distance`,
      );
    });
    const illuminations = Array.from({ length: MARGIN_MINUTES }, (_, index) => {
      const m =
        direction === "previous"
          ? minute.clone().subtract(MARGIN_MINUTES - index, "minutes")
          : minute.clone().add(index + 1, "minute");
      return this.ephemerisService.getIlluminationFromEphemeris(
        illuminationEphemeris,
        m.toISOString(),
        `${direction}Illumination`,
      );
    });
    return { distances, illuminations };
  }

  private gatherPhaseParameters(
    planetCoordinateEphemeris: CoordinateEphemeris,
    sunCoordinateEphemeris: CoordinateEphemeris,
    distanceEphemeris: DistanceEphemeris,
    illuminationEphemeris: IlluminationEphemeris,
    minute: Moment,
  ): PhaseParameters {
    const isoNow = minute.toISOString();
    const isoPrevious = minute.clone().subtract(1, "minute").toISOString();
    const isoNext = minute.clone().add(1, "minute").toISOString();
    const current = this.gatherCurrentEphemeris(
      planetCoordinateEphemeris,
      sunCoordinateEphemeris,
      distanceEphemeris,
      illuminationEphemeris,
      isoNow,
    );
    const previous = this.gatherMarginEphemeris(
      distanceEphemeris,
      illuminationEphemeris,
      minute,
      "previous",
    );
    const next = this.gatherMarginEphemeris(
      distanceEphemeris,
      illuminationEphemeris,
      minute,
      "next",
    );
    return {
      ...current,
      nextDistances: next.distances,
      nextIlluminations: next.illuminations,
      nextLongitudePlanet: this.ephemerisService.getCoordinateFromEphemeris(
        planetCoordinateEphemeris,
        isoNext,
        "longitude",
      ),
      nextLongitudeSun: this.ephemerisService.getCoordinateFromEphemeris(
        sunCoordinateEphemeris,
        isoNext,
        "longitude",
      ),
      previousDistances: previous.distances,
      previousIlluminations: previous.illuminations,
      previousLongitudePlanet: this.ephemerisService.getCoordinateFromEphemeris(
        planetCoordinateEphemeris,
        isoPrevious,
        "longitude",
      ),
      previousLongitudeSun: this.ephemerisService.getCoordinateFromEphemeris(
        sunCoordinateEphemeris,
        isoPrevious,
        "longitude",
      ),
    };
  }

  private getBrightness(args: {
    distance: number;
    illumination: number;
  }): number {
    return args.illumination / args.distance ** 2;
  }

  private getBrightnesses(args: {
    currentDistance: number;
    currentIllumination: number;
    nextDistances: number[];
    nextIlluminations: number[];
    previousDistances: number[];
    previousIlluminations: number[];
  }): {
    currentBrightness: number;
    nextBrightnesses: number[];
    previousBrightnesses: number[];
  } {
    const {
      currentDistance,
      currentIllumination,
      nextDistances,
      nextIlluminations,
      previousDistances,
      previousIlluminations,
    } = args;
    return this.getBrightnessesResult(
      currentDistance,
      currentIllumination,
      previousDistances,
      previousIlluminations,
      nextDistances,
      nextIlluminations,
    );
  }

  private getBrightnessesResult(
    currentDistance: number,
    currentIllumination: number,
    previousDistances: number[],
    previousIlluminations: number[],
    nextDistances: number[],
    nextIlluminations: number[],
  ): {
    currentBrightness: number;
    nextBrightnesses: number[];
    previousBrightnesses: number[];
  } {
    const currentBrightness = this.getBrightness({
      distance: currentDistance,
      illumination: currentIllumination,
    });
    const previousBrightnesses = this.mapBrightnessArray(
      previousDistances,
      previousIlluminations,
      "previous",
    );
    const nextBrightnesses = this.mapBrightnessArray(
      nextDistances,
      nextIlluminations,
      "next",
    );
    return { currentBrightness, nextBrightnesses, previousBrightnesses };
  }

  private getElongationAngle(
    longitudePlanet: number,
    longitudeSun: number,
  ): number {
    return this.mathService.getAngle(longitudePlanet, longitudeSun);
  }

  private getMarsEveningVisibilityDurationEvent(
    beginning: Event,
    ending: Event,
  ): Event {
    return {
      categories: [
        ...PhasesService.categories,
        "Martian",
        "Evening Visibility",
      ],
      description: "Mars Evening Star (Evening Visibility)",
      end: ending.start,
      start: beginning.start,
      summary: "♂️ 🌇 Mars Evening Star",
    };
  }

  private getMarsMorningVisibilityDurationEvent(
    beginning: Event,
    ending: Event,
  ): Event {
    return {
      categories: [
        ...PhasesService.categories,
        "Martian",
        "Morning Visibility",
      ],
      description: "Mars Morning Star (Morning Visibility)",
      end: ending.start,
      start: beginning.start,
      summary: "♂️ 🌄 Mars Morning Star",
    };
  }

  private getMartianEveningProgressiveEvents(events: Event[]): Event[] {
    const pairs = this.progressiveUtilitiesService.pairProgressiveEvents(
      this.filterByCategory(events, "Evening Rise"),
      this.filterByCategory(events, "Evening Set"),
      "Mars Evening Visibility",
    );
    return pairs.map(([beginning, ending]) =>
      this.getMarsEveningVisibilityDurationEvent(beginning, ending),
    );
  }

  private getMartianMorningProgressiveEvents(events: Event[]): Event[] {
    const pairs = this.progressiveUtilitiesService.pairProgressiveEvents(
      this.filterByCategory(events, "Morning Rise"),
      this.filterByCategory(events, "Morning Set"),
      "Mars Morning Visibility",
    );
    return pairs.map(([beginning, ending]) =>
      this.getMarsMorningVisibilityDurationEvent(beginning, ending),
    );
  }

  private getMartianPhaseProgressiveEvents(events: Event[]): Event[] {
    return [
      ...this.getMartianMorningProgressiveEvents(events),
      ...this.getMartianEveningProgressiveEvents(events),
    ];
  }

  private getMercurianEveningProgressiveEvents(events: Event[]): Event[] {
    const pairs = this.progressiveUtilitiesService.pairProgressiveEvents(
      this.filterByCategory(events, "Evening Rise"),
      this.filterByCategory(events, "Evening Set"),
      "Mercury Evening Visibility",
    );
    return pairs.map(([beginning, ending]) =>
      this.getMercuryEveningVisibilityDurationEvent(beginning, ending),
    );
  }

  private getMercurianMorningProgressiveEvents(events: Event[]): Event[] {
    const pairs = this.progressiveUtilitiesService.pairProgressiveEvents(
      this.filterByCategory(events, "Morning Rise"),
      this.filterByCategory(events, "Morning Set"),
      "Mercury Morning Visibility",
    );
    return pairs.map(([beginning, ending]) =>
      this.getMercuryMorningVisibilityDurationEvent(beginning, ending),
    );
  }

  private getMercurianPhaseProgressiveEvents(events: Event[]): Event[] {
    return [
      ...this.getMercurianMorningProgressiveEvents(events),
      ...this.getMercurianEveningProgressiveEvents(events),
    ];
  }

  private getMercuryEveningVisibilityDurationEvent(
    beginning: Event,
    ending: Event,
  ): Event {
    return {
      categories: [
        ...PhasesService.categories,
        "Mercurian",
        "Evening Visibility",
      ],
      description: "Mercury Evening Star (Evening Visibility)",
      end: ending.start,
      start: beginning.start,
      summary: "☿ 🌇 Mercury Evening Star",
    };
  }

  private getMercuryMorningVisibilityDurationEvent(
    beginning: Event,
    ending: Event,
  ): Event {
    return {
      categories: [
        ...PhasesService.categories,
        "Mercurian",
        "Morning Visibility",
      ],
      description: "Mercury Morning Star (Morning Visibility)",
      end: ending.start,
      start: beginning.start,
      summary: "☿ 🌄 Mercury Morning Star",
    };
  }

  private getVenusEveningVisibilityDurationEvent(
    beginning: Event,
    ending: Event,
  ): Event {
    return {
      categories: [
        ...PhasesService.categories,
        "Venusian",
        "Evening Visibility",
      ],
      description: "Venus Evening Star (Evening Visibility)",
      end: ending.start,
      start: beginning.start,
      summary: "♀️ 🌇 Venus Evening Star",
    };
  }

  private getVenusianEveningProgressiveEvents(events: Event[]): Event[] {
    const pairs = this.progressiveUtilitiesService.pairProgressiveEvents(
      this.filterByCategory(events, "Evening Rise"),
      this.filterByCategory(events, "Evening Set"),
      "Venus Evening Visibility",
    );
    return pairs.map(([beginning, ending]) =>
      this.getVenusEveningVisibilityDurationEvent(beginning, ending),
    );
  }

  // 🔵 Position helpers

  private getVenusianMorningProgressiveEvents(events: Event[]): Event[] {
    const pairs = this.progressiveUtilitiesService.pairProgressiveEvents(
      this.filterByCategory(events, "Morning Rise"),
      this.filterByCategory(events, "Morning Set"),
      "Venus Morning Visibility",
    );
    return pairs.map(([beginning, ending]) =>
      this.getVenusMorningVisibilityDurationEvent(beginning, ending),
    );
  }

  private getVenusianPhaseProgressiveEvents(events: Event[]): Event[] {
    return [
      ...this.getVenusianMorningProgressiveEvents(events),
      ...this.getVenusianEveningProgressiveEvents(events),
    ];
  }

  private getVenusMorningVisibilityDurationEvent(
    beginning: Event,
    ending: Event,
  ): Event {
    return {
      categories: [
        ...PhasesService.categories,
        "Venusian",
        "Morning Visibility",
      ],
      description: "Venus Morning Star (Morning Visibility)",
      end: ending.start,
      start: beginning.start,
      summary: "♀️ 🌄 Venus Morning Star",
    };
  }

  private isBrightest(args: {
    currentDistance: number;
    currentIllumination: number;
    nextDistances: number[];
    nextIlluminations: number[];
    previousDistances: number[];
    previousIlluminations: number[];
  }): boolean {
    const { currentBrightness, nextBrightnesses, previousBrightnesses } =
      this.getBrightnesses(args);

    return (
      currentBrightness > Math.max(...previousBrightnesses) &&
      currentBrightness >= Math.max(...nextBrightnesses)
    );
  }

  // 🔵 Brightness helpers

  private isEastern(args: {
    currentLongitudePlanet: number;
    currentLongitudeSun: number;
  }): boolean {
    return args.currentLongitudePlanet > args.currentLongitudeSun;
  }

  private isEasternBrightest(args: {
    currentDistance: number;
    currentIllumination: number;
    currentLongitudePlanet: number;
    currentLongitudeSun: number;
    nextDistances: number[];
    nextIlluminations: number[];
    previousDistances: number[];
    previousIlluminations: number[];
  }): boolean {
    return this.isEastern(args) && this.isBrightest(args);
  }

  private isEasternElongation(args: {
    currentLongitudePlanet: number;
    currentLongitudeSun: number;
    nextLongitudePlanet: number;
    nextLongitudeSun: number;
    previousLongitudePlanet: number;
    previousLongitudeSun: number;
  }): boolean {
    return this.isElongation(args) && this.isEastern(args);
  }

  private isElongation(args: {
    currentLongitudePlanet: number;
    currentLongitudeSun: number;
    nextLongitudePlanet: number;
    nextLongitudeSun: number;
    previousLongitudePlanet: number;
    previousLongitudeSun: number;
  }): boolean {
    const {
      currentLongitudePlanet,
      currentLongitudeSun,
      nextLongitudePlanet,
      nextLongitudeSun,
      previousLongitudePlanet,
      previousLongitudeSun,
    } = args;

    return this.mathService.isMaximum({
      current: this.getElongationAngle(
        currentLongitudePlanet,
        currentLongitudeSun,
      ),
      next: this.getElongationAngle(nextLongitudePlanet, nextLongitudeSun),
      previous: this.getElongationAngle(
        previousLongitudePlanet,
        previousLongitudeSun,
      ),
    });
  }

  private isEvening(args: Parameters<PhasesService["isEastern"]>[0]): boolean {
    return this.isEastern(args);
  }

  // 🔵 Elongation helpers

  private isEveningRise(args: {
    currentLongitudePlanet: number;
    currentLongitudeSun: number;
    previousLongitudePlanet: number;
    previousLongitudeSun: number;
  }): boolean {
    return this.isEvening(args) && this.isRise(args);
  }

  private isEveningSet(args: {
    currentLongitudePlanet: number;
    currentLongitudeSun: number;
    previousLongitudePlanet: number;
    previousLongitudeSun: number;
  }): boolean {
    return this.isEvening(args) && this.isSet(args);
  }

  // 🌎 Public Methods

  private isMorning(args: Parameters<PhasesService["isWestern"]>[0]): boolean {
    return this.isWestern(args);
  }

  // 🔵 Rise/Set helpers

  private isMorningRise(args: {
    currentLongitudePlanet: number;
    currentLongitudeSun: number;
    previousLongitudePlanet: number;
    previousLongitudeSun: number;
  }): boolean {
    return this.isMorning(args) && this.isRise(args);
  }

  private isMorningSet(args: {
    currentLongitudePlanet: number;
    currentLongitudeSun: number;
    previousLongitudePlanet: number;
    previousLongitudeSun: number;
  }): boolean {
    return this.isMorning(args) && this.isSet(args);
  }

  private isRise(args: {
    currentLongitudePlanet: number;
    currentLongitudeSun: number;
    previousLongitudePlanet: number;
    previousLongitudeSun: number;
  }): boolean {
    const {
      currentLongitudePlanet,
      currentLongitudeSun,
      previousLongitudePlanet,
      previousLongitudeSun,
    } = args;

    const previousAngle = this.mathService.getAngle(
      previousLongitudePlanet,
      previousLongitudeSun,
    );
    const currentAngle = this.mathService.getAngle(
      currentLongitudePlanet,
      currentLongitudeSun,
    );

    return (
      previousAngle < this.riseSetThreshold &&
      currentAngle >= this.riseSetThreshold
    );
  }

  private isSet(args: {
    currentLongitudePlanet: number;
    currentLongitudeSun: number;
    previousLongitudePlanet: number;
    previousLongitudeSun: number;
  }): boolean {
    const {
      currentLongitudePlanet,
      currentLongitudeSun,
      previousLongitudePlanet,
      previousLongitudeSun,
    } = args;

    const previousAngle = this.mathService.getAngle(
      previousLongitudePlanet,
      previousLongitudeSun,
    );
    const currentAngle = this.mathService.getAngle(
      currentLongitudePlanet,
      currentLongitudeSun,
    );

    return (
      previousAngle > this.riseSetThreshold &&
      currentAngle <= this.riseSetThreshold
    );
  }

  private isWestern(args: {
    currentLongitudePlanet: number;
    currentLongitudeSun: number;
  }): boolean {
    return args.currentLongitudePlanet < args.currentLongitudeSun;
  }

  private isWesternBrightest(args: {
    currentDistance: number;
    currentIllumination: number;
    currentLongitudePlanet: number;
    currentLongitudeSun: number;
    nextDistances: number[];
    nextIlluminations: number[];
    previousDistances: number[];
    previousIlluminations: number[];
  }): boolean {
    return this.isWestern(args) && this.isBrightest(args);
  }

  private isWesternElongation(args: {
    currentLongitudePlanet: number;
    currentLongitudeSun: number;
    nextLongitudePlanet: number;
    nextLongitudeSun: number;
    previousLongitudePlanet: number;
    previousLongitudeSun: number;
  }): boolean {
    return this.isElongation(args) && this.isWestern(args);
  }

  private mapBrightnessArray(
    distances: number[],
    illuminations: number[],
    label: string,
  ): number[] {
    if (distances.length !== illuminations.length) {
      throw new Error(
        `${label} distances and illuminations arrays must have the same length`,
      );
    }
    return distances.map((distance, index) => {
      const illumination = illuminations[index];
      if (illumination === undefined) {
        throw new Error(`Missing illumination at index ${index}`);
      }
      return this.getBrightness({ distance, illumination });
    });
  }

  /**
   * Creates a calendar event for a specific Martian phase.
   *
   * Mars, being an outer planet, has a simpler phase cycle than Venus/Mercury:
   * - Morning Rise: Mars becomes visible before sunrise
   * - Morning Set: Mars sets with the Sun (approaching conjunction)
   * - Evening Rise: Mars becomes visible after sunset
   * - Evening Set: Mars disappears into Sun's glare (conjunction)
   *
   * Mars doesn't have elongation or brightness maxima like inner planets
   * because it can appear at any angular distance from the Sun (up to 180°
   * at opposition).
   *
   * @param args - Event parameters
   * @param timestamp - Exact moment of the phase
   * @param phase - Specific Martian phase type
   * @returns Formatted calendar event with Mars symbol and phase indicator
   * @see {@link symbolByMartianPhase} for phase symbols
   */
  buildMartianPhaseEvent(args: {
    phase: MartianPhase;
    timestamp: Moment;
  }): Event {
    const { phase, timestamp } = args;

    const phaseCapitalized = _.startCase(phase);
    const phaseSymbol = symbolByMartianPhase[phase];

    const description = `Mars ${phaseCapitalized}`;
    const summary = `♂️${phaseSymbol} ${description}`;

    const dateString = this.formatTimeZoneIso(timestamp, "America/New_York");
    this.logger.log(`${summary} at ${dateString}`);

    const martianPhaseEvent: Event = {
      categories: [...PhasesService.categories, "Martian", phaseCapitalized],
      description,
      end: timestamp,
      start: timestamp,
      summary,
    };
    return martianPhaseEvent;
  }

  /**
   * Creates a calendar event for a specific Mercurian phase.
   *
   * Mercury exhibits an 8-phase cycle similar to Venus but with shorter duration
   * due to its faster orbit (88 days vs 225 days):
   * - Morning Rise: Mercury becomes visible before sunrise
   * - Western Brightest: Maximum brilliance as morning star
   * - Western Elongation: Greatest angular distance west of Sun (max 28°)
   * - Morning Set: Mercury sets with the Sun
   * - Evening Rise: Mercury becomes visible after sunset
   * - Eastern Elongation: Greatest angular distance east of Sun (max 28°)
   * - Eastern Brightest: Maximum brilliance as evening star
   * - Evening Set: Mercury disappears into Sun's glare
   *
   * @param args - Event parameters
   * @param timestamp - Exact moment of the phase
   * @param phase - Specific Mercurian phase type
   * @returns Formatted calendar event with Mercury symbol and phase indicator
   * @see {@link symbolByMercurianPhase} for phase symbols
   */
  buildMercurianPhaseEvent(args: {
    phase: MercurianPhase;
    timestamp: Moment;
  }): Event {
    const { phase, timestamp } = args;

    const phaseCapitalized = _.startCase(phase);
    const phaseSymbol = symbolByMercurianPhase[phase];

    const description = `Mercury ${phaseCapitalized}`;
    const summary = `☿${phaseSymbol} ${description}`;

    const dateString = this.formatTimeZoneIso(timestamp, "America/New_York");
    this.logger.log(`${summary} at ${dateString}`);

    const mercurianPhaseEvent: Event = {
      categories: [...PhasesService.categories, "Mercurian", phaseCapitalized],
      description,
      end: timestamp,
      start: timestamp,
      summary,
    };
    return mercurianPhaseEvent;
  }

  /**
   * Creates a calendar event for a specific Venusian phase.
   *
   * Venus exhibits an 8-phase cycle as it orbits the Sun:
   * - Morning Rise: Venus becomes visible before sunrise
   * - Western Brightest: Maximum brilliance as morning star
   * - Western Elongation: Greatest angular distance west of Sun
   * - Morning Set: Venus sets with the Sun (superior conjunction approaching)
   * - Evening Rise: Venus becomes visible after sunset
   * - Eastern Elongation: Greatest angular distance east of Sun
   * - Eastern Brightest: Maximum brilliance as evening star
   * - Evening Set: Venus disappears into Sun's glare (inferior conjunction)
   *
   * @param args - Event parameters
   * @param timestamp - Exact moment of the phase
   * @param phase - Specific Venusian phase type
   * @returns Formatted calendar event with Venus symbol and phase indicator
   * @see {@link symbolByVenusianPhase} for phase symbols
   */
  buildVenusianPhaseEvent(args: {
    phase: VenusianPhase;
    timestamp: Moment;
  }): Event {
    const { phase, timestamp } = args;

    const phaseCapitalized = _.startCase(phase);
    const phaseSymbol = symbolByVenusianPhase[phase];

    const description = `Venus ${phaseCapitalized}`;
    const summary = `♀️${phaseSymbol} ${description}`;

    const dateString = this.formatTimeZoneIso(timestamp, "America/New_York");
    this.logger.log(`${summary} at ${dateString}`);

    const venusianPhaseEvent: Event = {
      categories: [...PhasesService.categories, "Venusian", phaseCapitalized],
      description,
      end: timestamp,
      start: timestamp,
      summary,
    };
    return venusianPhaseEvent;
  }

  /**
   *
   */
  detect(args: DetectPhaseArguments): Event[] {
    const {
      coordinateEphemerisByBody,
      distanceEphemerisByBody,
      illuminationEphemerisByBody,
      minute,
    } = args;
    return [
      ...this.detectVenusianEvents(
        coordinateEphemerisByBody,
        distanceEphemerisByBody,
        illuminationEphemerisByBody,
        minute,
      ),
      ...this.detectMercurianEvents(
        coordinateEphemerisByBody,
        distanceEphemerisByBody,
        illuminationEphemerisByBody,
        minute,
      ),
      ...this.detectMartianEvents(
        coordinateEphemerisByBody,
        distanceEphemerisByBody,
        illuminationEphemerisByBody,
        minute,
      ),
    ];
  }

  /**
   * Converts instantaneous planetary phase events into progressive events.
   *
   * Creates visibility period events by pairing:
   * - Morning Rise → Morning Set (morning star period)
   * - Evening Rise → Evening Set (evening star period)
   *
   * Progressive events span the entire time a planet is visible as a morning
   * or evening star, useful for planning observations or understanding
   * astrological timing.
   *
   * @param events - All events to process (non-planetary-phase events filtered out)
   * @returns Array of visibility progressive events
   * @see {@link pairProgressiveEvents} for rise/set pairing logic
   */
  detectProgressive(events: Event[]): Event[] {
    const progressiveEvents: Event[] = [];

    // Filter to planetary phase events
    const planetaryPhaseEvents = events.filter((event) =>
      event.categories.includes("Planetary Phase"),
    );

    // Process Venus phases
    const venusianPhaseEvents = planetaryPhaseEvents.filter((event) =>
      event.categories.includes("Venusian"),
    );
    progressiveEvents.push(
      ...this.getVenusianPhaseProgressiveEvents(venusianPhaseEvents),
    );

    // Process Mercury phases
    const mercurianPhaseEvents = planetaryPhaseEvents.filter((event) =>
      event.categories.includes("Mercurian"),
    );
    progressiveEvents.push(
      ...this.getMercurianPhaseProgressiveEvents(mercurianPhaseEvents),
    );

    // Process Mars phases
    const martianPhaseEvents = planetaryPhaseEvents.filter((event) =>
      event.categories.includes("Martian"),
    );
    progressiveEvents.push(
      ...this.getMartianPhaseProgressiveEvents(martianPhaseEvents),
    );

    return progressiveEvents;
  }

  /**
   *
   */
  getMartianPhaseEvents(args: {
    marsCoordinateEphemeris: CoordinateEphemeris;
    marsDistanceEphemeris: DistanceEphemeris;
    marsIlluminationEphemeris: IlluminationEphemeris;
    minute: Moment;
    sunCoordinateEphemeris: CoordinateEphemeris;
  }): Event[] {
    const {
      marsCoordinateEphemeris,
      marsDistanceEphemeris,
      marsIlluminationEphemeris,
      minute,
      sunCoordinateEphemeris,
    } = args;

    const parameters = this.gatherPhaseParameters(
      marsCoordinateEphemeris,
      sunCoordinateEphemeris,
      marsDistanceEphemeris,
      marsIlluminationEphemeris,
      minute,
    );

    return this.detectMartianPhases(parameters, minute);
  }

  /**
   *
   */
  getMercurianPhaseEvents(args: {
    mercuryCoordinateEphemeris: CoordinateEphemeris;
    mercuryDistanceEphemeris: DistanceEphemeris;
    mercuryIlluminationEphemeris: IlluminationEphemeris;
    minute: Moment;
    sunCoordinateEphemeris: CoordinateEphemeris;
  }): Event[] {
    const {
      mercuryCoordinateEphemeris,
      mercuryDistanceEphemeris,
      mercuryIlluminationEphemeris,
      minute,
      sunCoordinateEphemeris,
    } = args;

    const parameters = this.gatherPhaseParameters(
      mercuryCoordinateEphemeris,
      sunCoordinateEphemeris,
      mercuryDistanceEphemeris,
      mercuryIlluminationEphemeris,
      minute,
    );

    return [
      ...this.detectMercurianMorningPhases(parameters, minute),
      ...this.detectMercurianEveningPhases(parameters, minute),
    ];
  }

  /**
   *
   */
  getVenusianPhaseEvents(args: {
    minute: Moment;
    sunCoordinateEphemeris: CoordinateEphemeris;
    venusCoordinateEphemeris: CoordinateEphemeris;
    venusDistanceEphemeris: DistanceEphemeris;
    venusIlluminationEphemeris: IlluminationEphemeris;
  }): Event[] {
    const {
      minute,
      sunCoordinateEphemeris,
      venusCoordinateEphemeris,
      venusDistanceEphemeris,
      venusIlluminationEphemeris,
    } = args;

    const parameters = this.gatherPhaseParameters(
      venusCoordinateEphemeris,
      sunCoordinateEphemeris,
      venusDistanceEphemeris,
      venusIlluminationEphemeris,
      minute,
    );

    return [
      ...this.detectVenusianMorningPhases(parameters, minute),
      ...this.detectVenusianEveningPhases(parameters, minute),
    ];
  }
}
