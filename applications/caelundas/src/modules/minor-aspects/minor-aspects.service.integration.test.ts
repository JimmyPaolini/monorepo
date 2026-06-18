import { AspectsUtilities } from "@caelundas/src/modules/aspects/aspects.utilities";
import { aspectBodies as minorAspectBodies } from "@caelundas/src/modules/caelundas/caelundas.constants";
import { EphemerisService } from "@caelundas/src/modules/ephemeris/ephemeris.service";
import { LoggerService } from "@caelundas/src/modules/logger/logger.service";
import { MathService } from "@caelundas/src/modules/math/math.service";
import { MinorAspectsEventService } from "@caelundas/src/modules/minor-aspects/minor-aspects-event.service";
import { MinorAspectsProgressiveService } from "@caelundas/src/modules/minor-aspects/minor-aspects-progressive.service";
import { ProgressiveUtilities } from "@caelundas/src/modules/progressive/progressive.utilities";
import { Test } from "@nestjs/testing";
import moment, { type Moment } from "moment-timezone";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { MinorAspectsService } from "./minor-aspects.service";

import type { Body } from "@caelundas/src/modules/caelundas/caelundas.types";
import type { CoordinateEphemeris } from "@caelundas/src/modules/ephemeris/ephemeris.types";

/**
 * Integration tests for minor aspect phase detection.
 *
 * These tests verify the full detection pipeline for minor aspects — semisextile (30°),
 * semisquare (45°), sesquiquadrate (135°), and quincunx (150°) — from raw ephemeris
 * data through angular separation computation to formatted calendar events.
 *
 * Unlike unit tests, which spy on private helpers via a NestJS TestingModule, these
 * tests use a NestJS TestingModule without spies and assert the complete event shape
 * produced by real orb comparisons and phase-crossing logic.
 *
 * Ephemeris construction strategy:
 *   - All bodies default to longitude 100° (constant across prev/curr/next).
 *     With every pair at 0° separation and no movement, `isBouncing` cannot fire
 *     (requires a strict local extremum) and `isCrossing` cannot fire (no sign change),
 *     so zero events are produced by the base configuration.
 *   - Sun is overridden to 0° constant so that only the body under test
 *     (Moon, Mercury, or Venus) drives events.
 *   - Each test overrides exactly one body to create precise boundary conditions
 *     at the orb entry or exit point, producing a single isolated event.
 *
 * Orb ranges (uses ≤, not <):
 *   semisextile 2°, semisquare 2°, sesquiquadrate 2°, quincunx 3°
 *
 * Phase semantics:
 *   - Forming: previous outside orb, current inside orb
 *   - Perfective: sign change in (angle − aspectAngle) across prev→curr
 *   - Dissolving: current inside orb, next outside orb
 */

vi.mock("fs", () => ({
  default: {
    writeFileSync: vi.fn(),
  },
}));

let service: MinorAspectsService;

beforeAll(async () => {
  const module = await Test.createTestingModule({
    providers: [
      LoggerService,
      MinorAspectsService,
      MinorAspectsEventService,
      MinorAspectsProgressiveService,
      AspectsUtilities,
      EphemerisService,
      MathService,
      ProgressiveUtilities,
    ],
  }).compile();
  service = await module.resolve(MinorAspectsService);
});

/**
 * Builds a CoordinateEphemeris record for all minorAspectBodies across three timestamps.
 *
 * Every body defaults to longitude 100° so the baseline produces no aspect events.
 * Pass `overrides` to set different longitudes for specific bodies at each timestamp.
 */
