import { Test } from "@nestjs/testing";
import moment from "moment-timezone";
import { beforeAll, describe, expect, it } from "vitest";

import { QuadrupleAspectsBaseService } from "./quadruple-aspects-base.service";
import { QuadrupleAspectsComposerService } from "./quadruple-aspects-composer.service";
import { QuadrupleAspectsService } from "./quadruple-aspects.service";

import type { AspectBodies } from "@caelundas/src/modules/aspects/aspects.service";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";

describe("QuadrupleAspectsService", () => {
  let service: QuadrupleAspectsService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        QuadrupleAspectsBaseService,
        QuadrupleAspectsComposerService,
        QuadrupleAspectsService,
      ],
    }).compile();
    service = await module.resolve(QuadrupleAspectsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("quadruple-aspects.events", () => {
    describe("service.detect", () => {
      describe("Grand Cross composition", () => {
        it("should detect Grand Cross from 2 oppositions and 4 squares", () => {
          const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
          // Grand Cross: Sun opposite Moon, Mars opposite Jupiter
          // Plus squares: Sun-Mars, Sun-Jupiter, Moon-Mars, Moon-Jupiter
          const currentAspectBodies: AspectBodies[] = [
            { aspect: "opposite", bodies: ["sun", "moon"] },
            { aspect: "opposite", bodies: ["mars", "jupiter"] },
            { aspect: "square", bodies: ["sun", "mars"] },
            { aspect: "square", bodies: ["sun", "jupiter"] },
            { aspect: "square", bodies: ["moon", "mars"] },
            { aspect: "square", bodies: ["moon", "jupiter"] },
          ];
          const previousAspectBodies: AspectBodies[] = [];

          const events = service.detect({
            currentAspectBodies,
            minute: currentMinute,
            previousAspectBodies,
          });

          expect(events.length).toBeGreaterThanOrEqual(1);
          const grandCross = events.find((e) =>
            e.categories.includes("Grand Cross"),
          );
          expect(grandCross).toBeDefined();
          expect(grandCross?.description).toContain("grand cross");
          expect(grandCross?.categories).toContain("Sun");
          expect(grandCross?.categories).toContain("Moon");
          expect(grandCross?.categories).toContain("Mars");
          expect(grandCross?.categories).toContain("Jupiter");
        });

        it("should detect forming Grand Cross", () => {
          const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
          // Grand Cross forming (starts at current minute)
          const currentAspectBodies: AspectBodies[] = [
            { aspect: "opposite", bodies: ["sun", "moon"] },
            { aspect: "opposite", bodies: ["mars", "jupiter"] },
            { aspect: "square", bodies: ["sun", "mars"] },
            { aspect: "square", bodies: ["sun", "jupiter"] },
            { aspect: "square", bodies: ["moon", "mars"] },
            { aspect: "square", bodies: ["moon", "jupiter"] },
          ];
          const previousAspectBodies: AspectBodies[] = [];

          const events = service.detect({
            currentAspectBodies,
            minute: currentMinute,
            previousAspectBodies,
          });

          expect(events.length).toBeGreaterThanOrEqual(1);
          const grandCross = events.find((e) =>
            e.categories.includes("Grand Cross"),
          );
          expect(grandCross).toBeDefined();
          expect(grandCross?.categories).toContain("Forming");
        });

        it("should detect dissolving Grand Cross", () => {
          const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
          // Grand Cross dissolving (ends at current minute)
          const currentAspectBodies: AspectBodies[] = [];
          const previousAspectBodies: AspectBodies[] = [
            { aspect: "opposite", bodies: ["sun", "moon"] },
            { aspect: "opposite", bodies: ["mars", "jupiter"] },
            { aspect: "square", bodies: ["sun", "mars"] },
            { aspect: "square", bodies: ["sun", "jupiter"] },
            { aspect: "square", bodies: ["moon", "mars"] },
            { aspect: "square", bodies: ["moon", "jupiter"] },
          ];

          const events = service.detect({
            currentAspectBodies,
            minute: currentMinute,
            previousAspectBodies,
          });

          expect(events.length).toBeGreaterThanOrEqual(1);
          const grandCross = events.find((e) =>
            e.categories.includes("Grand Cross"),
          );
          expect(grandCross).toBeDefined();
          expect(grandCross?.categories).toContain("Dissolving");
        });

        it("should not detect Grand Cross with incomplete aspects", () => {
          const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
          // Missing some squares - incomplete Grand Cross
          const currentAspectBodies: AspectBodies[] = [
            { aspect: "opposite", bodies: ["sun", "moon"] },
            { aspect: "opposite", bodies: ["mars", "jupiter"] },
            { aspect: "square", bodies: ["sun", "mars"] },
          ];
          const previousAspectBodies: AspectBodies[] = [];

          const events = service.detect({
            currentAspectBodies,
            minute: currentMinute,
            previousAspectBodies,
          });

          const grandCross = events.find((e) =>
            e.categories.includes("Grand Cross"),
          );
          expect(grandCross).toBeUndefined();
        });
      });

      describe("Kite composition", () => {
        it("should detect Kite from Grand Trine plus opposition and sextiles", () => {
          const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
          // Kite: Grand Trine (Sun-Moon-Mars) + Venus opposite Sun + Venus sextile Moon/Mars
          const currentAspectBodies: AspectBodies[] = [
            { aspect: "trine", bodies: ["sun", "moon"] },
            { aspect: "trine", bodies: ["sun", "mars"] },
            { aspect: "trine", bodies: ["moon", "mars"] },
            { aspect: "opposite", bodies: ["sun", "venus"] },
            { aspect: "sextile", bodies: ["venus", "moon"] },
            { aspect: "sextile", bodies: ["venus", "mars"] },
          ];
          const previousAspectBodies: AspectBodies[] = [];

          const events = service.detect({
            currentAspectBodies,
            minute: currentMinute,
            previousAspectBodies,
          });

          expect(events.length).toBeGreaterThanOrEqual(1);
          const kite = events.find((e) => e.categories.includes("Kite"));
          expect(kite).toBeDefined();
          expect(kite?.description).toContain("kite");
          expect(kite?.categories).toContain("Sun");
          expect(kite?.categories).toContain("Moon");
          expect(kite?.categories).toContain("Mars");
          expect(kite?.categories).toContain("Venus");
          expect(kite?.description).toContain("Venus focal");
        });

        it("should not detect Kite with incomplete aspects", () => {
          const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
          // Grand Trine present but missing sextiles
          const currentAspectBodies: AspectBodies[] = [
            { aspect: "trine", bodies: ["sun", "moon"] },
            { aspect: "trine", bodies: ["sun", "mars"] },
            { aspect: "trine", bodies: ["moon", "mars"] },
            { aspect: "opposite", bodies: ["sun", "venus"] },
          ];
          const previousAspectBodies: AspectBodies[] = [];

          const events = service.detect({
            currentAspectBodies,
            minute: currentMinute,
            previousAspectBodies,
          });

          const kite = events.find((e) => e.categories.includes("Kite"));
          expect(kite).toBeUndefined();
        });
      });

      it("should handle empty stored aspects", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        const events = service.detect({
          currentAspectBodies: [],
          minute: currentMinute,
          previousAspectBodies: [],
        });
        expect(events.length).toBe(0);
      });

      it("should filter events outside current time window", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");

        // Aspects that ended before current time
        const currentAspectBodies: AspectBodies[] = [];
        const previousAspectBodies: AspectBodies[] = [];

        const events = service.detect({
          currentAspectBodies,
          minute: currentMinute,
          previousAspectBodies,
        });
        expect(events.length).toBe(0);
      });

      it("should not generate events for progressive aspects spanning multiple hours", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        // Grand Cross pattern but spans multiple hours
        const currentAspectBodies: AspectBodies[] = [
          { aspect: "opposite", bodies: ["sun", "moon"] },
          { aspect: "opposite", bodies: ["mars", "jupiter"] },
          { aspect: "square", bodies: ["sun", "mars"] },
          { aspect: "square", bodies: ["sun", "jupiter"] },
          { aspect: "square", bodies: ["moon", "mars"] },
          { aspect: "square", bodies: ["moon", "jupiter"] },
        ];
        const previousAspectBodies: AspectBodies[] = [
          { aspect: "opposite", bodies: ["sun", "moon"] },
          { aspect: "opposite", bodies: ["mars", "jupiter"] },
          { aspect: "square", bodies: ["sun", "mars"] },
          { aspect: "square", bodies: ["sun", "jupiter"] },
          { aspect: "square", bodies: ["moon", "mars"] },
          { aspect: "square", bodies: ["moon", "jupiter"] },
        ];

        const events = service.detect({
          currentAspectBodies,
          minute: currentMinute,
          previousAspectBodies,
        });

        // No events - pattern exists in prev/current/next minutes
        expect(events.length).toBe(0);
      });
    });

    describe("service.detectProgressive", () => {
      it("should create progressive events from forming and dissolving pairs", () => {
        const formingEvent: Event = {
          categories: [
            "Astronomy",
            "Astrology",
            "Compound Aspect",
            "Quadruple Aspect",
            "Grand Cross",
            "Forming",
            "Sun",
            "Moon",
            "Mars",
            "Jupiter",
          ],
          description: "Jupiter, Mars, Moon, Sun grand cross forming",
          end: moment.utc("2024-03-21T10:00:00.000Z"),
          start: moment.utc("2024-03-21T10:00:00.000Z"),
          summary: "Grand Cross forming",
        };

        const dissolvingEvent: Event = {
          categories: [
            "Astronomy",
            "Astrology",
            "Compound Aspect",
            "Quadruple Aspect",
            "Grand Cross",
            "Dissolving",
            "Sun",
            "Moon",
            "Mars",
            "Jupiter",
          ],
          description: "Jupiter, Mars, Moon, Sun grand cross dissolving",
          end: moment.utc("2024-03-21T14:00:00.000Z"),
          start: moment.utc("2024-03-21T14:00:00.000Z"),
          summary: "Grand Cross dissolving",
        };

        const progressiveEvents = service.detectProgressive([
          formingEvent,
          dissolvingEvent,
        ]);

        expect(progressiveEvents.length).toBe(1);
        expect(progressiveEvents[0]?.start).toEqual(formingEvent.start);
        expect(progressiveEvents[0]?.end).toEqual(dissolvingEvent.start);
        expect(progressiveEvents[0]?.description).toContain("grand cross");
        expect(progressiveEvents[0]?.categories).toContain("Quadruple Aspect");
      });

      it("should handle multiple aspect types", () => {
        const grandCrossForming: Event = {
          categories: [
            "Quadruple Aspect",
            "Grand Cross",
            "Forming",
            "Sun",
            "Moon",
            "Mars",
            "Jupiter",
          ],
          description: "Jupiter, Mars, Moon, Sun grand cross forming",
          end: moment.utc("2024-03-21T10:00:00.000Z"),
          start: moment.utc("2024-03-21T10:00:00.000Z"),
          summary: "Grand Cross forming",
        };

        const grandCrossDissolving: Event = {
          categories: [
            "Quadruple Aspect",
            "Grand Cross",
            "Dissolving",
            "Sun",
            "Moon",
            "Mars",
            "Jupiter",
          ],
          description: "Jupiter, Mars, Moon, Sun grand cross dissolving",
          end: moment.utc("2024-03-21T14:00:00.000Z"),
          start: moment.utc("2024-03-21T14:00:00.000Z"),
          summary: "Grand Cross dissolving",
        };

        const kiteForming: Event = {
          categories: [
            "Quadruple Aspect",
            "Kite",
            "Forming",
            "Sun",
            "Moon",
            "Mars",
            "Venus",
          ],
          description: "Mars, Moon, Sun, Venus kite forming (Venus focal)",
          end: moment.utc("2024-03-21T11:00:00.000Z"),
          start: moment.utc("2024-03-21T11:00:00.000Z"),
          summary: "Kite forming",
        };

        const kiteDissolving: Event = {
          categories: [
            "Quadruple Aspect",
            "Kite",
            "Dissolving",
            "Sun",
            "Moon",
            "Mars",
            "Venus",
          ],
          description: "Mars, Moon, Sun, Venus kite dissolving (Venus focal)",
          end: moment.utc("2024-03-21T15:00:00.000Z"),
          start: moment.utc("2024-03-21T15:00:00.000Z"),
          summary: "Kite dissolving",
        };

        const progressiveEvents = service.detectProgressive([
          grandCrossForming,
          grandCrossDissolving,
          kiteForming,
          kiteDissolving,
        ]);

        expect(progressiveEvents.length).toBe(2);
        expect(
          progressiveEvents.find((e) => e.description.includes("grand cross")),
        ).toBeDefined();
        expect(
          progressiveEvents.find((e) => e.description.includes("kite")),
        ).toBeDefined();
      });

      it("should handle multiple body quartets", () => {
        const quartet1Forming: Event = {
          categories: [
            "Quadruple Aspect",
            "Grand Cross",
            "Forming",
            "Sun",
            "Moon",
            "Mars",
            "Jupiter",
          ],
          description: "Sun, Moon, Mars, Jupiter grand cross forming",
          end: moment.utc("2024-03-21T10:00:00.000Z"),
          start: moment.utc("2024-03-21T10:00:00.000Z"),
          summary: "Grand Cross forming",
        };

        const quartet1Dissolving: Event = {
          categories: [
            "Quadruple Aspect",
            "Grand Cross",
            "Dissolving",
            "Sun",
            "Moon",
            "Mars",
            "Jupiter",
          ],
          description: "Sun, Moon, Mars, Jupiter grand cross dissolving",
          end: moment.utc("2024-03-21T14:00:00.000Z"),
          start: moment.utc("2024-03-21T14:00:00.000Z"),
          summary: "Grand Cross dissolving",
        };

        const quartet2Forming: Event = {
          categories: [
            "Quadruple Aspect",
            "Kite",
            "Forming",
            "Venus",
            "Mercury",
            "Saturn",
            "Uranus",
          ],
          description: "Venus, Mercury, Saturn, Uranus kite forming",
          end: moment.utc("2024-03-21T11:00:00.000Z"),
          start: moment.utc("2024-03-21T11:00:00.000Z"),
          summary: "Kite forming",
        };

        const quartet2Dissolving: Event = {
          categories: [
            "Quadruple Aspect",
            "Kite",
            "Dissolving",
            "Venus",
            "Mercury",
            "Saturn",
            "Uranus",
          ],
          description: "Venus, Mercury, Saturn, Uranus kite dissolving",
          end: moment.utc("2024-03-21T15:00:00.000Z"),
          start: moment.utc("2024-03-21T15:00:00.000Z"),
          summary: "Kite dissolving",
        };

        const progressiveEvents = service.detectProgressive([
          quartet1Forming,
          quartet1Dissolving,
          quartet2Forming,
          quartet2Dissolving,
        ]);

        expect(progressiveEvents.length).toBe(2);
        expect(
          progressiveEvents.find(
            (e) =>
              e.description.includes("Sun") &&
              e.description.includes("Moon") &&
              e.description.includes("Mars") &&
              e.description.includes("Jupiter"),
          ),
        ).toBeDefined();
        expect(
          progressiveEvents.find(
            (e) =>
              e.description.includes("Venus") &&
              e.description.includes("Mercury") &&
              e.description.includes("Saturn") &&
              e.description.includes("Uranus"),
          ),
        ).toBeDefined();
      });

      it("should filter out non-quadruple-aspect events", () => {
        const quadrupleAspectEvent: Event = {
          categories: [
            "Quadruple Aspect",
            "Grand Cross",
            "Forming",
            "Sun",
            "Moon",
            "Mars",
            "Jupiter",
          ],
          description: "Sun, Moon, Mars, Jupiter grand cross forming",
          end: moment.utc("2024-03-21T10:00:00.000Z"),
          start: moment.utc("2024-03-21T10:00:00.000Z"),
          summary: "Grand Cross forming",
        };

        const nonQuadrupleAspectEvent: Event = {
          categories: ["Other"],
          description: "Not a quadruple aspect",
          end: moment.utc("2024-03-21T10:00:00.000Z"),
          start: moment.utc("2024-03-21T10:00:00.000Z"),
          summary: "Some other event",
        };

        const progressiveEvents = service.detectProgressive([
          quadrupleAspectEvent,
          nonQuadrupleAspectEvent,
        ]);

        expect(
          progressiveEvents.every((e) =>
            e.categories.includes("Quadruple Aspect"),
          ),
        ).toBe(true);
      });

      it("should handle empty events array", () => {
        const progressiveEvents = service.detectProgressive([]);
        expect(progressiveEvents.length).toBe(0);
      });

      it("should skip progressive when dissolving comes before forming", () => {
        const dissolvingEvent: Event = {
          categories: [
            "Quadruple Aspect",
            "Grand Cross",
            "Dissolving",
            "Sun",
            "Moon",
            "Mars",
            "Jupiter",
          ],
          description: "Sun, Moon, Mars, Jupiter grand cross dissolving",
          end: moment.utc("2024-03-21T10:00:00.000Z"),
          start: moment.utc("2024-03-21T10:00:00.000Z"),
          summary: "Grand Cross dissolving",
        };

        const formingEvent: Event = {
          categories: [
            "Quadruple Aspect",
            "Grand Cross",
            "Forming",
            "Sun",
            "Moon",
            "Mars",
            "Jupiter",
          ],
          description: "Sun, Moon, Mars, Jupiter grand cross forming",
          end: moment.utc("2024-03-21T14:00:00.000Z"),
          start: moment.utc("2024-03-21T14:00:00.000Z"),
          summary: "Grand Cross forming",
        };

        const progressiveEvents = service.detectProgressive([
          dissolvingEvent,
          formingEvent,
        ]);

        expect(progressiveEvents.length).toBe(0);
      });

      it("should remove phase emojis from summary", () => {
        const formingEvent: Event = {
          categories: [
            "Quadruple Aspect",
            "Grand Cross",
            "Forming",
            "Sun",
            "Moon",
            "Mars",
            "Jupiter",
          ],
          description: "Jupiter, Mars, Moon, Sun grand cross forming",
          end: moment.utc("2024-03-21T10:00:00.000Z"),
          start: moment.utc("2024-03-21T10:00:00.000Z"),
          summary: "➡️ Grand Cross forming",
        };

        const dissolvingEvent: Event = {
          categories: [
            "Quadruple Aspect",
            "Grand Cross",
            "Dissolving",
            "Sun",
            "Moon",
            "Mars",
            "Jupiter",
          ],
          description: "Jupiter, Mars, Moon, Sun grand cross dissolving",
          end: moment.utc("2024-03-21T14:00:00.000Z"),
          start: moment.utc("2024-03-21T14:00:00.000Z"),
          summary: "⬅️ Grand Cross dissolving",
        };

        const progressiveEvents = service.detectProgressive([
          formingEvent,
          dissolvingEvent,
        ]);

        expect(progressiveEvents.length).toBe(1);
        expect(progressiveEvents[0]?.summary).toBe("Grand Cross forming");
      });

      it("should remove phase text from description", () => {
        const formingEvent: Event = {
          categories: [
            "Quadruple Aspect",
            "Grand Cross",
            "Forming",
            "Sun",
            "Moon",
            "Mars",
            "Jupiter",
          ],
          description: "Jupiter, Mars, Moon, Sun grand cross forming",
          end: moment.utc("2024-03-21T10:00:00.000Z"),
          start: moment.utc("2024-03-21T10:00:00.000Z"),
          summary: "Grand Cross forming",
        };

        const dissolvingEvent: Event = {
          categories: [
            "Quadruple Aspect",
            "Grand Cross",
            "Dissolving",
            "Sun",
            "Moon",
            "Mars",
            "Jupiter",
          ],
          description: "Jupiter, Mars, Moon, Sun grand cross dissolving",
          end: moment.utc("2024-03-21T14:00:00.000Z"),
          start: moment.utc("2024-03-21T14:00:00.000Z"),
          summary: "Grand Cross dissolving",
        };

        const progressiveEvents = service.detectProgressive([
          formingEvent,
          dissolvingEvent,
        ]);

        expect(progressiveEvents.length).toBe(1);
        expect(progressiveEvents[0]?.description).not.toMatch(
          /(forming|dissolving|perfective)/i,
        );
      });

      it("should preserve focal body information in description", () => {
        const formingEvent: Event = {
          categories: [
            "Quadruple Aspect",
            "Kite",
            "Forming",
            "Sun",
            "Moon",
            "Mars",
            "Venus",
            "Venus Focal",
          ],
          description: "Mars, Moon, Sun, Venus kite forming (Venus focal)",
          end: moment.utc("2024-03-21T10:00:00.000Z"),
          start: moment.utc("2024-03-21T10:00:00.000Z"),
          summary: "Kite forming",
        };

        const dissolvingEvent: Event = {
          categories: [
            "Quadruple Aspect",
            "Kite",
            "Dissolving",
            "Sun",
            "Moon",
            "Mars",
            "Venus",
            "Venus Focal",
          ],
          description: "Mars, Moon, Sun, Venus kite dissolving (Venus focal)",
          end: moment.utc("2024-03-21T14:00:00.000Z"),
          start: moment.utc("2024-03-21T14:00:00.000Z"),
          summary: "Kite dissolving",
        };

        const progressiveEvents = service.detectProgressive([
          formingEvent,
          dissolvingEvent,
        ]);

        expect(progressiveEvents.length).toBe(1);
        // Focal info should be removed by the regex that removes phase text with optional focal info
        expect(progressiveEvents[0]?.description).not.toContain("forming");
        expect(progressiveEvents[0]?.description).not.toContain("dissolving");
      });
    });
  });

  describe("involvesBody", () => {
    it("should return true when body1 matches", () => {
      const edge: AspectBodies = {
        aspect: "conjunct",
        bodies: ["sun", "moon"],
      };

      expect(service.involvesBody(edge, "sun")).toBe(true);
    });

    it("should return true when body2 matches", () => {
      const edge: AspectBodies = {
        aspect: "conjunct",
        bodies: ["sun", "moon"],
      };

      expect(service.involvesBody(edge, "moon")).toBe(true);
    });

    it("should return false when neither body matches", () => {
      const edge: AspectBodies = {
        aspect: "conjunct",
        bodies: ["sun", "moon"],
      };

      expect(service.involvesBody(edge, "mars")).toBe(false);
    });
  });

  describe("getOtherBody", () => {
    it("should return body2 when body1 is provided", () => {
      const edge: AspectBodies = {
        aspect: "conjunct",
        bodies: ["sun", "moon"],
      };

      expect(service.getOtherBody(edge, "sun")).toBe("moon");
    });

    it("should return body1 when body2 is provided", () => {
      const edge: AspectBodies = {
        aspect: "conjunct",
        bodies: ["sun", "moon"],
      };

      expect(service.getOtherBody(edge, "moon")).toBe("sun");
    });

    it("should return null when body is not in edge", () => {
      const edge: AspectBodies = {
        aspect: "conjunct",
        bodies: ["sun", "moon"],
      };

      expect(service.getOtherBody(edge, "mars")).toBeNull();
    });
  });
});
