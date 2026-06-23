import { AspectsUtilities } from "@caelundas/src/modules/aspects/aspects.utilities";
import { aspectBodies as majorAspectBodies } from "@caelundas/src/modules/caelundas/caelundas.constants";
import { EphemerisService } from "@caelundas/src/modules/ephemeris/ephemeris.service";
import { LoggerService } from "@caelundas/src/modules/logger/logger.service";
import { MathService } from "@caelundas/src/modules/math/math.service";
import { ProgressiveUtilitiesService } from "@caelundas/src/modules/progressive/progressive-utilities.service";
import { Test } from "@nestjs/testing";
import moment, { type Moment } from "moment-timezone";
import { beforeAll, describe, expect, it } from "vitest";

import { MajorAspectEventService } from "./major-aspect-event.service";
import { MajorAspectProgressiveService } from "./major-aspect-progressive.service";
import { MajorAspectsService } from "./major-aspects.service";

import type { Body } from "@caelundas/src/modules/caelundas/caelundas.types";
import type { CoordinateEphemeris } from "@caelundas/src/modules/ephemeris/ephemeris.types";

/**
 * Integration tests for major aspect phase detection.
 *
 * These tests verify the full detection pipeline — from raw ephemeris data through
 * angular separation computation to formatted calendar events — for all three phase
 * transitions: forming, perfective, and dissolving.
 *
 * Unlike unit tests, which spy on private helpers (`getMajorAspect`,
 * `getMajorAspectPhase`) via a NestJS TestingModule, these tests use a NestJS
 * TestingModule without spies and assert the complete event shape produced by
 * real orb comparisons and phase-crossing logic.
 *
 * Ephemeris construction strategy:
 *   - All bodies default to longitude 100° (constant across prev/curr/next).
 *     With every pair at 0° separation and constant across three timestamps,
 *     `isBouncing` requires a strict local extremum that flat data cannot satisfy,
 *     so zero events are produced by the base configuration.
 *   - Sun is overridden to 0° constant so that only the body under test
 *     (Moon, Mercury, or Venus) drives events.
 *   - Each test overrides exactly one body to create precise boundary conditions
 *     at the orb entry or exit point, producing a single isolated event.
 *
 * Orb ranges (uses ≤, not <):
 *   conjunction 8°, sextile 4°, square 6°, trine 6°, opposition 8°
 *
 * Phase semantics:
 *   - Forming: previous outside orb, current inside orb
 *   - Perfective: sign change in (angle − aspectAngle) across prev→curr (non-conjunct)
 *                 OR local extremum in the same difference for conjunct
 *   - Dissolving: current inside orb, next outside orb
 */

vi.mock("fs", () => ({
  default: {
    writeFileSync: vi.fn<(path: string, data: string) => void>(),
  },
}));

let service: MajorAspectsService;

/**
 * Builds a CoordinateEphemeris record for all majorAspectBodies across three timestamps.
 *
 * Every body defaults to longitude 100° so the baseline produces no aspect events.
 * Pass `overrides` to set different longitudes for specific bodies at each timestamp.
 */
function createAspectEphemeris(
  minute: Moment,
  overrides: Partial<
    Record<
      (typeof majorAspectBodies)[number],
      { current: number; next: number; previous: number }
    >
  > = {},
): Record<Body, CoordinateEphemeris> {
  const previousMinute = minute.clone().subtract(1, "minute");
  const nextMinute = minute.clone().add(1, "minute");

  const ephemerisByBody = {} as Record<Body, CoordinateEphemeris>;

  for (const body of majorAspectBodies) {
    const override = overrides[body];
    const previous = override?.previous ?? 100;
    const current = override?.current ?? 100;
    const next = override?.next ?? 100;

    ephemerisByBody[body] = {
      [minute.toISOString()]: { latitude: 0, longitude: current },
      [nextMinute.toISOString()]: { latitude: 0, longitude: next },
      [previousMinute.toISOString()]: { latitude: 0, longitude: previous },
    };
  }

  return ephemerisByBody;
}

