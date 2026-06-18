import { LoggerService } from "@caelundas/src/modules/logger/logger.service";
import moment from "moment-timezone";
import { beforeEach, describe, expect, it } from "vitest";

import { TripleAspectsComposerService } from "./triple-aspects-composer.service";

import type { AspectBodies } from "@caelundas/src/modules/aspects/aspects.service";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";

describe("TripleAspectsComposerService", () => {
  let service: TripleAspectsComposerService;

  beforeEach(() => {
    service = new TripleAspectsComposerService(new LoggerService());
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
});
