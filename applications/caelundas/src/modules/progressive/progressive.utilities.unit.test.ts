import moment from "moment-timezone";
import { beforeEach, describe, expect, it } from "vitest";

import { ProgressiveUtilities } from "./progressive.utilities";

import type { Event } from "@caelundas/src/modules/calendar/calendar.types";

describe(ProgressiveUtilities, () => {
  const logger = {
    setContext: vi.fn<(context: string) => void>(),
    warn: vi.fn<(message: string) => void>(),
  };
  const service = new ProgressiveUtilities(logger as never);

  const createEvent = (iso: string): Event => ({
    categories: ["Astronomy"],
    description: "Event",
    end: moment.utc(iso),
    start: moment.utc(iso),
    summary: "Event",
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("pairs matching beginnings and endings", () => {
    const beginning = createEvent("2024-03-21T10:00:00.000Z");
    const ending = createEvent("2024-03-21T12:00:00.000Z");

    const pairs = service.pairProgressiveEvents([beginning], [ending], "matching");

    expect(pairs).toStrictEqual([[beginning, ending]]);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("warns on unequal counts and skips undefined pair entries", () => {
    const beginning = createEvent("2024-03-21T10:00:00.000Z");
    const ending = createEvent("2024-03-21T12:00:00.000Z");
    const extraEnding = createEvent("2024-03-21T13:00:00.000Z");
    const thirdEnding = createEvent("2024-03-21T14:00:00.000Z");

    const pairs = service.pairProgressiveEvents(
      [beginning, undefined as unknown as Event],
      [ending, extraEnding, thirdEnding],
      "unequal",
    );

    expect(pairs).toStrictEqual([[beginning, ending]]);
    expect(logger.warn).toHaveBeenCalledWith(
      'pairProgressiveEvents: unequal counts for "unequal": 2 beginnings, 3 endings',
    );
  });
});
