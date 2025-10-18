import _ from "npm:lodash";
import type { Moment } from "npm:moment";
import { getCalendar, type Event } from "../../calendar.utilities.ts";
import type { EventTemplate } from "../../calendar.utilities.ts";
import type { CoordinateEphemeris } from "../../ephemeris/ephemeris.types.ts";
import type {
  OrbitalDirection,
  RetrogradeBody,
  OrbitalDirectionSymbol,
  RetrogradeBodySymbol,
} from "../../symbols.constants.ts";
import {
  symbolByBody,
  symbolByOrbitalDirection,
} from "../../symbols.constants.ts";
import { MARGIN_MINUTES } from "../../main.ts";
import { isDirect, isRetrograde } from "./retrogrades.utilities.ts";
import { upsertEvents } from "../../database.utilities.ts";
import { incrementEventsCount, print } from "../../logs/logs.service.tsx";

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
  retrogradeBodies: RetrogradeBody[];
  coordinateEphemerisByBody: Record<RetrogradeBody, CoordinateEphemeris>;
  currentMinute: Moment;
}) {
  const { retrogradeBodies, coordinateEphemerisByBody, currentMinute } = args;
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

  print(`${summary} at ${timestamp.toISOString()}`);
  incrementEventsCount();

  const retrogradeEvent: RetrogradeEvent = {
    start: timestamp,
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
  print(`↩️ Writing ${message}`);

  upsertEvents(retrogradeEvents);

  const retrogradeBodiesString = retrogradeBodies.join(", ");
  const retrogradesCalendar = getCalendar(retrogradeEvents, "Retrogrades ↩️");
  Deno.writeFileSync(
    `./calendars/retrogrades_${retrogradeBodiesString}_${timespan}.ics`,
    new TextEncoder().encode(retrogradesCalendar)
  );

  print(`↩️ Wrote ${message}`);
}
