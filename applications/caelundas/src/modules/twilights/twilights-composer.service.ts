import { ProgressiveUtilities } from "@caelundas/src/modules/progressive/progressive.utilities";
import { Injectable } from "@nestjs/common";

import { TwilightsBuilderService } from "./twilights-builder.service.js";

import type { Event } from "@caelundas/src/modules/calendar/calendar.types";

/**
 *
 */
@Injectable()
export class TwilightsComposerService {
  constructor(
    private readonly twilightsBuilderService: TwilightsBuilderService,
    private readonly progressiveUtilitiesService: ProgressiveUtilities,
  ) {}

  /**
   *
   */
  buildDawnProgressiveEvents(
    astronomicalDawnEvents: Event[],
    nauticalDawnEvents: Event[],
    civilDawnEvents: Event[],
  ): Event[] {
    return [
      ...this.pairAndBuild({
        beginnings: astronomicalDawnEvents,
        builder: (beginning, ending) =>
          this.twilightsBuilderService.getAstronomicalTwilightMorningDurationEvent(
            beginning,
            ending,
          ),
        endings: nauticalDawnEvents,
        label: "Astronomical Twilight (Morning)",
      }),
      ...this.pairAndBuild({
        beginnings: nauticalDawnEvents,
        builder: (beginning, ending) =>
          this.twilightsBuilderService.getNauticalTwilightMorningDurationEvent(
            beginning,
            ending,
          ),
        endings: civilDawnEvents,
        label: "Nautical Twilight (Morning)",
      }),
    ];
  }

  /**
   *
   */
  buildDuskProgressiveEvents(args: {
    astronomicalDuskEvents: Event[];
    civilDawnEvents: Event[];
    civilDuskEvents: Event[];
    nauticalDuskEvents: Event[];
  }): Event[] {
    const {
      astronomicalDuskEvents,
      civilDawnEvents,
      civilDuskEvents,
      nauticalDuskEvents,
    } = args;

    return [
      ...this.pairAndBuild({
        beginnings: civilDawnEvents,
        builder: (beginning, ending) =>
          this.twilightsBuilderService.getDaylightDurationEvent(
            beginning,
            ending,
          ),
        endings: civilDuskEvents,
        label: "Daylight",
      }),
      ...this.pairAndBuild({
        beginnings: civilDuskEvents,
        builder: (beginning, ending) =>
          this.twilightsBuilderService.getNauticalTwilightEveningDurationEvent(
            beginning,
            ending,
          ),
        endings: nauticalDuskEvents,
        label: "Nautical Twilight (Evening)",
      }),
      ...this.pairAndBuild({
        beginnings: nauticalDuskEvents,
        builder: (beginning, ending) =>
          this.twilightsBuilderService.getAstronomicalTwilightEveningDurationEvent(
            beginning,
            ending,
          ),
        endings: astronomicalDuskEvents,
        label: "Astronomical Twilight (Evening)",
      }),
    ];
  }

  /**
   *
   */
  pairAndBuild(args: {
    beginnings: Event[];
    builder: (beginning: Event, ending: Event) => Event;
    endings: Event[];
    label: string;
  }): Event[] {
    const { beginnings, builder, endings, label } = args;
    const pairs = this.progressiveUtilitiesService.pairProgressiveEvents(
      beginnings,
      endings,
      label,
    );

    return pairs.map(([beginning, ending]) => builder(beginning, ending));
  }
}