describe("major-aspects.events integration", () => {
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        LoggerService,
        MajorAspectsService,
        MajorAspectEventService,
        MajorAspectProgressiveService,
        AspectsUtilities,
        EphemerisService,
        MathService,
        ProgressiveUtilitiesService,
      ],
    }).compile();
    service = await module.resolve(MajorAspectsService);
  });

  const minute = moment.utc("2024-03-21T12:00:00.000Z");

  it("detects a perfective trine between non-Sun bodies (Mercury trine Venus)", () => {
    expect.hasAssertions(); // Sun is placed at 200° (constant) so no Sun-centric pairs produce major aspects.

    // Mercury stays at 0° constant; Venus passes through exactly 120° (trine, 6° orb).
    // prevDiff = getAngle(0,121) - 120 = +1, currDiff = getAngle(0,120) - 120 = 0,
    // nextDiff = getAngle(0,119) - 120 = -1 → isCrossing (sign change) → "perfective".
    // Verifies the service scans all combinatorial pairs, not just Sun-centric ones.
    const coordinateEphemerisByBody = createAspectEphemeris(minute, {
      mercury: { current: 0, next: 0, previous: 0 },
      sun: { current: 200, next: 200, previous: 200 },
      venus: { current: 120, next: 119, previous: 121 },
    });

    const events = service.detect({ coordinateEphemerisByBody, minute });

    const mercuryVenusTrine = events.find(
      (e) =>
        e.description.includes("trine") &&
        e.description.includes("Mercury") &&
        e.description.includes("Venus"),
    );

    expect(mercuryVenusTrine).toBeDefined();
    expect(mercuryVenusTrine?.categories).toContain("Perfective");
    expect(mercuryVenusTrine?.start).toStrictEqual(minute);
    expect(events).toHaveLength(1);
  });

  it("detects multiple simultaneous aspect events in a single detect() call", () => {
    expect.hasAssertions(); // Sun at 0°; Moon approaches from 350°→352°→354° (forming conjunction with Sun):

    //   prev: getAngle(0,350)=10° (outside 8° orb), curr: getAngle(0,352)=8° (enters orb, ≤8°)
    // Mercury moves from 93°→94°→97° (dissolving square with Sun):
    //   curr: getAngle(0,94)=94°, |94-90|=4≤6 (in orb), next: getAngle(0,97)=97°, |97-90|=7>6 (exits)
    // Verifies that detect() accumulates events from independent aspect pairs.
    const coordinateEphemerisByBody = createAspectEphemeris(minute, {
      mercury: { current: 94, next: 97, previous: 93 },
      moon: { current: 352, next: 354, previous: 350 },
      sun: { current: 0, next: 0, previous: 0 },
    });

    const events = service.detect({ coordinateEphemerisByBody, minute });

    expect(events.length).toBeGreaterThanOrEqual(2);

    const formingConjunction = events.find(
      (e) =>
        e.description.includes("conjunct") &&
        e.description.includes("Sun") &&
        e.description.includes("Moon"),
    );

    expect(formingConjunction).toBeDefined();
    expect(formingConjunction?.categories).toContain("Forming");

    const dissolvingSquare = events.find(
      (e) =>
        e.description.includes("square") &&
        e.description.includes("Sun") &&
        e.description.includes("Mercury"),
    );

    expect(dissolvingSquare).toBeDefined();
    expect(dissolvingSquare?.categories).toContain("Dissolving");
  });

  it("returns no events when all body longitudes are constant at 100°", () => {
    expect.hasAssertions(); // Flat ephemeris: getAngle(100,100)=0° for all pairs, constant across timestamps.

    // Conjunction check: isBouncing requires a strict local extremum — constant data
    // has no minimum or maximum, so zero events are produced.
    const coordinateEphemerisByBody = createAspectEphemeris(minute);

    const events = service.detect({ coordinateEphemerisByBody, minute });

    expect(events).toHaveLength(0);
  });
});
