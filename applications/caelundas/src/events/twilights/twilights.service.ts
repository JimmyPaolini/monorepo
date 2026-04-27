import { Injectable } from "@nestjs/common";

import { getAzimuthElevationFromEphemeris } from "../../ephemeris/ephemeris.service";
import { pairProgressiveEvents } from "../../progressive.utilities";

import {
    isAstronomicalDawn,
    isAstronomicalDusk,
    isCivilDawn,
    isCivilDusk,
    isNauticalDawn,
    isNauticalDusk,
} from "./twilights.utilities";

import type { Event } from "../../calendar.utilities";
import type { AzimuthElevationEphemeris } from "../../ephemeris/ephemeris.types";
import type { Moment } from "moment-timezone";

const categories = ["Astronomy", "Astrology", "Twilight"];

// #region 🕑 Progressive Events


@Injectable()
export class TwilightsService {
  /**
   * Detects twilight transition events at a specific minute.
   *
   * Identifies six daily twilight transitions based on solar depression angles:
   * - Astronomical dawn/dusk (18° below horizon)
   * - Nautical dawn/dusk (12° below horizon)
   * - Civil dawn/dusk (6° below horizon)
   *
   * @param args - Configuration object
   * @param currentMinute - The specific minute to analyze
   * @param sunAzimuthElevationEphemeris - Pre-computed Sun position data
   * @returns Array of detected twilight events (0-1 events per minute)
   * @see {@link isAstronomicalDawn} and related functions for detection
   * @see {@link degreesByTwilight} for threshold definitions
   *
   * @remarks
   * Twilight periods are important for:
   * - Photography (golden hour, blue hour)
   * - Astronomy (observing windows)
   * - Navigation (marine twilight)
   * - Daily rhythm (circadian cycles)
   */
  detect(args: {
    minute: Moment;
    sunAzimuthElevationEphemeris: AzimuthElevationEphemeris;
  }): Event[] {
    const { minute, sunAzimuthElevationEphemeris } = args;

    const twilightEvents: Event[] = [];

    const previousMinute = minute.clone().subtract(1, "minute");

    const currentElevation = getAzimuthElevationFromEphemeris(
      sunAzimuthElevationEphemeris,
      minute.toISOString(),
      "elevation",
    );
    const previousElevation = getAzimuthElevationFromEphemeris(
      sunAzimuthElevationEphemeris,
      previousMinute.toISOString(),
      "elevation",
    );

    const elevations = { currentElevation, previousElevation };
    const date = minute;

    if (isAstronomicalDawn({ ...elevations })) {
      twilightEvents.push(this.buildAstronomicalDawnEvent(date));
    }
    if (isNauticalDawn({ ...elevations })) {
      twilightEvents.push(this.buildNauticalDawnEvent(date));
    }
    if (isCivilDawn({ ...elevations })) {
      twilightEvents.push(this.buildCivilDawnEvent(date));
    }
    if (isCivilDusk({ ...elevations })) {
      twilightEvents.push(this.buildCivilDuskEvent(date));
    }
    if (isNauticalDusk({ ...elevations })) {
      twilightEvents.push(this.buildNauticalDuskEvent(date));
    }
    if (isAstronomicalDusk({ ...elevations })) {
      twilightEvents.push(this.buildAstronomicalDuskEvent(date));
    }

    return twilightEvents;
  }

  /**
   * Creates an astronomical dawn calendar event.
   * Marks when the sky begins to lighten (Sun at -18° elevation).
   * @param date - Precise UTC time
   * @returns Calendar event for astronomical dawn
   */
  buildAstronomicalDawnEvent(date: Moment): Event {
    const description = "Astronomical Dawn";
    const summary = `🌠 ${description}`;

    const dateString = date.clone().tz("America/New_York").toISOString(true);
    console.log(`${summary} at ${dateString}`);

    const astronomicalDawnEvent: Event = {
      start: date,
      end: date,
      summary,
      description,
      categories: [...categories, "Astronomical Dawn"],
    };
    return astronomicalDawnEvent;
  }

