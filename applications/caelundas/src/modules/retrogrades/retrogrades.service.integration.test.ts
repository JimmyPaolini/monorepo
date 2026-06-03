import {
  MARGIN_MINUTES,
  retrogradeBodies,
} from "@caelundas/src/modules/caelundas/caelundas.constants";
import { EphemerisService } from "@caelundas/src/modules/ephemeris/ephemeris.service";
import { LoggerService } from "@caelundas/src/modules/logger/logger.service";
import { MathService } from "@caelundas/src/modules/math/math.service";
import { ProgressiveUtilities } from "@caelundas/src/modules/progressive/progressive.utilities";
import { Test } from "@nestjs/testing";
import moment, { type Moment } from "moment-timezone";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { RetrogradesService } from "./retrogrades.service";

import type { RetrogradeBody } from "@caelundas/src/modules/caelundas/caelundas.types";
import type { CoordinateEphemeris } from "@caelundas/src/modules/ephemeris/ephemeris.types";

/**
 * Integration tests for planetary station detection (retrograde and direct).
 *
 * These tests verify the full detection pipeline using carefully constructed
 * 61-minute longitude windows (MARGIN_MINUTES before and after the current minute)
 * for all retrogradeBodies simultaneously.
 *
 * Unlike unit tests, which spy on private predicates (`isRetrograde`, `isDirect`)
 * via a NestJS TestingModule, these tests use a NestJS TestingModule without spies
 * and validate the event shape produced by the real detection logic.
 *
 * The station detection algorithm compares each minute's longitude to the 30
 * preceding and 30 following values via `normalizeForComparison`. A retrograde
 * station occurs when the planet reaches a longitude maximum (all previous values
 * lower, all next values no higher). A direct station is the inverse minimum.
 */

vi.mock("fs", () => ({
  default: {
    writeFileSync: vi.fn(),
  },
}));

let service: RetrogradesService;

beforeAll(async () => {
  const module = await Test.createTestingModule({
    providers: [
      LoggerService,
      RetrogradesService,
      EphemerisService,
      MathService,
      ProgressiveUtilities,
    ],
  }).compile();
  service = module.get(RetrogradesService);
});

/**
 * Builds a Record<RetrogradeBody, CoordinateEphemeris> across the 61-minute detection
 * window (MARGIN_MINUTES before and after `minute`). Each body maps to its own
 * timestamp-keyed CoordinateEphemeris. Every body defaults to a constant longitude of
 * 100°. An optional override specifies a different `previous` / `current` / `next`
 * pattern for one body so that targeted station scenarios can be tested in isolation.
 */
function createRetrogradeEphemeris(
  minute: Moment,
  override?: {
    body: RetrogradeBody;
    previous: number;
    current: number;
    next: number;
  },
): Record<RetrogradeBody, CoordinateEphemeris> {
  const DEFAULT_LONGITUDE = 100;

  const ephemerisByBody = {} as Record<RetrogradeBody, CoordinateEphemeris>;

  for (const body of retrogradeBodies) {
    const isOverridden = override?.body === body;
    const bodyEphemeris: CoordinateEphemeris = {};

    for (let offset = 1; offset <= MARGIN_MINUTES; offset++) {
      const prevTimestamp = minute
        .clone()
        .subtract(offset, "minutes")
        .toISOString();
      const nextTimestamp = minute.clone().add(offset, "minutes").toISOString();
      const prevLongitude = isOverridden
        ? override.previous
        : DEFAULT_LONGITUDE;
      const nextLongitude = isOverridden ? override.next : DEFAULT_LONGITUDE;

      bodyEphemeris[prevTimestamp] = { longitude: prevLongitude, latitude: 0 };
      bodyEphemeris[nextTimestamp] = { longitude: nextLongitude, latitude: 0 };
    }

    const currentTimestamp = minute.toISOString();
    const currentLongitude = isOverridden
      ? override.current
      : DEFAULT_LONGITUDE;
    bodyEphemeris[currentTimestamp] = {
      longitude: currentLongitude,
      latitude: 0,
    };

    ephemerisByBody[body] = bodyEphemeris;
  }

  return ephemerisByBody;
}

describe("retrogrades.events integration", () => {
  const minute = moment.utc("2024-09-09T12:00:00.000Z");

  it("should detect a Mercury retrograde station when longitude reaches a maximum", () => {
    // isRetrograde: ALL normalizeForComparison(prev, curr) < curr
    //               AND ALL normalizeForComparison(next, curr) <= curr
    // Mercury longitude peaks at 100.0 — all previous and next values are 99.5
    const coordinateEphemerisByBody = createRetrogradeEphemeris(minute, {
      body: "mercury",
      previous: 99.5,
      current: 100,
      next: 99.5,
    });

    const events = service.detect({ coordinateEphemerisByBody, minute });

    expect(events).toHaveLength(1);
    expect(events[0]?.categories).toContain("Direction");
    expect(events[0]?.categories).toContain("Retrograde");
    expect(events[0]?.description).toContain("Mercury Stationary Retrograde");
    expect(events[0]?.start).toEqual(minute);
  });

  it("should detect a Mercury direct station when longitude reaches a minimum", () => {
    // isDirect: ALL normalizeForComparison(prev, curr) > curr
    //           AND ALL normalizeForComparison(next, curr) >= curr
    // Mercury longitude bottoms at 100.0 — all previous and next values are 100.5
    const coordinateEphemerisByBody = createRetrogradeEphemeris(minute, {
      body: "mercury",
      previous: 100.5,
      current: 100,
      next: 100.5,
    });

    const events = service.detect({ coordinateEphemerisByBody, minute });

    expect(events).toHaveLength(1);
    expect(events[0]?.categories).toContain("Direction");
    expect(events[0]?.categories).toContain("Direct");
    expect(events[0]?.description).toContain("Mercury Stationary Direct");
    expect(events[0]?.start).toEqual(minute);
  });

  it("should return no events when all planetary longitudes are constant", () => {
    // Constant longitude of 100° fails both station conditions:
    //   isRetrograde requires prev < curr; 100 < 100 is false
    //   isDirect requires prev > curr; 100 > 100 is false
    const coordinateEphemerisByBody = createRetrogradeEphemeris(minute);

    const events = service.detect({ coordinateEphemerisByBody, minute });

    expect(events).toHaveLength(0);
  });
});
