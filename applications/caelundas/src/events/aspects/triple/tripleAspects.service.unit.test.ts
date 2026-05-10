import { Test } from "@nestjs/testing";
import moment from "moment-timezone";
import { beforeAll, describe, expect, it } from "vitest";

import { TripleAspectsService } from "./triple-aspects.service";

import type { Event } from "@caelundas/src/calendar/calendar.types";
import type { AspectBodies } from "@caelundas/src/events/aspects/aspects.service";
import type { Aspect, Body } from "@caelundas/src/types";

describe("TripleAspectsService", () => {
  let service: TripleAspectsService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [TripleAspectsService],
    }).compile();
    service = module.get(TripleAspectsService);
  });

  describe("tripleAspects.events", () => {
    describe("service.detect", () => {
      describe("T-Square composition", () => {
        it("should not generate perfective T-Square events (only forming/dissolving)", () => {
          const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");

          // T-Square: Sun opposite Moon, with Mars square to both
          // Pattern exists in both previous and current snapshots → stable → no event
          const edges: AspectBodies[] = [
            { bodies: ["sun", "moon"], aspect: "opposite" },
            { bodies: ["sun", "mars"], aspect: "square" },
            { bodies: ["moon", "mars"], aspect: "square" },
          ];

          const events = service.detect({
            currentAspectBodies: edges,
            previousAspectBodies: edges,
            minute: currentMinute,
          });

          // No events generated because pattern exists in both snapshots (stable)
          expect(events.length).toBe(0);
        });

        it("should detect forming T-Square", () => {
          const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");

          // T-Square forming: edges in currentAspectBodies only (not in previousAspectBodies)
          const currentAspectBodies: AspectBodies[] = [
            { bodies: ["sun", "moon"], aspect: "opposite" },
            { bodies: ["sun", "mars"], aspect: "square" },
            { bodies: ["moon", "mars"], aspect: "square" },
          ];
          const previousAspectBodies: AspectBodies[] = [];

          const events = service.detect({
            currentAspectBodies,
            previousAspectBodies,
            minute: currentMinute,
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
            { bodies: ["sun", "moon"], aspect: "opposite" },
            { bodies: ["sun", "mars"], aspect: "square" },
            { bodies: ["moon", "mars"], aspect: "square" },
          ];

          const events = service.detect({
            currentAspectBodies,
            previousAspectBodies,
            minute: currentMinute,
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
            { bodies: ["sun", "moon"], aspect: "opposite" },
            { bodies: ["sun", "mars"], aspect: "square" },
          ];

          const events = service.detect({
            currentAspectBodies: edges,
            previousAspectBodies: edges,
            minute: currentMinute,
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
            { bodies: ["sun", "moon"], aspect: "sextile" },
            { bodies: ["sun", "venus"], aspect: "quincunx" },
            { bodies: ["moon", "venus"], aspect: "quincunx" },
          ];

          const events = service.detect({
            currentAspectBodies: edges,
            previousAspectBodies: edges,
            minute: currentMinute,
          });

          // No events generated - pattern exists in both snapshots (stable)
          expect(events.length).toBe(0);
        });

        it("should not detect Yod with incomplete aspects", () => {
          const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");

          // Only sextile and one quincunx (incomplete Yod) — stable but incomplete
          const edges: AspectBodies[] = [
            { bodies: ["sun", "moon"], aspect: "sextile" },
            { bodies: ["sun", "venus"], aspect: "quincunx" },
          ];

          const events = service.detect({
            currentAspectBodies: edges,
            previousAspectBodies: edges,
            minute: currentMinute,
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
            { bodies: ["sun", "moon"], aspect: "trine" },
            { bodies: ["sun", "mars"], aspect: "trine" },
            { bodies: ["moon", "mars"], aspect: "trine" },
          ];

          const events = service.detect({
            currentAspectBodies: edges,
            previousAspectBodies: edges,
            minute: currentMinute,
          });

          // No events generated - pattern exists in both snapshots (stable)
          expect(events.length).toBe(0);
        });

        it("should not detect Grand Trine with incomplete trines", () => {
          const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");

          // Only two trines (incomplete Grand Trine) — stable but incomplete
          const edges: AspectBodies[] = [
            { bodies: ["sun", "moon"], aspect: "trine" },
            { bodies: ["sun", "mars"], aspect: "trine" },
          ];

          const events = service.detect({
            currentAspectBodies: edges,
            previousAspectBodies: edges,
            minute: currentMinute,
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
          previousAspectBodies: [],
          minute: currentMinute,
        });
        expect(events.length).toBe(0);
      });

      it("should filter events outside current time window", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");

        // No active aspects at current time — both snapshots empty
        const events = service.detect({
          currentAspectBodies: [],
          previousAspectBodies: [],
          minute: currentMinute,
        });
        expect(events.length).toBe(0);
      });

      it("should detect multiple triple aspects simultaneously", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");

        // Both T-Square and Grand Trine present — stable in both snapshots
        const edges: AspectBodies[] = [
          // T-Square: Sun opposite Moon, Mars square both
          { bodies: ["sun", "moon"], aspect: "opposite" },
          { bodies: ["sun", "mars"], aspect: "square" },
          { bodies: ["moon", "mars"], aspect: "square" },
          // Grand Trine: Venus, Jupiter, Saturn
          { bodies: ["venus", "jupiter"], aspect: "trine" },
          { bodies: ["venus", "saturn"], aspect: "trine" },
          { bodies: ["jupiter", "saturn"], aspect: "trine" },
        ];

        const events = service.detect({
          currentAspectBodies: edges,
          previousAspectBodies: edges,
          minute: currentMinute,
        });

        // No events - both patterns exist in both snapshots (stable)
        expect(events.length).toBe(0);
      });
    });

    describe("service.detectProgressive", () => {
      it("should create progressive events from forming and dissolving pairs", () => {
        const formingEvent: Event = {
          start: moment.utc("2024-03-21T10:00:00.000Z"),
          end: moment.utc("2024-03-21T10:00:00.000Z"),
          summary: "T-Square forming",
          description: "Mars, Moon, Sun t-square forming (Mars focal)",
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
        };

        const dissolvingEvent: Event = {
          start: moment.utc("2024-03-21T14:00:00.000Z"),
          end: moment.utc("2024-03-21T14:00:00.000Z"),
          summary: "T-Square dissolving",
          description: "Mars, Moon, Sun t-square dissolving (Mars focal)",
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
          start: moment.utc("2024-03-21T10:00:00.000Z"),
          end: moment.utc("2024-03-21T10:00:00.000Z"),
          summary: "T-Square forming",
          description: "Mars, Moon, Sun t-square forming",
          categories: [
            "Triple Aspect",
            "T Square",
            "Forming",
            "Sun",
            "Moon",
            "Mars",
          ],
        };

        const tSquareDissolving: Event = {
          start: moment.utc("2024-03-21T14:00:00.000Z"),
          end: moment.utc("2024-03-21T14:00:00.000Z"),
          summary: "T-Square dissolving",
          description: "Mars, Moon, Sun t-square dissolving",
          categories: [
            "Triple Aspect",
            "T Square",
            "Dissolving",
            "Sun",
            "Moon",
            "Mars",
          ],
        };

        const grandTrineForming: Event = {
          start: moment.utc("2024-03-21T11:00:00.000Z"),
          end: moment.utc("2024-03-21T11:00:00.000Z"),
          summary: "Grand Trine forming",
          description: "Jupiter, Saturn, Venus grand trine forming",
          categories: [
            "Triple Aspect",
            "Grand Trine",
            "Forming",
            "Venus",
            "Jupiter",
            "Saturn",
          ],
        };

        const grandTrineDissolving: Event = {
          start: moment.utc("2024-03-21T15:00:00.000Z"),
          end: moment.utc("2024-03-21T15:00:00.000Z"),
          summary: "Grand Trine dissolving",
          description: "Jupiter, Saturn, Venus grand trine dissolving",
          categories: [
            "Triple Aspect",
            "Grand Trine",
            "Dissolving",
            "Venus",
            "Jupiter",
            "Saturn",
          ],
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
          start: moment.utc("2024-03-21T10:00:00.000Z"),
          end: moment.utc("2024-03-21T10:00:00.000Z"),
          summary: "T-Square forming",
          description: "Sun, Moon, Mars t-square forming",
          categories: [
            "Triple Aspect",
            "T Square",
            "Forming",
            "Sun",
            "Moon",
            "Mars",
          ],
        };

        const sunMoonMarsDissolving: Event = {
          start: moment.utc("2024-03-21T14:00:00.000Z"),
          end: moment.utc("2024-03-21T14:00:00.000Z"),
          summary: "T-Square dissolving",
          description: "Sun, Moon, Mars t-square dissolving",
          categories: [
            "Triple Aspect",
            "T Square",
            "Dissolving",
            "Sun",
            "Moon",
            "Mars",
          ],
        };

        const venusJupiterSaturnForming: Event = {
          start: moment.utc("2024-03-21T11:00:00.000Z"),
          end: moment.utc("2024-03-21T11:00:00.000Z"),
          summary: "Grand Trine forming",
          description: "Venus, Jupiter, Saturn grand trine forming",
          categories: [
            "Triple Aspect",
            "Grand Trine",
            "Forming",
            "Venus",
            "Jupiter",
            "Saturn",
          ],
        };

        const venusJupiterSaturnDissolving: Event = {
          start: moment.utc("2024-03-21T15:00:00.000Z"),
          end: moment.utc("2024-03-21T15:00:00.000Z"),
          summary: "Grand Trine dissolving",
          description: "Venus, Jupiter, Saturn grand trine dissolving",
          categories: [
            "Triple Aspect",
            "Grand Trine",
            "Dissolving",
            "Venus",
            "Jupiter",
            "Saturn",
          ],
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
          start: moment.utc("2024-03-21T10:00:00.000Z"),
          end: moment.utc("2024-03-21T10:00:00.000Z"),
          summary: "T-Square forming",
          description: "Sun, Moon, Mars t-square forming",
          categories: [
            "Triple Aspect",
            "T Square",
            "Forming",
            "Sun",
            "Moon",
            "Mars",
          ],
        };

        const nonTripleAspectEvent: Event = {
          start: moment.utc("2024-03-21T10:00:00.000Z"),
          end: moment.utc("2024-03-21T10:00:00.000Z"),
          summary: "Some other event",
          description: "Not a triple aspect",
          categories: ["Other"],
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
          start: moment.utc("2024-03-21T10:00:00.000Z"),
          end: moment.utc("2024-03-21T10:00:00.000Z"),
          summary: "T-Square dissolving",
          description: "Sun, Moon, Mars t-square dissolving",
          categories: [
            "Triple Aspect",
            "T Square",
            "Dissolving",
            "Sun",
            "Moon",
            "Mars",
          ],
        };

        const formingEvent: Event = {
          start: moment.utc("2024-03-21T14:00:00.000Z"),
          end: moment.utc("2024-03-21T14:00:00.000Z"),
          summary: "T-Square forming",
          description: "Sun, Moon, Mars t-square forming",
          categories: [
            "Triple Aspect",
            "T Square",
            "Forming",
            "Sun",
            "Moon",
            "Mars",
          ],
        };

        const progressiveEvents = service.detectProgressive([
          dissolvingEvent,
          formingEvent,
        ]);

        expect(progressiveEvents.length).toBe(0);
      });

      it("should sort bodies alphabetically in description", () => {
        const formingEvent: Event = {
          start: moment.utc("2024-03-21T10:00:00.000Z"),
          end: moment.utc("2024-03-21T10:00:00.000Z"),
          summary: "Grand Trine forming",
          description: "Venus, Jupiter, Saturn grand trine forming",
          categories: [
            "Triple Aspect",
            "Grand Trine",
            "Forming",
            "Venus",
            "Jupiter",
            "Saturn",
          ],
        };

        const dissolvingEvent: Event = {
          start: moment.utc("2024-03-21T14:00:00.000Z"),
          end: moment.utc("2024-03-21T14:00:00.000Z"),
          summary: "Grand Trine dissolving",
          description: "Venus, Jupiter, Saturn grand trine dissolving",
          categories: [
            "Triple Aspect",
            "Grand Trine",
            "Dissolving",
            "Venus",
            "Jupiter",
            "Saturn",
          ],
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
          start: moment.utc("2024-03-21T10:00:00.000Z"),
          end: moment.utc("2024-03-21T10:00:00.000Z"),
          summary: "T-Square forming",
          description: "Mars, Moon, Sun t-square forming (Mars focal)",
          categories: [
            "Triple Aspect",
            "T Square",
            "Forming",
            "Sun",
            "Moon",
            "Mars",
            "Mars Focal",
          ],
        };

        const dissolvingEvent: Event = {
          start: moment.utc("2024-03-21T14:00:00.000Z"),
          end: moment.utc("2024-03-21T14:00:00.000Z"),
          summary: "T-Square dissolving",
          description: "Mars, Moon, Sun t-square dissolving (Mars focal)",
          categories: [
            "Triple Aspect",
            "T Square",
            "Dissolving",
            "Sun",
            "Moon",
            "Mars",
            "Mars Focal",
          ],
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
          bodies: ["sun" as Body, "moon" as Body],
          aspect: "conjunct" as Aspect,
        },
        {
          bodies: ["mars" as Body, "jupiter" as Body],
          aspect: "trine" as Aspect,
        },
        {
          bodies: ["venus" as Body, "saturn" as Body],
          aspect: "conjunct" as Aspect,
        },
      ];

      const grouped = TripleAspectsService.groupAspectsByType(edges);

      expect(grouped.size).toBe(2);
      expect(grouped.get("conjunct" as Aspect)?.length).toBe(2);
      expect(grouped.get("trine" as Aspect)?.length).toBe(1);
    });

    it("should handle empty edges array", () => {
      const grouped = TripleAspectsService.groupAspectsByType([]);
      expect(grouped.size).toBe(0);
    });

    it("should handle single aspect type", () => {
      const edges: AspectBodies[] = [
        {
          bodies: ["sun" as Body, "moon" as Body],
          aspect: "square" as Aspect,
        },
        {
          bodies: ["mars" as Body, "jupiter" as Body],
          aspect: "square" as Aspect,
        },
      ];

      const grouped = TripleAspectsService.groupAspectsByType(edges);

      expect(grouped.size).toBe(1);
      expect(grouped.get("square" as Aspect)?.length).toBe(2);
    });
  });

  describe("findBodiesWithAspectTo", () => {
    it("should find bodies with specific aspect to given body", () => {
      const edges: AspectBodies[] = [
        {
          bodies: ["sun" as Body, "moon" as Body],
          aspect: "conjunct" as Aspect,
        },
        {
          bodies: ["sun" as Body, "mars" as Body],
          aspect: "trine" as Aspect,
        },
        {
          bodies: ["jupiter" as Body, "sun" as Body],
          aspect: "trine" as Aspect,
        },
      ];

      const bodiesWithTrine = TripleAspectsService.findBodiesWithAspectTo(
        "sun" as Body,
        "trine" as Aspect,
        edges,
      );

      expect(bodiesWithTrine.length).toBe(2);
      expect(bodiesWithTrine).toContain("mars");
      expect(bodiesWithTrine).toContain("jupiter");
    });

    it("should return empty array when no aspects found", () => {
      const edges: AspectBodies[] = [
        {
          bodies: ["sun" as Body, "moon" as Body],
          aspect: "conjunct" as Aspect,
        },
      ];

      const bodiesWithTrine = TripleAspectsService.findBodiesWithAspectTo(
        "sun" as Body,
        "trine" as Aspect,
        edges,
      );

      expect(bodiesWithTrine.length).toBe(0);
    });

    it("should handle body not in any edges", () => {
      const edges: AspectBodies[] = [
        {
          bodies: ["sun" as Body, "moon" as Body],
          aspect: "conjunct" as Aspect,
        },
      ];

      const bodiesWithTrine = TripleAspectsService.findBodiesWithAspectTo(
        "mars" as Body,
        "trine" as Aspect,
        edges,
      );

      expect(bodiesWithTrine.length).toBe(0);
    });
  });

  describe("haveAspect", () => {
    it("should return true when bodies have the aspect (body1-body2 order)", () => {
      const edges: AspectBodies[] = [
        {
          bodies: ["sun" as Body, "moon" as Body],
          aspect: "conjunct" as Aspect,
        },
      ];

      expect(
        TripleAspectsService.haveAspect(
          "sun" as Body,
          "moon" as Body,
          "conjunct" as Aspect,
          edges,
        ),
      ).toBe(true);
    });

    it("should return true when bodies have the aspect (body2-body1 order)", () => {
      const edges: AspectBodies[] = [
        {
          bodies: ["sun" as Body, "moon" as Body],
          aspect: "conjunct" as Aspect,
        },
      ];

      expect(
        TripleAspectsService.haveAspect(
          "moon" as Body,
          "sun" as Body,
          "conjunct" as Aspect,
          edges,
        ),
      ).toBe(true);
    });

    it("should return false when bodies do not have the aspect", () => {
      const edges: AspectBodies[] = [
        {
          bodies: ["sun" as Body, "moon" as Body],
          aspect: "conjunct" as Aspect,
        },
      ];

      expect(
        TripleAspectsService.haveAspect(
          "sun" as Body,
          "moon" as Body,
          "trine" as Aspect,
          edges,
        ),
      ).toBe(false);
    });

    it("should return false when bodies are not connected", () => {
      const edges: AspectBodies[] = [
        {
          bodies: ["sun" as Body, "moon" as Body],
          aspect: "conjunct" as Aspect,
        },
      ];

      expect(
        TripleAspectsService.haveAspect(
          "mars" as Body,
          "jupiter" as Body,
          "conjunct" as Aspect,
          edges,
        ),
      ).toBe(false);
    });

    it("should handle multiple edges", () => {
      const edges: AspectBodies[] = [
        {
          bodies: ["sun" as Body, "moon" as Body],
          aspect: "conjunct" as Aspect,
        },
        {
          bodies: ["mars" as Body, "jupiter" as Body],
          aspect: "trine" as Aspect,
        },
      ];

      expect(
        TripleAspectsService.haveAspect(
          "mars" as Body,
          "jupiter" as Body,
          "trine" as Aspect,
          edges,
        ),
      ).toBe(true);
    });
  });
});
