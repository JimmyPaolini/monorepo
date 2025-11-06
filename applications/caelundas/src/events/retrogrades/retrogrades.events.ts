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
    categories: ["Astronomy", "Astrology", "Retrogrades"],
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
