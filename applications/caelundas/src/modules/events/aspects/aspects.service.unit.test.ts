import moment from "moment-timezone";
import { describe, expect, it } from "vitest";

import { computeAspectBodies } from "./aspects.service";

import type { Event } from "@caelundas/src/modules/calendar/calendar.types";

describe("computeAspectBodies", () => {
  const timestamp = moment.utc("2026-01-21T12:00:00Z");

  function createAspectEvent(args: {
    body1: string;
    body2: string;
    aspectType: string;
    phase: "Forming" | "Perfective" | "Dissolving";
  }): Event {
    return {
      start: timestamp,
      end: timestamp,
      summary: `${args.body1} ${args.phase.toLowerCase()} ${args.aspectType} ${args.body2}`,
      description: "",
      categories: [
        "Astronomy",
        "Astrology",
        "Simple Aspect",
        "Major Aspect",
        args.body1,
        args.body2,
        args.aspectType,
        args.phase,
      ],
    };
  }

  it("returns empty array when given no previous state and no events", () => {
    expect(computeAspectBodies([], [])).toEqual([]);
  });

  it("adds an aspect on forming and ignores perfective", () => {
    const result = computeAspectBodies(
      [],
      [
        createAspectEvent({
          body1: "Sun",
          body2: "Moon",
          aspectType: "Conjunct",
          phase: "Forming",
        }),
        createAspectEvent({
          body1: "Sun",
          body2: "Moon",
          aspectType: "Conjunct",
          phase: "Perfective",
        }),
      ],
    );

    expect(result).toEqual([
      {
        bodies: ["sun", "moon"],
        aspect: "conjunct",
      },
    ]);
  });

  it("removes an aspect on dissolving", () => {
    const afterForming = computeAspectBodies(
      [],
      [
        createAspectEvent({
          body1: "Sun",
          body2: "Moon",
          aspectType: "Conjunct",
          phase: "Forming",
        }),
      ],
    );

    const result = computeAspectBodies(afterForming, [
      createAspectEvent({
        body1: "Sun",
        body2: "Moon",
        aspectType: "Conjunct",
        phase: "Dissolving",
      }),
    ]);

    expect(result).toEqual([]);
  });

  it("uses canonical key regardless of body order", () => {
    const afterForming = computeAspectBodies(
      [],
      [
        createAspectEvent({
          body1: "Moon",
          body2: "Sun",
          aspectType: "Conjunct",
          phase: "Forming",
        }),
      ],
    );

    const result = computeAspectBodies(afterForming, [
      createAspectEvent({
        body1: "Sun",
        body2: "Moon",
        aspectType: "Conjunct",
        phase: "Dissolving",
      }),
    ]);

    expect(result).toEqual([]);
  });

  it("tracks different aspect types for the same pair", () => {
    const result = computeAspectBodies(
      [],
      [
        createAspectEvent({
          body1: "Sun",
          body2: "Moon",
          aspectType: "Conjunct",
          phase: "Forming",
        }),
        createAspectEvent({
          body1: "Sun",
          body2: "Moon",
          aspectType: "Sextile",
          phase: "Forming",
        }),
      ],
    );

    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        { bodies: ["sun", "moon"], aspect: "conjunct" },
        { bodies: ["sun", "moon"], aspect: "sextile" },
      ]),
    );
  });

  it("skips non-simple-aspect events", () => {
    const result = computeAspectBodies(
      [],
      [
        {
          start: timestamp,
          end: timestamp,
          summary: "Moon enters Aries",
          description: "",
          categories: ["Astronomy", "Ingress", "Moon", "Aries"],
        },
      ],
    );

    expect(result).toEqual([]);
  });

  it("does not mutate the previous state array", () => {
    const afterForming = computeAspectBodies(
      [],
      [
        createAspectEvent({
          body1: "Sun",
          body2: "Moon",
          aspectType: "Conjunct",
          phase: "Forming",
        }),
      ],
    );

    computeAspectBodies(afterForming, [
      createAspectEvent({
        body1: "Sun",
        body2: "Moon",
        aspectType: "Conjunct",
        phase: "Dissolving",
      }),
    ]);

    expect(afterForming).toHaveLength(1);
  });
});
