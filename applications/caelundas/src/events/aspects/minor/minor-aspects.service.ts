import { Injectable } from "@nestjs/common";
import _ from "lodash";

import { minorAspects } from "../../../constants";
import { getCoordinateFromEphemeris } from "../../../ephemeris/ephemeris.service";
import { pairProgressiveEvents } from "../../../progressive.utilities";
import { symbolByBody, symbolByMinorAspect } from "../../../symbols";
import { minorAspectBodies } from "../../../types";
import { getMinorAspect, getMinorAspectPhase } from "../aspects.utilities";

import type { Event } from "../../../calendar.utilities";
import type { CoordinateEphemeris } from "../../../ephemeris/ephemeris.types";
import type {
  AspectPhase,
  Body,
  BodySymbol,
  MinorAspect,
  MinorAspectSymbol,
} from "../../../types";
import type { Moment } from "moment-timezone";


@Injectable()
export class MinorAspectsService {
  /**
   * Detects minor aspect events within a single minute time window.
   *
   * Scans all configured body pairs for minor aspects (semi-sextile 30°,
   * semi-square 45°, sesquiquadrate 135°, quincunx 150°) and determines
   * the phase (forming, exact, or dissolving) based on comparison with
   * adjacent minutes.
   *
   * Minor aspects are weaker harmonic relationships that add nuance to
   * astrological interpretations. They use smaller orbs than major aspects
   * (typically ±2-3° vs ±8-10°).
   *
   * @param args - Configuration object
   * @param coordinateEphemerisByBody - Pre-computed ephemeris data for all bodies
   * @param minute - The minute to check for aspect events
   * @returns Array of calendar events for all detected minor aspects at this minute
   * @see {@link getMinorAspect} for aspect type detection
   * @see {@link getMinorAspectPhase} for phase determination
   * @see {@link minorAspectBodies} for configured body list
   */
  detect(args: {
    coordinateEphemerisByBody: Record<Body, CoordinateEphemeris>;
    minute: Moment;
  }): Event[] {
    const { coordinateEphemerisByBody, minute } = args;

    const previousMinute = minute.clone().subtract(1, "minute");
    const nextMinute = minute.clone().add(1, "minute");

    const minorAspectEvents: Event[] = [];

    for (const body1 of minorAspectBodies) {
      const index = minorAspectBodies.indexOf(body1);
      for (const body2 of minorAspectBodies.slice(index + 1)) {
        if (body1 === body2) {
          continue;
        }

        const ephemerisBody1 = coordinateEphemerisByBody[body1];
        const ephemerisBody2 = coordinateEphemerisByBody[body2];

        const currentLongitudeBody1 = getCoordinateFromEphemeris(
          ephemerisBody1,
          minute.toISOString(),
          "longitude",
        );
        const currentLongitudeBody2 = getCoordinateFromEphemeris(
          ephemerisBody2,
          minute.toISOString(),
          "longitude",
        );
        const previousLongitudeBody1 = getCoordinateFromEphemeris(
          ephemerisBody1,
          previousMinute.toISOString(),
          "longitude",
        );
        const previousLongitudeBody2 = getCoordinateFromEphemeris(
          ephemerisBody2,
          previousMinute.toISOString(),
          "longitude",
        );
        const nextLongitudeBody1 = getCoordinateFromEphemeris(
          ephemerisBody1,
          nextMinute.toISOString(),
          "longitude",
        );
        const nextLongitudeBody2 = getCoordinateFromEphemeris(
          ephemerisBody2,
          nextMinute.toISOString(),
          "longitude",
        );

        const phase = getMinorAspectPhase({
          currentLongitudeBody1,
          currentLongitudeBody2,
          previousLongitudeBody1,
          previousLongitudeBody2,
          nextLongitudeBody1,
          nextLongitudeBody2,
        });

        if (phase) {
          minorAspectEvents.push(
            this.buildMinorAspectEvent({
              timestamp: minute,
              longitudeBody1: currentLongitudeBody1,
              longitudeBody2: currentLongitudeBody2,
              body1,
              body2,
              phase,
            }),
          );
        }
      }
    }

    return minorAspectEvents;
  }