function createAspectEphemeris(
  minute: Moment,
  overrides: Partial<
    Record<
      (typeof minorAspectBodies)[number],
      { current: number; next: number; previous: number }
    >
  > = {},
): Record<Body, CoordinateEphemeris> {
  const previousMinute = minute.clone().subtract(1, "minute");
  const nextMinute = minute.clone().add(1, "minute");

  const ephemerisByBody = {} as Record<Body, CoordinateEphemeris>;

  for (const body of minorAspectBodies) {
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

describe("minor-aspects.events integration", () => {
  const minute = moment.utc("2024-03-21T12:00:00.000Z");

  it("should detect a forming quincunx when Moon crosses into the 3° orb of 150°", () => {
    // Sun at 0° constant; Moon moves from 154° (outside 3° orb of 150°) toward the aspect
    // getAngle(0,154)=154 → |154-150|=4 > 3 → NOT in orb prev
    // getAngle(0,152.5)=152.5 → |152.5-150|=2.5 ≤ 3 → IN ORB curr
    // Phase: !previousInOrb && currentInOrb → "forming"
    const coordinateEphemerisByBody = createAspectEphemeris(minute, {
      moon: { current: 152.5, next: 151, previous: 154 },
      sun: { current: 0, next: 0, previous: 0 },
    });

    const events = service.detect({ coordinateEphemerisByBody, minute });

    const formingQuincunx = events.find(
      (e) =>
        e.description.includes("quincunx") &&
        e.description.includes("Sun") &&
        e.description.includes("Moon"),
    );
    expect(formingQuincunx).toBeDefined();
    expect(formingQuincunx?.categories).toContain("Forming");
    expect(formingQuincunx?.start).toEqual(minute);
  });

  it("should detect a perfective sesquiquadrate when Mercury crosses the exact 135° aspect angle", () => {
    // Sun at 0° constant; Mercury passes through exactly 135° (sesquiquadrate, 2° orb)
    // prevDiff = 136-135 = +1, currDiff = 135-135 = 0, nextDiff = 134-135 = -1
    // Phase: isCrossing (sign change from positive to negative) → "perfective"
    const coordinateEphemerisByBody = createAspectEphemeris(minute, {
      mercury: { current: 135, next: 134, previous: 136 },
      sun: { current: 0, next: 0, previous: 0 },
    });

    const events = service.detect({ coordinateEphemerisByBody, minute });

    const perfectiveSesquiquadrate = events.find(
      (e) =>
        e.description.includes("sesquiquadrate") &&
        e.description.includes("Sun") &&
        e.description.includes("Mercury"),
    );
    expect(perfectiveSesquiquadrate).toBeDefined();
    expect(perfectiveSesquiquadrate?.categories).toContain("Perfective");
    expect(perfectiveSesquiquadrate?.start).toEqual(minute);
  });

  it("should detect a dissolving semisextile when Venus exits the 2° orb of 30°", () => {
    // Sun at 0° constant; Venus moves away from the semisextile threshold
    // getAngle(0,31)=31 → |31-30|=1 ≤ 2 → IN ORB prev
    // getAngle(0,31.8)=31.8 → |31.8-30|=1.8 ≤ 2 → IN ORB curr
    // getAngle(0,32.2)=32.2 → |32.2-30|=2.2 > 2 → exits orb next
    // Phase: currentInOrb && !nextInOrb → "dissolving"
    const coordinateEphemerisByBody = createAspectEphemeris(minute, {
      sun: { current: 0, next: 0, previous: 0 },
      venus: { current: 31.8, next: 32.2, previous: 31 },
    });

    const events = service.detect({ coordinateEphemerisByBody, minute });

    const dissolvingSemisextile = events.find(
      (e) =>
        e.description.includes("semisextile") &&
        e.description.includes("Sun") &&
        e.description.includes("Venus"),
    );
    expect(dissolvingSemisextile).toBeDefined();
    expect(dissolvingSemisextile?.categories).toContain("Dissolving");
    expect(dissolvingSemisextile?.start).toEqual(minute);
  });

  it("should return no events when all body longitudes are constant at 100°", () => {
    // Flat ephemeris: getAngle(100,100)=0° for all pairs, constant across timestamps.
    // No aspect angle is at 0°, so all pairs are far outside every minor aspect orb.
    const coordinateEphemerisByBody = createAspectEphemeris(minute);

    const events = service.detect({ coordinateEphemerisByBody, minute });

    expect(events).toHaveLength(0);
  });
});
