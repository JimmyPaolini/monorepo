import { LoggerService } from "@caelundas/src/modules/logger/logger.service";
import { createMock } from "@golevelup/ts-vitest";
import { Test } from "@nestjs/testing";
import moment from "moment-timezone";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { TripleAspectsComposerService } from "./triple-aspects-composer.service";

import type { AspectBodies } from "@caelundas/src/modules/aspects/aspects.service";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";

describe("TripleAspectsComposerService", () => {
  let service: TripleAspectsComposerService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TripleAspectsComposerService,
        { provide: LoggerService, useValue: createMock<LoggerService>() },
      ],
    }).compile();

    service = await module.resolve(TripleAspectsComposerService);
    await module.resolve(LoggerService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("static aspect helpers", () => {
    it("finds bodies with a specific aspect", () => {
      const edges: AspectBodies[] = [
        { aspect: "conjunct", bodies: ["sun", "moon"] },
        { aspect: "trine", bodies: ["sun", "mars"] },
        { aspect: "trine", bodies: ["jupiter", "sun"] },
      ];

      const bodiesWithTrine =
        TripleAspectsComposerService.findBodiesWithAspectTo(
          "sun",
          "trine",
          edges,
        );

      expect(bodiesWithTrine).toContain("mars");
      expect(bodiesWithTrine).toContain("jupiter");
    });

    it("checks whether two bodies have an aspect", () => {
      const edges: AspectBodies[] = [
        { aspect: "conjunct", bodies: ["sun", "moon"] },
      ];

      expect(
        TripleAspectsComposerService.haveAspect({
          aspectType: "conjunct",
          body1: "sun",
          body2: "moon",
          edges,
        }),
      ).toBe(true);

      expect(
        TripleAspectsComposerService.haveAspect({
          aspectType: "trine",
          body1: "sun",
          body2: "moon",
          edges,
        }),
      ).toBe(false);
    });
  });

  describe("event composition", () => {
    it("builds a T-Square forming event", () => {
      const minute = moment.utc("2024-03-21T12:00:00.000Z");

      const event = service.buildTripleAspectEvent({
        body1: "sun",
        body2: "moon",
        body3: "mars",
        focalOrApexBody: "mars",
        phase: "forming",
        timestamp: minute,
        tripleAspect: "t-square",
      });

      expect(event.categories).toContain("Triple Aspect");
      expect(event.categories).toContain("T Square");
      expect(event.categories).toContain("Forming");
      expect(event.categories).toContain("Mars Focal");
      expect(event.start).toEqual(minute);
    });

    it("pairs forming and dissolving events into one progressive event", () => {
      const forming: Event = {
        categories: [
          "Astronomy",
          "Astrology",
          "Compound Aspect",
          "Triple Aspect",
          "T Square",
          "Forming",
          "Sun",
          "Moon",
          "Mars",
          "Mars Focal",
        ],
        description: "Mars, Moon, Sun t-square forming (Mars focal)",
        end: moment.utc("2024-03-21T10:00:00.000Z"),
        start: moment.utc("2024-03-21T10:00:00.000Z"),
        summary: "T-Square forming",
      };

      const dissolving: Event = {
        categories: [
          "Astronomy",
          "Astrology",
          "Compound Aspect",
          "Triple Aspect",
          "T Square",
          "Dissolving",
          "Sun",
          "Moon",
          "Mars",
          "Mars Focal",
        ],
        description: "Mars, Moon, Sun t-square dissolving (Mars focal)",
        end: moment.utc("2024-03-21T14:00:00.000Z"),
        start: moment.utc("2024-03-21T14:00:00.000Z"),
        summary: "T-Square dissolving",
      };

      const progressiveEvents = service.pairProgressiveGroup([
        forming,
        dissolving,
      ]);

      expect(progressiveEvents).toHaveLength(1);
      expect(progressiveEvents[0]?.description).toContain("t-square");
      expect(progressiveEvents[0]?.categories).toContain("Triple Aspect");
      expect(progressiveEvents[0]?.categories).not.toContain("Forming");
      expect(progressiveEvents[0]?.categories).not.toContain("Dissolving");
    });
  });

  describe("progressive helpers", () => {
    it("derives progressive keys and phases", () => {
      const minute = moment.utc("2024-03-21T12:00:00.000Z");
      const forming = {
        categories: [
          "Astronomy",
          "Astrology",
          "Compound Aspect",
          "Triple Aspect",
          "Grand Trine",
          "Forming",
          "Moon",
          "Sun",
          "Mars",
          "Mars Focal",
        ],
        description: "Moon, Sun, Mars grand trine forming",
        end: minute,
        start: minute,
        summary: "➡️ ✶ Moon-Sun-Mars Moon, Sun, Mars grand trine forming",
      } as Event;
      const dissolving = {
        ...forming,
        categories: forming.categories.map((category) =>
          category === "Forming" ? "Dissolving" : category,
        ),
        description: "Moon, Sun, Mars grand trine dissolving",
        start: minute.clone().add(1, "hour"),
        end: minute.clone().add(1, "hour"),
        summary:
          "⬅️ ✶ Moon-Sun-Mars Moon, Sun, Mars grand trine dissolving",
      } as Event;

      expect(TripleAspectsComposerService.determineCompoundPhaseFromSnapshots({
        checkPatternExists: (edges) => edges.length > 0,
        currentAspectBodies: [
          { aspect: "trine", bodies: ["moon", "sun"] },
        ],
        currentMinute: minute,
        patternBodies: ["moon", "sun", "mars"],
        previousAspectBodies: [],
      })).toEqual({ eventMinute: minute, phase: "forming" });

      expect(TripleAspectsComposerService.determineCompoundPhaseFromSnapshots({
        checkPatternExists: (edges) => edges.length > 0,
        currentAspectBodies: [],
        currentMinute: minute,
        patternBodies: ["moon", "sun", "mars"],
        previousAspectBodies: [
          { aspect: "trine", bodies: ["moon", "sun"] },
        ],
      })?.phase).toBe("dissolving");

      expect(TripleAspectsComposerService.determineCompoundPhaseFromSnapshots({
        checkPatternExists: (edges) => edges.length > 0,
        currentAspectBodies: [
          { aspect: "trine", bodies: ["moon", "sun"] },
        ],
        currentMinute: minute,
        patternBodies: ["moon", "sun", "mars"],
        previousAspectBodies: [
          { aspect: "trine", bodies: ["moon", "sun"] },
        ],
      })).toBeNull();

      expect(
        service.getProgressiveGroupKey(forming),
      ).toBe("Mars-Moon-Sun-Grand Trine");
      expect(service.getProgressiveGroupKey({ ...forming, categories: ["Moon"] })).toBe("");

      expect(service.pairProgressiveGroup([forming, dissolving])).toHaveLength(1);
      expect(
        service.pairProgressiveGroup([
          { ...forming, start: minute, end: minute },
          { ...dissolving, start: minute },
        ]),
      ).toHaveLength(0);

      expect(
        service.buildProgressiveEvent({
          aspectCapitalized: "Mystery Aspect",
          dissolving,
          forming,
        }),
      ).toBeNull();

      expect(
        service.buildProgressiveEvent({
          aspectCapitalized: "Grand Trine",
          dissolving,
          forming: {
            ...forming,
            categories: forming.categories.map((category) =>
              category === "Mars" ? "Ceres" : category,
            ),
          } as Event,
        }),
      ).toBeNull();

      const yodProgressiveEvent = service.buildProgressiveEvent({
        aspectCapitalized: "Yod",
        dissolving,
        forming: {
          ...forming,
          categories: forming.categories.map((category) =>
            category === "Mars Focal" ? "Mars Focal" : category,
          ),
        } as Event,
      });
      expect(yodProgressiveEvent?.summary).toContain("(apex: Mars)");

      expect(
        service.buildProgressiveEvent({
          aspectCapitalized: "Grand Trine",
          dissolving,
          forming: {
            ...forming,
            categories: ["Astronomy", "Astrology", "Compound Aspect"],
          } as Event,
        }),
      ).toBeNull();
    });
  });
});