  /**
   *
   */
  buildNauticalDawnEvent(date: Moment): Event {
    const description = "Nautical Dawn";
    const summary = `🌅 ${description}`;

    const dateString = date.clone().tz("America/New_York").toISOString(true);
    console.log(`${summary} at ${dateString}`);

    const nauticalDawnEvent: Event = {
      start: date,
      end: date,
      summary,
      description,
      categories: [...categories, "Nautical Dawn"],
    };
    return nauticalDawnEvent;
  }

  /**
   *
   */
  buildCivilDawnEvent(date: Moment): Event {
    const description = "Civil Dawn";
    const summary = `🌄 ${description}`;

    const dateString = date.clone().tz("America/New_York").toISOString(true);
    console.log(`${summary} at ${dateString}`);

    const civilDawnEvent: Event = {
      start: date,
      end: date,
      summary,
      description,
      categories: [...categories, "Civil Dawn"],
    };
    return civilDawnEvent;
  }

  /**
   *
   */
  buildCivilDuskEvent(date: Moment): Event {
    const description = "Civil Dusk";
    const summary = `🌇 ${description}`;

    const dateString = date.clone().tz("America/New_York").toISOString(true);
    console.log(`${summary} at ${dateString}`);

    const civilDuskEvent: Event = {
      start: date,
      end: date,
      summary,
      description,
      categories: [...categories, "Civil Dusk"],
    };
    return civilDuskEvent;
  }

  /**
   *
   */
  buildNauticalDuskEvent(date: Moment): Event {
    const description = "Nautical Dusk";
    const summary = `🌉 ${description}`;

    const dateString = date.clone().tz("America/New_York").toISOString(true);
    console.log(`${summary} at ${dateString}`);

    const nauticalDuskEvent: Event = {
      start: date,
      end: date,
      summary,
      description,
      categories: [...categories, "Nautical Dusk"],
    };
    return nauticalDuskEvent;
  }

  /**
   *
   */
  buildAstronomicalDuskEvent(date: Moment): Event {
    const description = "Astronomical Dusk";
    const summary = `🌌 ${description}`;

    const dateString = date.clone().tz("America/New_York").toISOString(true);
    console.log(`${summary} at ${dateString}`);

    const astronomicalDuskEvent: Event = {
      start: date,
      end: date,
      summary,
      description,
      categories: [...categories, "Astronomical Dusk"],
    };
    return astronomicalDuskEvent;
  }

