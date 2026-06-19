import { MathService } from "@caelundas/src/modules/math/math.service";
import { QuintupleAspectsComposerService } from "@caelundas/src/modules/quintuple-aspects/quintuple-aspects-composer.service";
import { Test } from "@nestjs/testing";
import _ from "lodash";
import moment from "moment-timezone";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { QuintupleAspectsService } from "./quintuple-aspects.service";

import type { AspectBodies } from "@caelundas/src/modules/aspects/aspects.service";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";

describe("QuintupleAspectsService", () => {
  let service: QuintupleAspectsService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [QuintupleAspectsService, QuintupleAspectsComposerService, MathService],
    }).compile();
    service = await module.resolve(QuintupleAspectsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("service.detect", () => {
    describe("Pentagram composition", () => {
      it("should not generate perfective Pentagram events (only forming/dissolving)", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        // Pentagram: 5 bodies in star pattern spanning multiple hours
        // Connections: 0-2 (Sun-Mars), 1-3 (Moon-Jupiter), 2-4 (Mars-Venus), 3-0 (Jupiter-Sun), 4-1 (Venus-Moon)
        // No events generated because pattern exists in prev/current/next minutes
        const currentAspectBodies: AspectBodies[] = [
          { aspect: "quintile", bodies: ["sun", "mars"] },
          { aspect: "quintile", bodies: ["moon", "jupiter"] },
          { aspect: "quintile", bodies: ["mars", "venus"] },
          { aspect: "quintile", bodies: ["jupiter", "sun"] },
          { aspect: "quintile", bodies: ["venus", "moon"] },
        ];
        const previousAspectBodies: AspectBodies[] = [
          { aspect: "quintile", bodies: ["sun", "mars"] },
          { aspect: "quintile", bodies: ["moon", "jupiter"] },
          { aspect: "quintile", bodies: ["mars", "venus"] },
          { aspect: "quintile", bodies: ["jupiter", "sun"] },
          { aspect: "quintile", bodies: ["venus", "moon"] },
        ];

        const events = service.detect({
          currentAspectBodies,
          minute: currentMinute,
          previousAspectBodies,
        });

        // No events - pattern exists in prev/current/next minutes
        expect(events.length).toBe(0);
      });

      it("should detect forming Pentagram for events spanning an hour", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        // Pentagram forming (starts at current minute but ends an hour later)
        // Should detect forming event since pattern exists at current but not previous minute
        const currentAspectBodies: AspectBodies[] = [
          { aspect: "quintile", bodies: ["sun", "mars"] },
          { aspect: "quintile", bodies: ["moon", "jupiter"] },
          { aspect: "quintile", bodies: ["mars", "venus"] },
          { aspect: "quintile", bodies: ["jupiter", "sun"] },
          { aspect: "quintile", bodies: ["venus", "moon"] },
        ];
        const previousAspectBodies: AspectBodies[] = [];

        const events = service.detect({
          currentAspectBodies,
          minute: currentMinute,
          previousAspectBodies,
        });

        // Should detect forming event - pattern exists at current but not previous minute
        expect(events.length).toBe(1);
        expect(events[0]?.description).toContain("pentagram forming");
      });

      it("should detect dissolving Pentagram for events ending at current minute", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        // Pentagram dissolving (ends at current minute)
        // Should detect dissolving event since pattern exists at current but not next minute
        const currentAspectBodies: AspectBodies[] = [];
        const previousAspectBodies: AspectBodies[] = [
          { aspect: "quintile", bodies: ["sun", "mars"] },
          { aspect: "quintile", bodies: ["moon", "jupiter"] },
          { aspect: "quintile", bodies: ["mars", "venus"] },
          { aspect: "quintile", bodies: ["jupiter", "sun"] },
          { aspect: "quintile", bodies: ["venus", "moon"] },
        ];

        const events = service.detect({
          currentAspectBodies,
          minute: currentMinute,
          previousAspectBodies,
        });

        // Should detect dissolving event - pattern exists at current but not next minute
        expect(events.length).toBe(1);
        expect(events[0]?.description).toContain("pentagram dissolving");
      });

      it("should not detect Pentagram with incomplete quintiles", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        // Missing some quintiles - incomplete Pentagram
        const currentAspectBodies: AspectBodies[] = [
          { aspect: "quintile", bodies: ["sun", "mars"] },
          { aspect: "quintile", bodies: ["moon", "jupiter"] },
          { aspect: "quintile", bodies: ["mars", "venus"] },
        ];
        const previousAspectBodies: AspectBodies[] = [];

        const events = service.detect({
          currentAspectBodies,
          minute: currentMinute,
          previousAspectBodies,
        });

        const pentagram = events.find((e) => e.categories.includes("Pentagram"));
        expect(pentagram).toBeUndefined();
      });

      it("should not detect Pentagram with fewer than 5 bodies", () => {
        const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
        // Only 4 bodies
        const currentAspectBodies: AspectBodies[] = [
          { aspect: "quintile", bodies: ["sun", "mars"] },
          { aspect: "quintile", bodies: ["moon", "jupiter"] },
        ];
        const previousAspectBodies: AspectBodies[] = [];

        const events = service.detect({
          currentAspectBodies,
          minute: currentMinute,
          previousAspectBodies,
        });

        const pentagram = events.find((e) => e.categories.includes("Pentagram"));
        expect(pentagram).toBeUndefined();
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

      // Aspects that ended before current time - edge in NEITHER array
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
      // Pentagram pattern but spans multiple hours
      const currentAspectBodies: AspectBodies[] = [
        { aspect: "quintile", bodies: ["sun", "mars"] },
        { aspect: "quintile", bodies: ["moon", "jupiter"] },
        { aspect: "quintile", bodies: ["mars", "venus"] },
        { aspect: "quintile", bodies: ["jupiter", "sun"] },
        { aspect: "quintile", bodies: ["venus", "moon"] },
      ];
      const previousAspectBodies: AspectBodies[] = [
        { aspect: "quintile", bodies: ["sun", "mars"] },
        { aspect: "quintile", bodies: ["moon", "jupiter"] },
        { aspect: "quintile", bodies: ["mars", "venus"] },
        { aspect: "quintile", bodies: ["jupiter", "sun"] },
        { aspect: "quintile", bodies: ["venus", "moon"] },
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
          "Quintuple Aspect",
          "Pentagram",
          "Forming",
          "Sun",
          "Moon",
          "Mars",
          "Jupiter",
          "Venus",
        ],
        description: "Jupiter, Mars, Moon, Sun, Venus pentagram forming",
        end: moment.utc("2024-03-21T10:00:00.000Z"),
        start: moment.utc("2024-03-21T10:00:00.000Z"),
        summary: "Pentagram forming",
      };

      const dissolvingEvent: Event = {
        categories: [
          "Astronomy",
          "Astrology",
          "Compound Aspect",
          "Quintuple Aspect",
          "Pentagram",
          "Dissolving",
          "Sun",
          "Moon",
          "Mars",
          "Jupiter",
          "Venus",
        ],
        description: "Jupiter, Mars, Moon, Sun, Venus pentagram dissolving",
        end: moment.utc("2024-03-21T14:00:00.000Z"),
        start: moment.utc("2024-03-21T14:00:00.000Z"),
        summary: "Pentagram dissolving",
      };

      const progressiveEvents = service.detectProgressive([formingEvent, dissolvingEvent]);

      expect(progressiveEvents.length).toBe(1);
      expect(progressiveEvents[0]?.start).toEqual(formingEvent.start);
      expect(progressiveEvents[0]?.end).toEqual(dissolvingEvent.start);
      expect(progressiveEvents[0]?.description).toContain("pentagram");
      expect(progressiveEvents[0]?.categories).toContain("Quintuple Aspect");
    });

    it("should handle multiple body quintets", () => {
      const quintet1Forming: Event = {
        categories: [
          "Quintuple Aspect",
          "Pentagram",
          "Forming",
          "Sun",
          "Moon",
          "Mars",
          "Jupiter",
          "Venus",
        ],
        description: "Sun, Moon, Mars, Jupiter, Venus pentagram forming",
        end: moment.utc("2024-03-21T10:00:00.000Z"),
        start: moment.utc("2024-03-21T10:00:00.000Z"),
        summary: "Pentagram forming",
      };

      const quintet1Dissolving: Event = {
        categories: [
          "Quintuple Aspect",
          "Pentagram",
          "Dissolving",
          "Sun",
          "Moon",
          "Mars",
          "Jupiter",
          "Venus",
        ],
        description: "Sun, Moon, Mars, Jupiter, Venus pentagram dissolving",
        end: moment.utc("2024-03-21T14:00:00.000Z"),
        start: moment.utc("2024-03-21T14:00:00.000Z"),
        summary: "Pentagram dissolving",
      };

      const quintet2Forming: Event = {
        categories: [
          "Quintuple Aspect",
          "Pentagram",
          "Forming",
          "Mercury",
          "Saturn",
          "Uranus",
          "Neptune",
          "Pluto",
        ],
        description: "Mercury, Saturn, Uranus, Neptune, Pluto pentagram forming",
        end: moment.utc("2024-03-21T11:00:00.000Z"),
        start: moment.utc("2024-03-21T11:00:00.000Z"),
        summary: "Pentagram forming",
      };

      const quintet2Dissolving: Event = {
        categories: [
          "Quintuple Aspect",
          "Pentagram",
          "Dissolving",
          "Mercury",
          "Saturn",
          "Uranus",
          "Neptune",
          "Pluto",
        ],
        description: "Mercury, Saturn, Uranus, Neptune, Pluto pentagram dissolving",
        end: moment.utc("2024-03-21T15:00:00.000Z"),
        start: moment.utc("2024-03-21T15:00:00.000Z"),
        summary: "Pentagram dissolving",
      };

      const progressiveEvents = service.detectProgressive([
        quintet1Forming,
        quintet1Dissolving,
        quintet2Forming,
        quintet2Dissolving,
      ]);

      expect(progressiveEvents.length).toBe(2);
      expect(
        progressiveEvents.find(
          (e) =>
            e.description.includes("Sun") &&
            e.description.includes("Moon") &&
            e.description.includes("Mars") &&
            e.description.includes("Jupiter") &&
            e.description.includes("Venus"),
        ),
      ).toBeDefined();
      expect(
        progressiveEvents.find(
          (e) =>
            e.description.includes("Mercury") &&
            e.description.includes("Saturn") &&
            e.description.includes("Uranus") &&
            e.description.includes("Neptune") &&
            e.description.includes("Pluto"),
        ),
      ).toBeDefined();
    });

    it("should filter out non-quintuple-aspect events", () => {
      const quintupleAspectEvent: Event = {
        categories: [
          "Quintuple Aspect",
          "Pentagram",
          "Forming",
          "Sun",
          "Moon",
          "Mars",
          "Jupiter",
          "Venus",
        ],
        description: "Sun, Moon, Mars, Jupiter, Venus pentagram forming",
        end: moment.utc("2024-03-21T10:00:00.000Z"),
        start: moment.utc("2024-03-21T10:00:00.000Z"),
        summary: "Pentagram forming",
      };

      const nonQuintupleAspectEvent: Event = {
        categories: ["Other"],
        description: "Not a quintuple aspect",
        end: moment.utc("2024-03-21T10:00:00.000Z"),
        start: moment.utc("2024-03-21T10:00:00.000Z"),
        summary: "Some other event",
      };

      const progressiveEvents = service.detectProgressive([
        quintupleAspectEvent,
        nonQuintupleAspectEvent,
      ]);

      expect(progressiveEvents.every((e) => e.categories.includes("Quintuple Aspect"))).toBe(true);
    });

    it("should handle empty events array", () => {
      const progressiveEvents = service.detectProgressive([]);
      expect(progressiveEvents.length).toBe(0);
    });

    it("should skip undefined candidate events in grouped progressive pairing", () => {
      const formingEvent: Event = {
        categories: [
          "Quintuple Aspect",
          "Pentagram",
          "Forming",
          "Sun",
          "Moon",
          "Mars",
          "Jupiter",
          "Venus",
        ],
        description: "Sun, Moon, Mars, Jupiter, Venus pentagram forming",
        end: moment.utc("2024-03-21T10:00:00.000Z"),
        start: moment.utc("2024-03-21T10:00:00.000Z"),
        summary: "Pentagram forming",
      };
      const dissolvingEvent: Event = {
        categories: [
          "Quintuple Aspect",
          "Pentagram",
          "Dissolving",
          "Sun",
          "Moon",
          "Mars",
          "Jupiter",
          "Venus",
        ],
        description: "Sun, Moon, Mars, Jupiter, Venus pentagram dissolving",
        end: moment.utc("2024-03-21T14:00:00.000Z"),
        start: moment.utc("2024-03-21T14:00:00.000Z"),
        summary: "Pentagram dissolving",
      };

      const composer = (
        service as unknown as {
          quintupleAspectsComposerService: QuintupleAspectsComposerService;
        }
      ).quintupleAspectsComposerService;
      const sortBySpy = vi
        .spyOn(_, "sortBy")
        .mockReturnValue([formingEvent, undefined, dissolvingEvent] as unknown as Event[]);
      const groupSpy = vi.spyOn(composer, "groupQuintupleEventsByKey").mockReturnValue({
        key: [formingEvent, undefined, dissolvingEvent] as unknown as Event[],
      });
      const progressiveBuilderSpy = vi
        .spyOn(composer, "buildProgressiveQuintupleEvent")
        .mockReturnValue({
          categories: ["Quintuple Aspect", "Pentagram"],
          description: "Pentagram duration",
          end: dissolvingEvent.start,
          start: formingEvent.start,
          summary: "Pentagram duration",
        });

      const progressiveEvents = service.detectProgressive([formingEvent, dissolvingEvent]);

      expect(progressiveEvents).toHaveLength(1);
      expect(progressiveBuilderSpy).toHaveBeenCalledWith(formingEvent, dissolvingEvent);

      sortBySpy.mockRestore();
      groupSpy.mockRestore();
      progressiveBuilderSpy.mockRestore();
    });

    it("should skip progressive when dissolving comes before forming", () => {
      const dissolvingEvent: Event = {
        categories: [
          "Quintuple Aspect",
          "Pentagram",
          "Dissolving",
          "Sun",
          "Moon",
          "Mars",
          "Jupiter",
          "Venus",
        ],
        description: "Sun, Moon, Mars, Jupiter, Venus pentagram dissolving",
        end: moment.utc("2024-03-21T10:00:00.000Z"),
        start: moment.utc("2024-03-21T10:00:00.000Z"),
        summary: "Pentagram dissolving",
      };

      const formingEvent: Event = {
        categories: [
          "Quintuple Aspect",
          "Pentagram",
          "Forming",
          "Sun",
          "Moon",
          "Mars",
          "Jupiter",
          "Venus",
        ],
        description: "Sun, Moon, Mars, Jupiter, Venus pentagram forming",
        end: moment.utc("2024-03-21T14:00:00.000Z"),
        start: moment.utc("2024-03-21T14:00:00.000Z"),
        summary: "Pentagram forming",
      };

      const progressiveEvents = service.detectProgressive([dissolvingEvent, formingEvent]);

      expect(progressiveEvents.length).toBe(0);
    });

    it("should ignore non-dissolving follow-up events in progressive pairing", () => {
      const formingEvent: Event = {
        categories: [
          "Quintuple Aspect",
          "Pentagram",
          "Forming",
          "Sun",
          "Moon",
          "Mars",
          "Jupiter",
          "Venus",
        ],
        description: "Sun, Moon, Mars, Jupiter, Venus pentagram forming",
        end: moment.utc("2024-03-21T10:00:00.000Z"),
        start: moment.utc("2024-03-21T10:00:00.000Z"),
        summary: "Pentagram forming",
      };
      const nonDissolvingEvent: Event = {
        categories: [
          "Quintuple Aspect",
          "Pentagram",
          "Perfective",
          "Sun",
          "Moon",
          "Mars",
          "Jupiter",
          "Venus",
        ],
        description: "Sun, Moon, Mars, Jupiter, Venus pentagram exact",
        end: moment.utc("2024-03-21T14:00:00.000Z"),
        start: moment.utc("2024-03-21T14:00:00.000Z"),
        summary: "Pentagram exact",
      };

      const progressiveEvents = service.detectProgressive([formingEvent, nonDissolvingEvent]);

      expect(progressiveEvents).toHaveLength(0);
    });

    it("should remove phase emojis from summary", () => {
      const formingEvent: Event = {
        categories: [
          "Quintuple Aspect",
          "Pentagram",
          "Forming",
          "Sun",
          "Moon",
          "Mars",
          "Jupiter",
          "Venus",
        ],
        description: "Jupiter, Mars, Moon, Sun, Venus pentagram forming",
        end: moment.utc("2024-03-21T10:00:00.000Z"),
        start: moment.utc("2024-03-21T10:00:00.000Z"),
        summary: "➡️ Pentagram forming",
      };

      const dissolvingEvent: Event = {
        categories: [
          "Quintuple Aspect",
          "Pentagram",
          "Dissolving",
          "Sun",
          "Moon",
          "Mars",
          "Jupiter",
          "Venus",
        ],
        description: "Jupiter, Mars, Moon, Sun, Venus pentagram dissolving",
        end: moment.utc("2024-03-21T14:00:00.000Z"),
        start: moment.utc("2024-03-21T14:00:00.000Z"),
        summary: "⬅️ Pentagram dissolving",
      };

      const progressiveEvents = service.detectProgressive([formingEvent, dissolvingEvent]);

      expect(progressiveEvents.length).toBe(1);
      expect(progressiveEvents[0]?.summary).toBe("Pentagram forming");
    });

    it("should remove phase text from description", () => {
      const formingEvent: Event = {
        categories: [
          "Quintuple Aspect",
          "Pentagram",
          "Forming",
          "Sun",
          "Moon",
          "Mars",
          "Jupiter",
          "Venus",
        ],
        description: "Jupiter, Mars, Moon, Sun, Venus pentagram forming",
        end: moment.utc("2024-03-21T10:00:00.000Z"),
        start: moment.utc("2024-03-21T10:00:00.000Z"),
        summary: "Pentagram forming",
      };

      const dissolvingEvent: Event = {
        categories: [
          "Quintuple Aspect",
          "Pentagram",
          "Dissolving",
          "Sun",
          "Moon",
          "Mars",
          "Jupiter",
          "Venus",
        ],
        description: "Jupiter, Mars, Moon, Sun, Venus pentagram dissolving",
        end: moment.utc("2024-03-21T14:00:00.000Z"),
        start: moment.utc("2024-03-21T14:00:00.000Z"),
        summary: "Pentagram dissolving",
      };

      const progressiveEvents = service.detectProgressive([formingEvent, dissolvingEvent]);

      expect(progressiveEvents.length).toBe(1);
      expect(progressiveEvents[0]?.description).not.toMatch(/(forming|dissolving|exact)$/i);
      expect(progressiveEvents[0]?.description).toContain("pentagram");
    });
  });

  describe("composer guard branches", () => {
    const getComposer = (): QuintupleAspectsComposerService =>
      (
        service as unknown as {
          quintupleAspectsComposerService: QuintupleAspectsComposerService;
        }
      ).quintupleAspectsComposerService;

    it("returns null when pentagram event receives fewer than five bodies", () => {
      expect(
        getComposer().buildPentagramEvent(
          ["sun", "moon", "mars", "jupiter"],
          "forming",
          moment.utc("2024-03-21T12:00:00.000Z"),
        ),
      ).toBeNull();
    });

    it("returns null when pentagram traversal cannot produce an ordered path", () => {
      const traverseSpy = vi
        .spyOn(getComposer(), "traversePentagramPath")
        .mockReturnValue(null);

      const pattern = getComposer().findPentagramPattern(
        ["sun", "moon", "mars", "jupiter", "venus"],
        [
          { aspect: "quintile", bodies: ["sun", "moon"] },
          { aspect: "quintile", bodies: ["moon", "mars"] },
          { aspect: "quintile", bodies: ["mars", "jupiter"] },
          { aspect: "quintile", bodies: ["jupiter", "venus"] },
          { aspect: "quintile", bodies: ["venus", "sun"] },
        ],
      );

      expect(pattern).toBeNull();
      traverseSpy.mockRestore();
    });

    it("returns null when ordered pentagram has unexpected quintile pair count", () => {
      const countSpy = vi.spyOn(getComposer(), "countUniqueQuintilePairs").mockReturnValue(4);

      const pattern = getComposer().findPentagramPattern(
        ["sun", "moon", "mars", "jupiter", "venus"],
        [
          { aspect: "quintile", bodies: ["sun", "moon"] },
          { aspect: "quintile", bodies: ["moon", "mars"] },
          { aspect: "quintile", bodies: ["mars", "jupiter"] },
          { aspect: "quintile", bodies: ["jupiter", "venus"] },
          { aspect: "quintile", bodies: ["venus", "sun"] },
        ],
      );

      expect(pattern).toBeNull();
      countSpy.mockRestore();
    });

    it("returns perfective phase emoji in composer helper", () => {
      expect(getComposer().getPhaseEmoji("perfective")).toBe("🎯 ");
    });

    it("returns no pentagrams when fewer than five unique bodies are present", () => {
      const events = getComposer().composePentagrams({
        currentAspectBodies: [
          { aspect: "quintile", bodies: ["sun", "moon"] },
          { aspect: "quintile", bodies: ["sun", "mars"] },
          { aspect: "quintile", bodies: ["moon", "mars"] },
          { aspect: "quintile", bodies: ["sun", "venus"] },
          { aspect: "quintile", bodies: ["moon", "venus"] },
        ],
        minute: moment.utc("2024-03-21T12:00:00.000Z"),
        previousAspectBodies: [],
      });

      expect(events).toEqual([]);
    });

    it("skips null pentagram events when a phase transition has no materialized boundary event", () => {
      const findPatternSpy = vi
        .spyOn(getComposer(), "findPentagramPattern")
        .mockReturnValue(["sun", "moon", "mars", "jupiter", "venus"]);
      const determinePhaseSpy = vi
        .spyOn(getComposer(), "determineCompoundPhaseFromSnapshots")
        .mockReturnValue({
          eventMinute: moment.utc("2024-03-21T12:00:00.000Z"),
          phase: "forming",
        });
      const buildEventSpy = vi.spyOn(getComposer(), "buildPentagramEvent").mockReturnValue(null);

      const events = getComposer().processPentagramCombinations({
        combinations: [["sun", "moon", "mars", "jupiter", "venus"]],
        currentAspectBodies: [],
        minute: moment.utc("2024-03-21T12:00:00.000Z"),
        previousAspectBodies: [],
        unionEdges: [],
      });

      expect(events).toEqual([]);

      findPatternSpy.mockRestore();
      determinePhaseSpy.mockRestore();
      buildEventSpy.mockRestore();
    });

    it("returns null when pentagram traversal cannot find a new unvisited node", () => {
      const traversal = getComposer().traversePentagramPath(
        new Map([
          ["sun", new Set(["moon"])],
          ["moon", new Set(["sun"])],
        ]) as unknown as Map<string, Set<string>>,
        ["sun", "moon", "mars", "jupiter", "venus"] as unknown as string[],
      );

      expect(traversal).toBeNull();
    });

    it("returns null when pentagram traversal does not close back to start", () => {
      const traversal = getComposer().traversePentagramPath(
        new Map([
          ["sun", new Set(["moon", "venus"])],
          ["moon", new Set(["sun", "mars"])],
          ["mars", new Set(["moon", "jupiter"])],
          ["jupiter", new Set(["mars", "venus"])],
          ["venus", new Set(["jupiter"])],
        ]) as unknown as Map<string, Set<string>>,
        ["sun", "moon", "mars", "jupiter", "venus"] as unknown as string[],
      );

      expect(traversal).toBeNull();
    });
  });
});
