import fs from "fs";
import _ from "lodash";
import type { Moment } from "moment";
import { getCalendar, type Event } from "../../calendar.utilities";
import type { EventTemplate } from "../../calendar.utilities";
import type { CoordinateEphemeris } from "../../ephemeris/ephemeris.types";
import type {
  OrbitalDirection,
  RetrogradeBody,
  OrbitalDirectionSymbol,
  RetrogradeBodySymbol,
} from "../../constants";
import {
  symbolByBody,
  symbolByOrbitalDirection,
  RETROGRADE_BODIES,
} from "../../constants";
import { MARGIN_MINUTES } from "../../calendar.utilities";
import { isDirect, isRetrograde } from "./retrogrades.utilities";
import { upsertEvents } from "../../database.utilities";
import { getOutputPath } from "../../output.utilities";
import { pairDurationEvents } from "../../duration.utilities";

type RetrogradeDescription =
  `${Capitalize<RetrogradeBody>} Stationary ${Capitalize<OrbitalDirection>}`;
type RetrogradeSummary =
  `${RetrogradeBodySymbol} ${OrbitalDirectionSymbol} ${RetrogradeDescription}`;

export interface RetrogradeEventTemplate extends EventTemplate {
  description: RetrogradeDescription;
  summary: RetrogradeSummary;
}

export interface RetrogradeEvent extends Event {
  description: RetrogradeDescription;
  summary: RetrogradeSummary;
}

export function getRetrogradeEvents(args: {
  coordinateEphemerisByBody: Record<RetrogradeBody, CoordinateEphemeris>;
  currentMinute: Moment;
}) {
  const { coordinateEphemerisByBody, currentMinute } = args;
  const retrogradeBodies = RETROGRADE_BODIES;
  const retrogradeEvents: RetrogradeEvent[] = [];

  for (const body of retrogradeBodies as RetrogradeBody[]) {
    const ephemeris = coordinateEphemerisByBody[body];

    const { longitude: currentLongitude } =
      ephemeris[currentMinute.toISOString()];

    const previousLongitudes = new Array(MARGIN_MINUTES)
      .fill(null)
      .map((_, index) => {
        const date = currentMinute
          .clone()
          .subtract(MARGIN_MINUTES - index, "minute");
        const { longitude: previousLongitude } = ephemeris[date.toISOString()];
        return previousLongitude;
      });

    const nextLongitudes = new Array(MARGIN_MINUTES)
      .fill(null)
      .map((_, index) => {
        const date = currentMinute.clone().add(index + 1, "minute");
        const { longitude: nextLongitude } = ephemeris[date.toISOString()];
        return nextLongitude;
      });

    const timestamp = currentMinute.toDate();
    const longitudes = {
      currentLongitude,
      previousLongitudes,
      nextLongitudes,
    };

    if (isRetrograde({ ...longitudes })) {
      retrogradeEvents.push(
        getRetrogradeEvent({ body, timestamp, direction: "retrograde" })
      );
    }
    if (isDirect({ ...longitudes })) {
      retrogradeEvents.push(
        getRetrogradeEvent({ body, timestamp, direction: "direct" })
      );
    }
  }

  return retrogradeEvents;
}

const categories = ["Astronomy", "Astrology", "Direction"];

export function getRetrogradeEvent(args: {
  body: RetrogradeBody;
  timestamp: Date;
  direction: OrbitalDirection;
}) {
  const { body, timestamp, direction } = args;

  const bodyCapitalized = _.startCase(body) as Capitalize<RetrogradeBody>;
  const orbitalDirectionCapitalized = _.startCase(
    direction
  ) as Capitalize<OrbitalDirection>;

  const retrogradeBodySymbol = symbolByBody[body] as RetrogradeBodySymbol;
  const orbitalDirectionSymbol = symbolByOrbitalDirection[
    direction
  ] as OrbitalDirectionSymbol;

  const description: RetrogradeDescription = `${bodyCapitalized} Stationary ${orbitalDirectionCapitalized}`;
  const summary: RetrogradeSummary = `${retrogradeBodySymbol} ${orbitalDirectionSymbol} ${description}`;

  console.log(`${summary} at ${timestamp.toISOString()}`);

  const retrogradeEvent: RetrogradeEvent = {
    start: timestamp,
    categories: categories.concat(
      direction === "retrograde" ? ["Retrograde"] : ["Direct"]
    ),
    summary,
    description,
  };

  return retrogradeEvent;
}

export function writeRetrogradeEvents(args: {
  end: Date;
  retrogradeBodies: RetrogradeBody[];
  retrogradeEvents: RetrogradeEvent[];
  start: Date;
}) {
  const { retrogradeBodies, retrogradeEvents, start, end } = args;
  if (_.isEmpty(retrogradeEvents)) return;

  const timespan = `${start.toISOString()}-${end.toISOString()}`;
  const message = `${retrogradeEvents.length} retrograde events from ${timespan}`;
  console.log(`↩️ Writing ${message}`);

  upsertEvents(retrogradeEvents);

  const retrogradeBodiesString = retrogradeBodies.join(", ");
  const retrogradesCalendar = getCalendar({
    events: retrogradeEvents,
    name: "Retrogrades ↩️",
  });
  fs.writeFileSync(
    getOutputPath(`retrogrades_${retrogradeBodiesString}_${timespan}.ics`),
    new TextEncoder().encode(retrogradesCalendar)
  );

  console.log(`↩️ Wrote ${message}`);
}

export function getRetrogradeDurationEvents(events: Event[]): Event[] {
  const durationEvents: Event[] = [];

  const retrogradeEvents = events.filter((event) =>
    event.categories.includes("Direction")
  ) as RetrogradeEvent[];

  // Process each planet separately
  for (const planet of RETROGRADE_BODIES) {
    const beginnings = retrogradeEvents.filter((event) =>
      event.description.includes(`Retrograde`)
    );
    const endings = retrogradeEvents.filter((event) =>
      event.description.includes(`Direct`)
    );

    const pairs = pairDurationEvents(
      beginnings,
      endings,
      `${planet} retrograde`
    );

    durationEvents.push(
      ...pairs.map(([beginning, ending]) =>
        getRetrogradeDurationEvent(beginning, ending, planet)
      )
    );
  }

  return durationEvents;
}

function getRetrogradeDurationEvent(
  beginningEvent: RetrogradeEvent,
  endingEvent: RetrogradeEvent,
  planet: RetrogradeBody
): Event {
  const start = beginningEvent.start;
  const end = endingEvent.start;

  const planetCapitalized = planet.charAt(0).toUpperCase() + planet.slice(1);

  // Extract planet symbol from beginning event summary (first non-whitespace character sequence)
  const symbolMatch = beginningEvent.summary.match(/^(\S+)/);
  const symbol = symbolMatch ? symbolMatch[1] : "";

  return {
    start,
    end,
    summary: `${symbol} ↩️ ${planetCapitalized} Retrograde`,
    description: `${planetCapitalized} Retrograde`,
    categories: ["Astronomy", "Astrology", "Retrogrades"],
  };
}
