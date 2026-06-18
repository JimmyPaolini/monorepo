import { LoggerService } from "@caelundas/src/modules/logger/logger.service";
import { ProgressiveUtilities } from "@caelundas/src/modules/progressive/progressive.utilities";
import { Test } from "@nestjs/testing";
import moment, { type Moment } from "moment-timezone";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { MajorAspectProgressiveService } from "./major-aspect-progressive.service";

import type { Event } from "@caelundas/src/modules/calendar/calendar.types";

vi.mock("fs", () => ({
  default: {
    writeFileSync: vi.fn(),
  },
}));

describe("MajorAspectProgressiveService", () => {
  let service: MajorAspectProgressiveService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        LoggerService,
        ProgressiveUtilities,
        MajorAspectProgressiveService,
      ],
    }).compile();

    service = await module.resolve(MajorAspectProgressiveService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("detectProgressive", () => {
    const createMajorAspectEvent = (
      body1: string,
      body2: string,
      aspect: string,
      phase: string,
      timestamp: Moment,
    ): Event => ({
      categories: [
        "Astronomy",
        "Astrology",
        "Major Aspect",
        body1,
        body2,
        aspect,
        phase,
      ],
      description: `${body1} ${phase} ${aspect} ${body2}`,
      end: timestamp,
      start: timestamp,
      summary: `${body1} ${aspect} ${body2}`,
    });

    it("should create progressive events from forming and dissolving pairs", () => {
      const forming = createMajorAspectEvent(
        "Sun",
        "Mercury",
        "Conjunct",
        "Forming",
        moment.utc("2024-03-21T10:00:00.000Z"),
      );
      const dissolving = createMajorAspectEvent(
        "Sun",
        "Mercury",
        "Conjunct",
        "Dissolving",
        moment.utc("2024-03-21T14:00:00.000Z"),
      );

      const progressiveEvents = service.detectProgressive([
        forming,
        dissolving,
      ]);

      expect(progressiveEvents).toHaveLength(1);
      expect(progressiveEvents[0]).toBeDefined();
      expect(progressiveEvents[0]?.start).toEqual(forming.start);
      expect(progressiveEvents[0]?.end).toEqual(dissolving.start);
      expect(progressiveEvents[0]?.categories).toContain("Simple Aspect");
      expect(progressiveEvents[0]?.categories).toContain("Major Aspect");
      expect(progressiveEvents[0]?.summary).toContain("☀️");
      expect(progressiveEvents[0]?.summary).toContain("☿");
      expect(progressiveEvents[0]?.summary).toContain("☌");
    });

    it("should handle multiple aspect types for same body pair", () => {
      const formingConjunct = createMajorAspectEvent(
        "Sun",
        "Mercury",
        "Conjunct",
        "Forming",
        moment.utc("2024-03-21T10:00:00.000Z"),
      );
      const dissolvingConjunct = createMajorAspectEvent(
        "Sun",
        "Mercury",
        "Conjunct",
        "Dissolving",
        moment.utc("2024-03-21T14:00:00.000Z"),
      );
      const formingOpposite = createMajorAspectEvent(
        "Sun",
        "Mercury",
        "Opposite",
        "Forming",
        moment.utc("2024-03-21T20:00:00.000Z"),
      );
      const dissolvingOpposite = createMajorAspectEvent(
        "Sun",
        "Mercury",
        "Opposite",
        "Dissolving",
        moment.utc("2024-03-22T00:00:00.000Z"),
      );

      const progressiveEvents = service.detectProgressive([
        formingConjunct,
        dissolvingConjunct,
        formingOpposite,
        dissolvingOpposite,
      ]);

      expect(progressiveEvents).toHaveLength(2);
      const conjunctDuration = progressiveEvents.find((event) =>
        event.description.includes("conjunct"),
      );
      const oppositeDuration = progressiveEvents.find((event) =>
        event.description.includes("opposite"),
      );
      expect(conjunctDuration).toBeDefined();
      expect(oppositeDuration).toBeDefined();
    });

    it("should handle multiple body pairs", () => {
      const sunMercuryForming = createMajorAspectEvent(
        "Sun",
        "Mercury",
        "Conjunct",
        "Forming",
        moment.utc("2024-03-21T10:00:00.000Z"),
      );
      const sunMercuryDissolving = createMajorAspectEvent(
        "Sun",
        "Mercury",
        "Conjunct",
        "Dissolving",
        moment.utc("2024-03-21T14:00:00.000Z"),
      );
      const venusJupiterForming = createMajorAspectEvent(
        "Venus",
        "Jupiter",
        "Trine",
        "Forming",
        moment.utc("2024-03-21T12:00:00.000Z"),
      );
      const venusJupiterDissolving = createMajorAspectEvent(
        "Venus",
        "Jupiter",
        "Trine",
        "Dissolving",
        moment.utc("2024-03-21T16:00:00.000Z"),
      );

      const progressiveEvents = service.detectProgressive([
        sunMercuryForming,
        sunMercuryDissolving,
        venusJupiterForming,
        venusJupiterDissolving,
      ]);

      expect(progressiveEvents).toHaveLength(2);
    });

    it("should filter out non-major-aspect events", () => {
      const majorAspectForming = createMajorAspectEvent(
        "Sun",
        "Venus",
        "Conjunct",
        "Forming",
        moment.utc("2024-03-21T10:00:00.000Z"),
      );
      const majorAspectDissolving = createMajorAspectEvent(
        "Sun",
        "Venus",
        "Conjunct",
        "Dissolving",
        moment.utc("2024-03-21T14:00:00.000Z"),
      );
      const nonAspectEvent: Event = {
        categories: ["Solar", "Daily Cycle"],
        description: "Sunrise",
        end: moment.utc("2024-03-21T12:00:00.000Z"),
        start: moment.utc("2024-03-21T12:00:00.000Z"),
        summary: "Sunrise",
      };

      const progressiveEvents = service.detectProgressive([
        majorAspectForming,
        majorAspectDissolving,
        nonAspectEvent,
      ]);

      expect(progressiveEvents).toHaveLength(1);
    });

    it("should handle empty events array", () => {
      const progressiveEvents = service.detectProgressive([]);
      expect(progressiveEvents).toHaveLength(0);
    });

    it("should sort body names alphabetically in progressive event", () => {
      const forming = createMajorAspectEvent(
        "Venus",
        "Sun",
        "Conjunct",
        "Forming",
        moment.utc("2024-03-21T10:00:00.000Z"),
      );
      const dissolving = createMajorAspectEvent(
        "Venus",
        "Sun",
        "Conjunct",
        "Dissolving",
        moment.utc("2024-03-21T14:00:00.000Z"),
      );

      const progressiveEvents = service.detectProgressive([
        forming,
        dissolving,
      ]);

      expect(progressiveEvents).toHaveLength(1);
      expect(progressiveEvents[0]).toBeDefined();
      expect(progressiveEvents[0]?.description).toContain("Sun");
      expect(progressiveEvents[0]?.description).toContain("Venus");
    });
  });
});
