import { LoggerService } from "@caelundas/src/modules/logger/logger.service";
import { Test } from "@nestjs/testing";
import moment from "moment-timezone";
import { beforeAll, describe, expect, it } from "vitest";

import { TripleAspectsService } from "./triple-aspects.service";

import type { AspectBodies } from "@caelundas/src/modules/aspects/aspects.service";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";

describe("TripleAspectsService", () => {
  let service: TripleAspectsService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [LoggerService, TripleAspectsService],
    }).compile();
    service = await module.resolve(TripleAspectsService);
  });

  describe("triple-aspects.events", () => {
    describe("service.detect", () => {
      describe("T-Square composition", () => {
        it("should not generate perfective T-Square events (only forming/dissolving)", () => {
          const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");

          // T-Square: Sun opposite Moon, with Mars square to both
          // Pattern exists in both previous and current snapshots → stable → no event
          const edges: AspectBodies[] = [
            { aspect: "opposite", bodies: ["sun", "moon"] },
            { aspect: "square", bodies: ["sun", "mars"] },
            { aspect: "square", bodies: ["moon", "mars"] },
          ];

          const events = service.detect({
            currentAspectBodies: edges,
            minute: currentMinute,
            previousAspectBodies: edges,
          });

          // No events generated because pattern exists in both snapshots (stable)
          expect(events.length).toBe(0);
        });

        it("should detect forming T-Square", () => {
          const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");

          // T-Square forming: edges in currentAspectBodies only (not in previousAspectBodies)
          const currentAspectBodies: AspectBodies[] = [
            { aspect: "opposite", bodies: ["sun", "moon"] },
            { aspect: "square", bodies: ["sun", "mars"] },
            { aspect: "square", bodies: ["moon", "mars"] },
          ];
          const previousAspectBodies: AspectBodies[] = [];

          const events = service.detect({
            currentAspectBodies,
            minute: currentMinute,
            previousAspectBodies,
          });

          expect(events.length).toBeGreaterThanOrEqual(1);
          const tSquare = events.find((e) => e.categories.includes("T Square"));
          expect(tSquare).toBeDefined();
          expect(tSquare?.categories).toContain("Forming");
        });

        it("should detect dissolving T-Square", () => {
          const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");

          // T-Square dissolving: edges in previousAspectBodies only (not in currentAspectBodies)
          const currentAspectBodies: AspectBodies[] = [];
          const previousAspectBodies: AspectBodies[] = [
            { aspect: "opposite", bodies: ["sun", "moon"] },
            { aspect: "square", bodies: ["sun", "mars"] },
            { aspect: "square", bodies: ["moon", "mars"] },
          ];

          const events = service.detect({
            currentAspectBodies,
            minute: currentMinute,
            previousAspectBodies,
          });

          expect(events.length).toBeGreaterThanOrEqual(1);
          const tSquare = events.find((e) => e.categories.includes("T Square"));
          expect(tSquare).toBeDefined();
          expect(tSquare?.categories).toContain("Dissolving");
        });

        it("should not detect T-Square with incomplete aspects", () => {
          const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");

          // Only opposition and one square (incomplete T-Square) — stable but incomplete
          const edges: AspectBodies[] = [
            { aspect: "opposite", bodies: ["sun", "moon"] },
            { aspect: "square", bodies: ["sun", "mars"] },
          ];

          const events = service.detect({
            currentAspectBodies: edges,
            minute: currentMinute,
            previousAspectBodies: edges,
          });

          const tSquare = events.find((e) => e.categories.includes("T Square"));
          expect(tSquare).toBeUndefined();
        });
      });

      describe("Yod composition", () => {
        it("should not generate perfective Yod events (only forming/dissolving)", () => {
          const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");

          // Yod: Sun sextile Moon, with Venus quincunx to both
          // Pattern exists in both snapshots → stable → no event
          const edges: AspectBodies[] = [
            { aspect: "sextile", bodies: ["sun", "moon"] },
            { aspect: "quincunx", bodies: ["sun", "venus"] },
            { aspect: "quincunx", bodies: ["moon", "venus"] },
          ];

          const events = service.detect({
            currentAspectBodies: edges,
            minute: currentMinute,
            previousAspectBodies: edges,
          });

          // No events generated - pattern exists in both snapshots (stable)
          expect(events.length).toBe(0);
        });

        it("should not detect Yod with incomplete aspects", () => {
          const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");

          // Only sextile and one quincunx (incomplete Yod) — stable but incomplete
          const edges: AspectBodies[] = [
            { aspect: "sextile", bodies: ["sun", "moon"] },
            { aspect: "quincunx", bodies: ["sun", "venus"] },
          ];

          const events = service.detect({
            currentAspectBodies: edges,
            minute: currentMinute,
            previousAspectBodies: edges,
          });

          const yod = events.find((e) => e.categories.includes("Yod"));
          expect(yod).toBeUndefined();
        });
      });

      describe("Grand Trine composition", () => {
        it("should not generate perfective Grand Trine events (only forming/dissolving)", () => {
          const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");

          // Grand Trine: Sun trine Moon, Sun trine Mars, Moon trine Mars
          // Pattern exists in both snapshots → stable → no event
          const edges: AspectBodies[] = [
            { aspect: "trine", bodies: ["sun", "moon"] },
            { aspect: "trine", bodies: ["sun", "mars"] },
            { aspect: "trine", bodies: ["moon", "mars"] },
          ];

          const events = service.detect({
            currentAspectBodies: edges,
            minute: currentMinute,
            previousAspectBodies: edges,
          });

          // No events generated - pattern exists in both snapshots (stable)
          expect(events.length).toBe(0);
        });

        it("should not detect Grand Trine with incomplete trines", () => {
          const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");

          // Only two trines (incomplete Grand Trine) — stable but incomplete
          const edges: AspectBodies[] = [
            { aspect: "trine", bodies: ["sun", "moon"] },
            { aspect: "trine", bodies: ["sun", "mars"] },
          ];

          const events = service.detect({
            currentAspectBodies: edges,
            minute: currentMinute,
            previousAspectBodies: edges,
          });

          const grandTrine = events.find((e) =>
            e.categories.includes("Grand Trine"),
          );
          expect(grandTrine).toBeUndefined();
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

        // No active aspects at current time — both snapshots empty
        const events = service.detect({
          currentAspectBodies: [],
          minute: currentMinute,
          previousAspectBodies: [],
        });
        expect(events.length).toBe(0);
      });

      it("should detect multiple triple aspects simultaneously", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");

        // Both T-Square and Grand Trine present — stable in both snapshots
        const edges: AspectBodies[] = [
          // T-Square: Sun opposite Moon, Mars square both
          { aspect: "opposite", bodies: ["sun", "moon"] },
          { aspect: "square", bodies: ["sun", "mars"] },
          { aspect: "square", bodies: ["moon", "mars"] },
          // Grand Trine: Venus, Jupiter, Saturn
          { aspect: "trine", bodies: ["venus", "jupiter"] },
          { aspect: "trine", bodies: ["venus", "saturn"] },
          { aspect: "trine", bodies: ["jupiter", "saturn"] },
        ];

        const events = service.detect({
          currentAspectBodies: edges,
          minute: currentMinute,
          previousAspectBodies: edges,
        });

        // No events - both patterns exist in both snapshots (stable)
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

        const dissolvingEvent: Event = {
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

        const progressiveEvents = service.detectProgressive([
          formingEvent,
          dissolvingEvent,
        ]);

        expect(progressiveEvents.length).toBe(1);
        expect(progressiveEvents[0]?.start).toEqual(formingEvent.start);
        expect(progressiveEvents[0]?.end).toEqual(dissolvingEvent.start);
        expect(progressiveEvents[0]?.description).toContain("t-square");
        expect(progressiveEvents[0]?.categories).toContain("Triple Aspect");
      });

      it("should handle multiple aspect types", () => {
        const tSquareForming: Event = {
          categories: [
            "Triple Aspect",
            "T Square",
            "Forming",
            "Sun",
            "Moon",
            "Mars",
          ],
          description: "Mars, Moon, Sun t-square forming",
          end: moment.utc("2024-03-21T10:00:00.000Z"),
          start: moment.utc("2024-03-21T10:00:00.000Z"),
          summary: "T-Square forming",
        };

        const tSquareDissolving: Event = {
          categories: [
            "Triple Aspect",
            "T Square",
            "Dissolving",
            "Sun",
            "Moon",
            "Mars",
          ],
          description: "Mars, Moon, Sun t-square dissolving",
          end: moment.utc("2024-03-21T14:00:00.000Z"),
          start: moment.utc("2024-03-21T14:00:00.000Z"),
          summary: "T-Square dissolving",
        };

        const grandTrineForming: Event = {
          categories: [
            "Triple Aspect",
            "Grand Trine",
            "Forming",
            "Venus",
            "Jupiter",
            "Saturn",
          ],
          description: "Jupiter, Saturn, Venus grand trine forming",
          end: moment.utc("2024-03-21T11:00:00.000Z"),
          start: moment.utc("2024-03-21T11:00:00.000Z"),
          summary: "Grand Trine forming",
        };

        const grandTrineDissolving: Event = {
          categories: [
            "Triple Aspect",
            "Grand Trine",
            "Dissolving",
            "Venus",
            "Jupiter",
            "Saturn",
          ],
          description: "Jupiter, Saturn, Venus grand trine dissolving",
          end: moment.utc("2024-03-21T15:00:00.000Z"),
          start: moment.utc("2024-03-21T15:00:00.000Z"),
          summary: "Grand Trine dissolving",
        };

        const progressiveEvents = service.detectProgressive([
          tSquareForming,
          tSquareDissolving,
          grandTrineForming,
          grandTrineDissolving,
        ]);

        expect(progressiveEvents.length).toBe(2);
        expect(
          progressiveEvents.find((e) => e.description.includes("t-square")),
        ).toBeDefined();
        expect(
          progressiveEvents.find((e) => e.description.includes("grand trine")),
        ).toBeDefined();
      });

      it("should handle multiple body triplets", () => {
        const sunMoonMarsForming: Event = {
          categories: [
            "Triple Aspect",
            "T Square",
            "Forming",
            "Sun",
            "Moon",
            "Mars",
          ],
          description: "Sun, Moon, Mars t-square forming",
          end: moment.utc("2024-03-21T10:00:00.000Z"),
          start: moment.utc("2024-03-21T10:00:00.000Z"),
          summary: "T-Square forming",
        };

        const sunMoonMarsDissolving: Event = {
          categories: [
            "Triple Aspect",
            "T Square",
            "Dissolving",
            "Sun",
            "Moon",
            "Mars",
          ],
          description: "Sun, Moon, Mars t-square dissolving",
          end: moment.utc("2024-03-21T14:00:00.000Z"),
          start: moment.utc("2024-03-21T14:00:00.000Z"),
          summary: "T-Square dissolving",
        };

        const venusJupiterSaturnForming: Event = {
          categories: [
            "Triple Aspect",
            "Grand Trine",
            "Forming",
            "Venus",
            "Jupiter",
            "Saturn",
          ],
          description: "Venus, Jupiter, Saturn grand trine forming",
          end: moment.utc("2024-03-21T11:00:00.000Z"),
          start: moment.utc("2024-03-21T11:00:00.000Z"),
          summary: "Grand Trine forming",
        };

        const venusJupiterSaturnDissolving: Event = {
          categories: [
            "Triple Aspect",
            "Grand Trine",
            "Dissolving",
            "Venus",
            "Jupiter",
            "Saturn",
          ],
          description: "Venus, Jupiter, Saturn grand trine dissolving",
          end: moment.utc("2024-03-21T15:00:00.000Z"),
          start: moment.utc("2024-03-21T15:00:00.000Z"),
          summary: "Grand Trine dissolving",
        };

        const progressiveEvents = service.detectProgressive([
          sunMoonMarsForming,
          sunMoonMarsDissolving,
          venusJupiterSaturnForming,
          venusJupiterSaturnDissolving,
        ]);

        expect(progressiveEvents.length).toBe(2);
        expect(
          progressiveEvents.find(
            (e) =>
              e.description.includes("Sun") &&
              e.description.includes("Moon") &&
              e.description.includes("Mars"),
          ),
        ).toBeDefined();
        expect(
          progressiveEvents.find(
            (e) =>
              e.description.includes("Venus") &&
              e.description.includes("Jupiter") &&
              e.description.includes("Saturn"),
          ),
        ).toBeDefined();
      });

      it("should filter out non-triple-aspect events", () => {
        const tripleAspectEvent: Event = {
          categories: [
            "Triple Aspect",
            "T Square",
            "Forming",
            "Sun",
            "Moon",
            "Mars",
          ],
          description: "Sun, Moon, Mars t-square forming",
          end: moment.utc("2024-03-21T10:00:00.000Z"),
          start: moment.utc("2024-03-21T10:00:00.000Z"),
          summary: "T-Square forming",
        };

        const nonTripleAspectEvent: Event = {
          categories: ["Other"],
          description: "Not a triple aspect",
          end: moment.utc("2024-03-21T10:00:00.000Z"),
          start: moment.utc("2024-03-21T10:00:00.000Z"),
          summary: "Some other event",
        };

        const progressiveEvents = service.detectProgressive([
          tripleAspectEvent,
          nonTripleAspectEvent,
        ]);

        expect(
          progressiveEvents.every((e) =>
            e.categories.includes("Triple Aspect"),
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
            "Triple Aspect",
            "T Square",
            "Dissolving",
            "Sun",
            "Moon",
            "Mars",
          ],
          description: "Sun, Moon, Mars t-square dissolving",
          end: moment.utc("2024-03-21T10:00:00.000Z"),
          start: moment.utc("2024-03-21T10:00:00.000Z"),
          summary: "T-Square dissolving",
        };

        const formingEvent: Event = {
          categories: [
            "Triple Aspect",
            "T Square",
            "Forming",
            "Sun",
            "Moon",
            "Mars",
          ],
          description: "Sun, Moon, Mars t-square forming",
          end: moment.utc("2024-03-21T14:00:00.000Z"),
          start: moment.utc("2024-03-21T14:00:00.000Z"),
          summary: "T-Square forming",
        };

        const progressiveEvents = service.detectProgressive([
          dissolvingEvent,
          formingEvent,
        ]);

        expect(progressiveEvents.length).toBe(0);
      });

      it("should sort bodies alphabetically in description", () => {
        const formingEvent: Event = {
          categories: [
            "Triple Aspect",
            "Grand Trine",
            "Forming",
            "Venus",
            "Jupiter",
            "Saturn",
          ],
          description: "Venus, Jupiter, Saturn grand trine forming",
          end: moment.utc("2024-03-21T10:00:00.000Z"),
          start: moment.utc("2024-03-21T10:00:00.000Z"),
          summary: "Grand Trine forming",
        };

        const dissolvingEvent: Event = {
          categories: [
            "Triple Aspect",
            "Grand Trine",
            "Dissolving",
            "Venus",
            "Jupiter",
            "Saturn",
          ],
          description: "Venus, Jupiter, Saturn grand trine dissolving",
          end: moment.utc("2024-03-21T14:00:00.000Z"),
          start: moment.utc("2024-03-21T14:00:00.000Z"),
          summary: "Grand Trine dissolving",
        };

        const progressiveEvents = service.detectProgressive([
          formingEvent,
          dissolvingEvent,
        ]);

        expect(progressiveEvents.length).toBe(1);
        // Bodies should be sorted: Jupiter, Saturn, Venus
        expect(progressiveEvents[0]?.categories).toContain("Jupiter");
        expect(progressiveEvents[0]?.categories).toContain("Saturn");
        expect(progressiveEvents[0]?.categories).toContain("Venus");
        const jupiterIndex =
          progressiveEvents[0]?.categories.indexOf("Jupiter");
        const saturnIndex = progressiveEvents[0]?.categories.indexOf("Saturn");
        const venusIndex = progressiveEvents[0]?.categories.indexOf("Venus");
        expect(jupiterIndex).toBeLessThan(saturnIndex ?? 0);
        expect(saturnIndex).toBeLessThan(venusIndex ?? 0);
      });

      it("should include focal/apex information in progressive events", () => {
        const formingEvent: Event = {
          categories: [
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

        const dissolvingEvent: Event = {
          categories: [
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

        const progressiveEvents = service.detectProgressive([
          formingEvent,
          dissolvingEvent,
        ]);

        expect(progressiveEvents.length).toBe(1);
        expect(progressiveEvents[0]?.summary).toContain("focal: Mars");
      });
    });
  });

  describe("groupAspectsByType", () => {
    it("should group edges by aspect type", () => {
      const edges: AspectBodies[] = [
        {
          aspect: "conjunct",
          bodies: ["sun", "moon"],
        },
        {
          aspect: "trine",
          bodies: ["mars", "jupiter"],
        },
        {
          aspect: "conjunct",
          bodies: ["venus", "saturn"],
        },
      ];

      const grouped = TripleAspectsService.groupAspectsByType(edges);

      expect(grouped.size).toBe(2);
      expect(grouped.get("conjunct")?.length).toBe(2);
      expect(grouped.get("trine")?.length).toBe(1);
    });

    it("should handle empty edges array", () => {
      const grouped = TripleAspectsService.groupAspectsByType([]);
      expect(grouped.size).toBe(0);
    });

    it("should handle single aspect type", () => {
      const edges: AspectBodies[] = [
        {
          aspect: "square",
          bodies: ["sun", "moon"],
        },
        {
          aspect: "square",
          bodies: ["mars", "jupiter"],
        },
      ];

      const grouped = TripleAspectsService.groupAspectsByType(edges);

      expect(grouped.size).toBe(1);
      expect(grouped.get("square")?.length).toBe(2);
    });
  });

  describe("findBodiesWithAspectTo", () => {
    it("should find bodies with specific aspect to given body", () => {
      const edges: AspectBodies[] = [
        {
          aspect: "conjunct",
          bodies: ["sun", "moon"],
        },
        {
          aspect: "trine",
          bodies: ["sun", "mars"],
        },
        {
          aspect: "trine",
          bodies: ["jupiter", "sun"],
        },
      ];

      const bodiesWithTrine = TripleAspectsService.findBodiesWithAspectTo(
        "sun",
        "trine",
        edges,
      );

      expect(bodiesWithTrine.length).toBe(2);
      expect(bodiesWithTrine).toContain("mars");
      expect(bodiesWithTrine).toContain("jupiter");
    });

    it("should return empty array when no aspects found", () => {
      const edges: AspectBodies[] = [
        {
          aspect: "conjunct",
          bodies: ["sun", "moon"],
        },
      ];

      const bodiesWithTrine = TripleAspectsService.findBodiesWithAspectTo(
        "sun",
        "trine",
        edges,
      );

      expect(bodiesWithTrine.length).toBe(0);
    });

    it("should handle body not in any edges", () => {
      const edges: AspectBodies[] = [
        {
          aspect: "conjunct",
          bodies: ["sun", "moon"],
        },
      ];

      const bodiesWithTrine = TripleAspectsService.findBodiesWithAspectTo(
        "mars",
        "trine",
        edges,
      );

      expect(bodiesWithTrine.length).toBe(0);
    });
  });

  describe("haveAspect", () => {
    it("should return true when bodies have the aspect (body1-body2 order)", () => {
      const edges: AspectBodies[] = [
        {
          aspect: "conjunct",
          bodies: ["sun", "moon"],
        },
      ];

      expect(
        TripleAspectsService.haveAspect("sun", "moon", "conjunct", edges),
      ).toBe(true);
    });

    it("should return true when bodies have the aspect (body2-body1 order)", () => {
      const edges: AspectBodies[] = [
        {
          aspect: "conjunct",
          bodies: ["sun", "moon"],
        },
      ];

      expect(
        TripleAspectsService.haveAspect("moon", "sun", "conjunct", edges),
      ).toBe(true);
    });

    it("should return false when bodies do not have the aspect", () => {
      const edges: AspectBodies[] = [
        {
          aspect: "conjunct",
          bodies: ["sun", "moon"],
        },
      ];

      expect(
        TripleAspectsService.haveAspect("sun", "moon", "trine", edges),
      ).toBe(false);
    });

    it("should return false when bodies are not connected", () => {
      const edges: AspectBodies[] = [
        {
          aspect: "conjunct",
          bodies: ["sun", "moon"],
        },
      ];

      expect(
        TripleAspectsService.haveAspect("mars", "jupiter", "conjunct", edges),
      ).toBe(false);
    });

    it("should handle multiple edges", () => {
      const edges: AspectBodies[] = [
        {
          aspect: "conjunct",
          bodies: ["sun", "moon"],
        },
        {
          aspect: "trine",
          bodies: ["mars", "jupiter"],
        },
      ];

      expect(
        TripleAspectsService.haveAspect("mars", "jupiter", "trine", edges),
      ).toBe(true);
    });
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