  /**
   * Generates progressive events for twilight periods.
   *
   * Creates span events for six twilight periods plus full night and daylight:
   * - Astronomical twilight (morning/evening)
   * - Nautical twilight (morning/evening)
   * - Daylight (civil dawn to civil dusk)
   * - Night (astronomical dusk to astronomical dawn)
   *
   * @param events - Array of all twilight events
   * @returns Array of progressive events representing twilight spans
   * @see {@link pairProgressiveEvents} for pairing logic
   */
  detectProgressive(events: Event[]): Event[] {
    const progressiveEvents: Event[] = [];

    // Filter to twilight events only
    const twilightEvents = events.filter((event) =>
      event.categories.includes("Twilight"),
    );

    // Astronomical Twilight (morning): Astronomical Dawn → Nautical Dawn
    const astronomicalDawnEvents = twilightEvents.filter((event) =>
      event.categories.includes("Astronomical Dawn"),
    );
    const nauticalDawnEvents = twilightEvents.filter((event) =>
      event.categories.includes("Nautical Dawn"),
    );
    const astronomicalTwilightMorningPairs = pairProgressiveEvents(
      astronomicalDawnEvents,
      nauticalDawnEvents,
      "Astronomical Twilight (Morning)",
    );
    for (const [beginning, ending] of astronomicalTwilightMorningPairs) {
      progressiveEvents.push(
        this.getAstronomicalTwilightMorningDurationEvent(beginning, ending),
      );
    }

    // Nautical Twilight (morning): Nautical Dawn → Civil Dawn
    const civilDawnEvents = twilightEvents.filter((event) =>
      event.categories.includes("Civil Dawn"),
    );
    const nauticalTwilightMorningPairs = pairProgressiveEvents(
      nauticalDawnEvents,
      civilDawnEvents,
      "Nautical Twilight (Morning)",
    );
    for (const [beginning, ending] of nauticalTwilightMorningPairs) {
      progressiveEvents.push(
        this.getNauticalTwilightMorningDurationEvent(beginning, ending),
      );
    }

    // Daylight: Civil Dawn → Civil Dusk
    const civilDuskEvents = twilightEvents.filter((event) =>
      event.categories.includes("Civil Dusk"),
    );
    const daylightPairs = pairProgressiveEvents(
      civilDawnEvents,
      civilDuskEvents,
      "Daylight",
    );
    for (const [beginning, ending] of daylightPairs) {
      progressiveEvents.push(this.getDaylightDurationEvent(beginning, ending));
    }

    // Nautical Twilight (evening): Civil Dusk → Nautical Dusk
    const nauticalDuskEvents = twilightEvents.filter((event) =>
      event.categories.includes("Nautical Dusk"),
    );
    const nauticalTwilightEveningPairs = pairProgressiveEvents(
      civilDuskEvents,
      nauticalDuskEvents,
      "Nautical Twilight (Evening)",
    );
    for (const [beginning, ending] of nauticalTwilightEveningPairs) {
      progressiveEvents.push(
        this.getNauticalTwilightEveningDurationEvent(beginning, ending),
      );
    }

    // Astronomical Twilight (evening): Nautical Dusk → Astronomical Dusk
    const astronomicalDuskEvents = twilightEvents.filter((event) =>
      event.categories.includes("Astronomical Dusk"),
    );
    const astronomicalTwilightEveningPairs = pairProgressiveEvents(
      nauticalDuskEvents,
      astronomicalDuskEvents,
      "Astronomical Twilight (Evening)",
    );
    for (const [beginning, ending] of astronomicalTwilightEveningPairs) {
      progressiveEvents.push(
        this.getAstronomicalTwilightEveningDurationEvent(beginning, ending),
      );
    }

    // Night: Astronomical Dusk → Astronomical Dawn (next day)
    const nightPairs = pairProgressiveEvents(
      astronomicalDuskEvents,
      astronomicalDawnEvents,
      "Night",
    );
    for (const [beginning, ending] of nightPairs) {
      progressiveEvents.push(this.getNightDurationEvent(beginning, ending));
    }

    return progressiveEvents;
  }

  private getAstronomicalTwilightMorningDurationEvent(
    beginning: Event,
    ending: Event,
  ): Event {
    return {
      start: beginning.start,
      end: ending.start,
      summary: "🌠 Astronomical Twilight (Morning)",
      description: "Astronomical Twilight (Morning)",
      categories: [...categories, "Astronomical Twilight", "Morning"],
    };
  }

  private getNauticalTwilightMorningDurationEvent(
    beginning: Event,
    ending: Event,
  ): Event {
    return {
      start: beginning.start,
      end: ending.start,
      summary: "🌅 Nautical Twilight (Morning)",
      description: "Nautical Twilight (Morning)",
      categories: [...categories, "Nautical Twilight", "Morning"],
    };
  }

  private getDaylightDurationEvent(beginning: Event, ending: Event): Event {
    return {
      start: beginning.start,
      end: ending.start,
      summary: "☀️ Daylight",
      description: "Daylight",
      categories: [...categories, "Daylight"],
    };
  }

  private getNauticalTwilightEveningDurationEvent(
    beginning: Event,
    ending: Event,
  ): Event {
    return {
      start: beginning.start,
      end: ending.start,
      summary: "🌉 Nautical Twilight (Evening)",
      description: "Nautical Twilight (Evening)",
      categories: [...categories, "Nautical Twilight", "Evening"],
    };
  }

  private getAstronomicalTwilightEveningDurationEvent(
    beginning: Event,
    ending: Event,
  ): Event {
    return {
      start: beginning.start,
      end: ending.start,
      summary: "🌌 Astronomical Twilight (Evening)",
      description: "Astronomical Twilight (Evening)",
      categories: [...categories, "Astronomical Twilight", "Evening"],
    };
  }

  private getNightDurationEvent(beginning: Event, ending: Event): Event {
    return {
      start: beginning.start,
      end: ending.start,
      summary: "🌃 Night",
      description: "Night",
      categories: [...categories, "Night"],
    };
  }
}
