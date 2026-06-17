import { Injectable } from "@nestjs/common";

import { LoggerService } from "../logger/logger.service";

import type { Event } from "@caelundas/src/modules/calendar/calendar.types";
import type { Moment } from "moment-timezone";

/**
 *
 */
@Injectable()
export class TwilightsBuilderService {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext(TwilightsBuilderService.name);
  }

  private static readonly twilightBaseCategories = [
    "Astronomy",
    "Astrology",
    "Twilight",
  ];

  private buildTransitionEvent(
    date: Moment,
    description: string,
    emoji: string,
  ): Event {
    const summary = `${emoji} ${description}`;
    const dateString = date.clone().tz("America/New_York").toISOString(true);
    this.logger.log(`${summary} at ${dateString}`);

    return {
      categories: [
        ...TwilightsBuilderService.twilightBaseCategories,
        description,
      ],
      description,
      end: date,
      start: date,
      summary,
    };
  }

  /**
   *
   */
  buildAstronomicalDawnEvent(date: Moment): Event {
    return this.buildTransitionEvent(date, "Astronomical Dawn", "🌠");
  }

  /**
   *
   */
  buildAstronomicalDuskEvent(date: Moment): Event {
    return this.buildTransitionEvent(date, "Astronomical Dusk", "🌌");
  }

  /**
   *
   */
  buildCivilDawnEvent(date: Moment): Event {
    return this.buildTransitionEvent(date, "Civil Dawn", "🌄");
  }

  /**
   *
   */
  buildCivilDuskEvent(date: Moment): Event {
    return this.buildTransitionEvent(date, "Civil Dusk", "🌇");
  }

  /**
   *
   */
  buildNauticalDawnEvent(date: Moment): Event {
    return this.buildTransitionEvent(date, "Nautical Dawn", "🌅");
  }

  /**
   *
   */
  buildNauticalDuskEvent(date: Moment): Event {
    return this.buildTransitionEvent(date, "Nautical Dusk", "🌉");
  }

  /**
   *
   */
  getAstronomicalTwilightEveningDurationEvent(
    beginning: Event,
    ending: Event,
  ): Event {
    return {
      categories: [
        ...TwilightsBuilderService.twilightBaseCategories,
        "Astronomical Twilight",
        "Evening",
      ],
      description: "Astronomical Twilight (Evening)",
      end: ending.start,
      start: beginning.start,
      summary: "🌌 Astronomical Twilight (Evening)",
    };
  }

  /**
   *
   */
  getAstronomicalTwilightMorningDurationEvent(
    beginning: Event,
    ending: Event,
  ): Event {
    return {
      categories: [
        ...TwilightsBuilderService.twilightBaseCategories,
        "Astronomical Twilight",
        "Morning",
      ],
      description: "Astronomical Twilight (Morning)",
      end: ending.start,
      start: beginning.start,
      summary: "🌠 Astronomical Twilight (Morning)",
    };
  }

  /**
   *
   */
  getDaylightDurationEvent(beginning: Event, ending: Event): Event {
    return {
      categories: [
        ...TwilightsBuilderService.twilightBaseCategories,
        "Daylight",
      ],
      description: "Daylight",
      end: ending.start,
      start: beginning.start,
      summary: "☀️ Daylight",
    };
  }

  /**
   *
   */
  getNauticalTwilightEveningDurationEvent(
    beginning: Event,
    ending: Event,
  ): Event {
    return {
      categories: [
        ...TwilightsBuilderService.twilightBaseCategories,
        "Nautical Twilight",
        "Evening",
      ],
      description: "Nautical Twilight (Evening)",
      end: ending.start,
      start: beginning.start,
      summary: "🌉 Nautical Twilight (Evening)",
    };
  }

  /**
   *
   */
  getNauticalTwilightMorningDurationEvent(
    beginning: Event,
    ending: Event,
  ): Event {
    return {
      categories: [
        ...TwilightsBuilderService.twilightBaseCategories,
        "Nautical Twilight",
        "Morning",
      ],
      description: "Nautical Twilight (Morning)",
      end: ending.start,
      start: beginning.start,
      summary: "🌅 Nautical Twilight (Morning)",
    };
  }

  /**
   *
   */
  getNightDurationEvent(beginning: Event, ending: Event): Event {
    return {
      categories: [...TwilightsBuilderService.twilightBaseCategories, "Night"],
      description: "Night",
      end: ending.start,
      start: beginning.start,
      summary: "🌃 Night",
    };
  }
}
