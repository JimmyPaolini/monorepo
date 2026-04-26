import { beforeEach, describe, expect, it } from "vitest";
import moment from "moment-timezone";

import {
    getAspectBodies,
    resetAspectBodiesStore,
    updateAspectBodiesStoreByPerfectiveEvents,
} from "./aspects.store";

import type { Event } from "../../calendar.utilities";

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

describe("aspects.store", () => {
  beforeEach(() => {
    resetAspectBodiesStore();
  });

  it("starts empty", () => {
    expect(getAspectBodies()).toEqual([]);
  });

  it("adds an aspect on forming and ignores perfective", () => {
    updateAspectBodiesStoreByPerfectiveEvents([
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
    ]);

    expect(getAspectBodies()).toEqual([
      {
        bodies: ["sun", "moon"],
        aspect: "conjunct",
      },
    ]);
  });

  it("removes an aspect on dissolving", () => {
    updateAspectBodiesStoreByPerfectiveEvents([
      createAspectEvent({
        body1: "Sun",
        body2: "Moon",
        aspectType: "Conjunct",
        phase: "Forming",
      }),
    ]);

    updateAspectBodiesStoreByPerfectiveEvents([
      createAspectEvent({
        body1: "Sun",
        body2: "Moon",
        aspectType: "Conjunct",
        phase: "Dissolving",
      }),
    ]);

    expect(getAspectBodies()).toEqual([]);
  });

  it("uses canonical key regardless of body order", () => {
    updateAspectBodiesStoreByPerfectiveEvents([
      createAspectEvent({
        body1: "Moon",
        body2: "Sun",
        aspectType: "Conjunct",
        phase: "Forming",
      }),
    ]);

    updateAspectBodiesStoreByPerfectiveEvents([
      createAspectEvent({
        body1: "Sun",
        body2: "Moon",
        aspectType: "Conjunct",
        phase: "Dissolving",
      }),
    ]);

    expect(getAspectBodies()).toEqual([]);
  });

  it("tracks different aspect types for the same pair", () => {
    updateAspectBodiesStoreByPerfectiveEvents([
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
    ]);

    const active = getAspectBodies();
    expect(active).toHaveLength(2);
    expect(active).toEqual(
      expect.arrayContaining([
        { bodies: ["sun", "moon"], aspect: "conjunct" },
        { bodies: ["sun", "moon"], aspect: "sextile" },
      ]),
    );
  });

  it("skips non-simple-aspect events", () => {
    updateAspectBodiesStoreByPerfectiveEvents([
      {
        start: timestamp,
        end: timestamp,
        summary: "Moon enters Aries",
        description: "",
        categories: ["Astronomy", "Ingress", "Moon", "Aries"],
      },
    ]);

    expect(getAspectBodies()).toEqual([]);
  });

  it("returns a snapshot, not a live reference", () => {
    updateAspectBodiesStoreByPerfectiveEvents([
      createAspectEvent({
        body1: "Sun",
        body2: "Moon",
        aspectType: "Conjunct",
        phase: "Forming",
      }),
    ]);

    const snapshot = getAspectBodies();
    resetAspectBodiesStore();

    expect(snapshot).toHaveLength(1);
    expect(getAspectBodies()).toEqual([]);
  });
});