  /**
   * Creates a calendar event for a specific minor aspect occurrence.
   *
   * Formats the event with appropriate emoji indicators, body symbols,
   * and categorization for filtering and organization.
   *
   * @param args - Event parameters
   * @param longitudeBody1 - Ecliptic longitude of first body in degrees
   * @param longitudeBody2 - Ecliptic longitude of second body in degrees
   * @param timestamp - Exact moment of the aspect phase
   * @param body1 - First celestial body
   * @param body2 - Second celestial body
   * @param phase - Aspect phase: forming, exact, or dissolving
   * @returns Formatted calendar event with summary, description, and categories
   * @throws When no valid minor aspect is detected between the bodies
   * @see {@link getMinorAspect} for aspect type determination
   */
  buildMinorAspectEvent(args: {
    longitudeBody1: number;
    longitudeBody2: number;
    timestamp: Moment;
    body1: Body;
    body2: Body;
    phase: AspectPhase;
  }): Event {
    const { longitudeBody1, longitudeBody2, timestamp, body1, body2, phase } =
      args;
    const minorAspect = getMinorAspect({ longitudeBody1, longitudeBody2 });
    if (!minorAspect) {
      console.error(
        `No minor aspect found between ${body1} and ${body2} at ${timestamp.toISOString()}: ${longitudeBody1} and ${longitudeBody2}`,
      );
      throw new Error("No minor aspect found");
    }

    const body1Capitalized = _.startCase(body1) as Capitalize<Body>;
    const body2Capitalized = _.startCase(body2) as Capitalize<Body>;

    const body1Symbol = symbolByBody[body1] as BodySymbol;
    const body2Symbol = symbolByBody[body2] as BodySymbol;
    const minorAspectSymbol = symbolByMinorAspect[minorAspect as MinorAspect];

    let description: string;
    let phaseEmoji: string;
    let categories: string[];

    const baseCategories = [
      "Astronomy",
      "Astrology",
      "Simple Aspect",
      "Minor Aspect",
      body1Capitalized,
      body2Capitalized,
      _.startCase(minorAspect),
    ];

    if (phase === "perfective") {
      description = `${body1Capitalized} perfective ${minorAspect} ${body2Capitalized}`;
      phaseEmoji = "🎯";
      categories = [...baseCategories, "Perfective"];
    } else if (phase === "forming") {
      description = `${body1Capitalized} forming ${minorAspect} ${body2Capitalized}`;
      phaseEmoji = "➡️";
      categories = [...baseCategories, "Forming"];
    } else {
      description = `${body1Capitalized} dissolving ${minorAspect} ${body2Capitalized}`;
      phaseEmoji = "⬅️";
      categories = [...baseCategories, "Dissolving"];
    }

    const summary = `${phaseEmoji} ${body1Symbol} ${minorAspectSymbol} ${body2Symbol} ${description}`;

    console.log(`${summary} at ${timestamp.toISOString()}`);

    const minorAspectEvent: Event = {
      start: timestamp,
      end: timestamp,
      description,
      summary,
      categories,
    };
    return minorAspectEvent;
  }

  /**
   * Converts instantaneous minor aspect events into progressive events.
   *
   * Pairs forming and dissolving events for the same body-aspect combination
   * to create events spanning the entire active period of each aspect.
   * Progressive events show when an aspect is in orb rather than just boundary moments.
   *
   * @param events - All events to process (non-aspect events are filtered out)
   * @returns Array of progressive events spanning from forming to dissolving
   * @see {@link pairProgressiveEvents} for forming/dissolving pairing logic
   */
  detectProgressive(events: Event[]): Event[] {
    const progressiveEvents: Event[] = [];

    // Filter to minor aspect events only
    const minorAspectEvents = events.filter((event) =>
      event.categories.includes("Minor Aspect"),
    );

    // Group by body pair and aspect type using categories
    const groupedEvents = _.groupBy(minorAspectEvents, (event) => {
      const planets = _.sortBy(
        event.categories.filter((category) =>
          minorAspectBodies
            .map((minorAspectBody) => _.startCase(minorAspectBody))
            .includes(category),
        ),
      );

      const aspect = event.categories.find((category) =>
        minorAspects
          .map((minorAspect) => _.startCase(minorAspect))
          .includes(category),
      );

      if (planets.length === 2 && aspect) {
        return `${planets[0]}-${aspect}-${planets[1]}`;
      }
      return "";
    });

    // Process each group
    for (const [key, groupEvents] of Object.entries(groupedEvents)) {
      if (!key) {
        continue;
      }

      const formingEvents = groupEvents.filter((event) =>
        event.categories.includes("Forming"),
      );
      const dissolvingEvents = groupEvents.filter((event) =>
        event.categories.includes("Dissolving"),
      );

      const pairs = pairProgressiveEvents(
        formingEvents,
        dissolvingEvents,
        `minor aspect ${key}`,
      );

      progressiveEvents.push(
        ...pairs.map(([beginning, ending]) =>
          this.getMinorAspectProgressiveEvent(beginning, ending),
        ),
      );
    }

    return progressiveEvents;
  }

  private getMinorAspectProgressiveEvent(beginning: Event, ending: Event): Event {
    const bodiesCapitalized = _.sortBy(
      beginning.categories.filter((category) =>
        minorAspectBodies
          .map((minorAspectBody) => _.startCase(minorAspectBody))
          .includes(category),
      ),
    );

    const aspectCapitalized = beginning.categories.find((category) =>
      minorAspects
        .map((minorAspect) => _.startCase(minorAspect))
        .includes(category),
    );

    if (bodiesCapitalized.length !== 2 || !aspectCapitalized) {
      throw new Error(
        `Could not extract aspect info from categories: ${beginning.categories.join(
          ", ",
        )}`,
      );
    }

    const body1Capitalized = bodiesCapitalized[0] ?? "";
    const body2Capitalized = bodiesCapitalized[1] ?? "";
    const aspect = aspectCapitalized.toLowerCase() as MinorAspect;

    const body1 = body1Capitalized.toLowerCase() as Body;
    const body2 = body2Capitalized.toLowerCase() as Body;

    const body1Symbol = symbolByBody[body1] as BodySymbol;
    const body2Symbol = symbolByBody[body2] as BodySymbol;
    const aspectSymbol = symbolByMinorAspect[aspect] as MinorAspectSymbol;

    return {
      start: beginning.start,
      end: ending.start,
      summary: `${body1Symbol}${aspectSymbol}${body2Symbol} ${body1Capitalized} ${aspect} ${body2Capitalized}`,
      description: `${body1Capitalized} ${aspect} ${body2Capitalized}`,
      categories: [
        "Astronomy",
        "Astrology",
        "Simple Aspect",
        "Minor Aspect",
        body1Capitalized,
        body2Capitalized,
        aspectCapitalized,
      ],
    };
  }
}
