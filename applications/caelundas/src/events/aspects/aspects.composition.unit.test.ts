import moment from "moment-timezone";
import { describe, expect, it, vi } from "vitest";

import {
  type AspectEdge,
  determineMultiBodyPhase,
  findBodiesWithAspectTo,
  getOtherBody,
  groupAspectsByType,
  haveAspect,
  involvesBody,
  parseAspectEvents,
} from "./aspects.composition";

import type { Event } from "../../calendar.utilities";
import type { Aspect, Body } from "../../types";

describe("aspects.composition", () => {
  describe("parseAspectEvents", () => {
    it("should parse valid simple aspect events", () => {
      const events: Event[] = [
        {
          start: new Date("2024-03-21T12:00:00.000Z"),
          end: new Date("2024-03-21T12:00:00.000Z"),
          summary: "Sun conjunct Moon",
          description: "Sun conjunct Moon",
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Major Aspect",
            "Sun",
            "Moon",
            "Conjunct",
            "exact",
          ],
        },
      ];

      const edges = parseAspectEvents(events);

      expect(edges.length).toBe(1);
      expect(edges[0].body1).toBe("sun");
      expect(edges[0].body2).toBe("moon");
      expect(edges[0].aspectType).toBe("conjunct");
      expect(edges[0].phase).toBe("exact");
      expect(edges[0].event).toBe(events[0]);
    });

    it("should parse multiple aspect events", () => {
      const events: Event[] = [
        {
          start: new Date("2024-03-21T12:00:00.000Z"),
          end: new Date("2024-03-21T12:00:00.000Z"),
          summary: "Sun conjunct Moon",
          description: "Sun conjunct Moon",
          categories: ["Simple Aspect", "Sun", "Moon", "Conjunct", "exact"],
        },
        {
          start: new Date("2024-03-21T12:00:00.000Z"),
          end: new Date("2024-03-21T12:00:00.000Z"),
          summary: "Mars trine Jupiter",
          description: "Mars trine Jupiter",
          categories: ["Simple Aspect", "Mars", "Jupiter", "Trine", "forming"],
        },
      ];

      const edges = parseAspectEvents(events);

      expect(edges.length).toBe(2);
      expect(edges[0].body1).toBe("sun");
      expect(edges[0].body2).toBe("moon");
      expect(edges[0].aspectType).toBe("conjunct");
      expect(edges[1].body1).toBe("mars");
      expect(edges[1].body2).toBe("jupiter");
      expect(edges[1].aspectType).toBe("trine");
    });

    it("should handle different phases", () => {
      const events: Event[] = [
        {
          start: new Date("2024-03-21T12:00:00.000Z"),
          end: new Date("2024-03-21T12:00:00.000Z"),
          summary: "Sun square Mars",
          description: "Sun square Mars",
          categories: ["Simple Aspect", "Sun", "Mars", "Square", "forming"],
        },
        {
          start: new Date("2024-03-21T12:00:00.000Z"),
          end: new Date("2024-03-21T12:00:00.000Z"),
          summary: "Moon opposite Venus",
          description: "Moon opposite Venus",
          categories: [
            "Simple Aspect",
            "Moon",
            "Venus",
            "Opposite",
            "dissolving",
          ],
        },
      ];

      const edges = parseAspectEvents(events);

      expect(edges.length).toBe(2);
      expect(edges[0].phase).toBe("forming");
      expect(edges[1].phase).toBe("dissolving");
    });

    it("should skip compound aspect events", () => {
      const events: Event[] = [
        {
          start: new Date("2024-03-21T12:00:00.000Z"),
          end: new Date("2024-03-21T12:00:00.000Z"),
          summary: "T-Square",
          description: "T-Square",
          categories: [
            "Compound Aspect",
            "Triple Aspect",
            "T-Square",
            "Sun",
            "Moon",
            "Mars",
          ],
        },
      ];

      const edges = parseAspectEvents(events);
      expect(edges.length).toBe(0);
    });

    it("should skip events without exactly 2 bodies", () => {
      const events: Event[] = [
        {
          start: new Date("2024-03-21T12:00:00.000Z"),
          end: new Date("2024-03-21T12:00:00.000Z"),
          summary: "Only one body",
          description: "Only one body",
          categories: ["Simple Aspect", "Sun", "Conjunct", "exact"],
        },
        {
          start: new Date("2024-03-21T12:00:00.000Z"),
          end: new Date("2024-03-21T12:00:00.000Z"),
          summary: "Three bodies",
          description: "Three bodies",
          categories: [
            "Simple Aspect",
            "Sun",
            "Moon",
            "Mars",
            "Conjunct",
            "exact",
          ],
        },
      ];

      const edges = parseAspectEvents(events);
      expect(edges.length).toBe(0);
    });

    it("should skip events without aspect type", () => {
      const events: Event[] = [
        {
          start: new Date("2024-03-21T12:00:00.000Z"),
          end: new Date("2024-03-21T12:00:00.000Z"),
          summary: "No aspect type",
          description: "No aspect type",
          categories: ["Simple Aspect", "Sun", "Moon", "exact"],
        },
      ];

      const edges = parseAspectEvents(events);
      expect(edges.length).toBe(0);
    });

    it("should skip events without phase", () => {
      const events: Event[] = [
        {
          start: new Date("2024-03-21T12:00:00.000Z"),
          end: new Date("2024-03-21T12:00:00.000Z"),
          summary: "No phase",
          description: "No phase",
          categories: ["Simple Aspect", "Sun", "Moon", "Conjunct"],
        },
      ];

      const edges = parseAspectEvents(events);
      expect(edges.length).toBe(0);
    });

    it("should handle empty events array", () => {
      const edges = parseAspectEvents([]);
      expect(edges.length).toBe(0);
    });

    it("should normalize categories to lowercase", () => {
      const events: Event[] = [
        {
          start: new Date("2024-03-21T12:00:00.000Z"),
          end: new Date("2024-03-21T12:00:00.000Z"),
          summary: "Sun conjunct Moon",
          description: "Sun conjunct Moon",
          categories: ["SIMPLE ASPECT", "SUN", "MOON", "CONJUNCT", "EXACT"],
        },
      ];

      const edges = parseAspectEvents(events);

      expect(edges.length).toBe(1);
      expect(edges[0].body1).toBe("sun");
      expect(edges[0].body2).toBe("moon");
      expect(edges[0].aspectType).toBe("conjunct");
      expect(edges[0].phase).toBe("exact");
    });

    it("should handle malformed events gracefully", () => {
      const events: Event[] = [
        {
          start: new Date("2024-03-21T12:00:00.000Z"),
          end: new Date("2024-03-21T12:00:00.000Z"),
          summary: "Malformed",
          description: "Malformed",
          categories: null as any,
        },
      ];

      const edges = parseAspectEvents(events);
      expect(edges.length).toBe(0);
    });

    it("should handle minor aspects", () => {
      const events: Event[] = [
        {
          start: new Date("2024-03-21T12:00:00.000Z"),
          end: new Date("2024-03-21T12:00:00.000Z"),
          summary: "Sun semisextile Moon",
          description: "Sun semisextile Moon",
          categories: [
            "Simple Aspect",
            "Minor Aspect",
            "Sun",
            "Moon",
            "Semisextile",
            "exact",
          ],
        },
      ];

      const edges = parseAspectEvents(events);

      expect(edges.length).toBe(1);
      expect(edges[0].aspectType).toBe("semisextile");
    });

    it("should handle specialty aspects", () => {
      const events: Event[] = [
        {
          start: new Date("2024-03-21T12:00:00.000Z"),
          end: new Date("2024-03-21T12:00:00.000Z"),
          summary: "Sun quintile Moon",
          description: "Sun quintile Moon",
          categories: [
            "Simple Aspect",
            "Specialty Aspect",
            "Sun",
            "Moon",
            "Quintile",
            "exact",
          ],
        },
      ];

      const edges = parseAspectEvents(events);

      expect(edges.length).toBe(1);
      expect(edges[0].aspectType).toBe("quintile");
    });
  });

  describe("groupAspectsByType", () => {
    it("should group edges by aspect type", () => {
      const edges: AspectEdge[] = [
        {
          body1: "sun" as Body,
          body2: "moon" as Body,
          aspectType: "conjunct" as Aspect,
          phase: "exact",
          event: {} as Event,
        },
        {
          body1: "mars" as Body,
          body2: "jupiter" as Body,
          aspectType: "trine" as Aspect,
          phase: "forming",
          event: {} as Event,
        },
        {
          body1: "venus" as Body,
          body2: "saturn" as Body,
          aspectType: "conjunct" as Aspect,
          phase: "dissolving",
          event: {} as Event,
        },
      ];

      const grouped = groupAspectsByType(edges);

      expect(grouped.size).toBe(2);
      expect(grouped.get("conjunct")?.length).toBe(2);
      expect(grouped.get("trine")?.length).toBe(1);
    });

    it("should handle empty edges array", () => {
      const grouped = groupAspectsByType([]);
      expect(grouped.size).toBe(0);
    });

    it("should handle single aspect type", () => {
      const edges: AspectEdge[] = [
        {
          body1: "sun" as Body,
          body2: "moon" as Body,
          aspectType: "square" as Aspect,
          phase: "exact",
          event: {} as Event,
        },
        {
          body1: "mars" as Body,
          body2: "jupiter" as Body,
          aspectType: "square" as Aspect,
          phase: "forming",
          event: {} as Event,
        },
      ];

      const grouped = groupAspectsByType(edges);

      expect(grouped.size).toBe(1);
      expect(grouped.get("square")?.length).toBe(2);
    });
  });

  describe("involvesBody", () => {
    it("should return true when body1 matches", () => {
      const edge: AspectEdge = {
        body1: "sun" as Body,
        body2: "moon" as Body,
        aspectType: "conjunct" as Aspect,
        phase: "exact",
        event: {} as Event,
      };

      expect(involvesBody(edge, "sun" as Body)).toBe(true);
    });

    it("should return true when body2 matches", () => {
      const edge: AspectEdge = {
        body1: "sun" as Body,
        body2: "moon" as Body,
        aspectType: "conjunct" as Aspect,
        phase: "exact",
        event: {} as Event,
      };

      expect(involvesBody(edge, "moon" as Body)).toBe(true);
    });

    it("should return false when neither body matches", () => {
      const edge: AspectEdge = {
        body1: "sun" as Body,
        body2: "moon" as Body,
        aspectType: "conjunct" as Aspect,
        phase: "exact",
        event: {} as Event,
      };

      expect(involvesBody(edge, "mars" as Body)).toBe(false);
    });
  });

  describe("getOtherBody", () => {
    it("should return body2 when body1 is provided", () => {
      const edge: AspectEdge = {
        body1: "sun" as Body,
        body2: "moon" as Body,
        aspectType: "conjunct" as Aspect,
        phase: "exact",
        event: {} as Event,
      };

      expect(getOtherBody(edge, "sun" as Body)).toBe("moon");
    });

    it("should return body1 when body2 is provided", () => {
      const edge: AspectEdge = {
        body1: "sun" as Body,
        body2: "moon" as Body,
        aspectType: "conjunct" as Aspect,
        phase: "exact",
        event: {} as Event,
      };

      expect(getOtherBody(edge, "moon" as Body)).toBe("sun");
    });

    it("should return null when body is not in edge", () => {
      const edge: AspectEdge = {
        body1: "sun" as Body,
        body2: "moon" as Body,
        aspectType: "conjunct" as Aspect,
        phase: "exact",
        event: {} as Event,
      };

      expect(getOtherBody(edge, "mars" as Body)).toBeNull();
    });
  });

  describe("findBodiesWithAspectTo", () => {
    it("should find bodies with specific aspect to given body", () => {
      const edges: AspectEdge[] = [
        {
          body1: "sun" as Body,
          body2: "moon" as Body,
          aspectType: "conjunct" as Aspect,
          phase: "exact",
          event: {} as Event,
        },
        {
          body1: "sun" as Body,
          body2: "mars" as Body,
          aspectType: "trine" as Aspect,
          phase: "forming",
          event: {} as Event,
        },
        {
          body1: "jupiter" as Body,
          body2: "sun" as Body,
          aspectType: "trine" as Aspect,
          phase: "exact",
          event: {} as Event,
        },
      ];

      const bodiesWithTrine = findBodiesWithAspectTo(
        "sun" as Body,
        "trine" as Aspect,
        edges
      );

      expect(bodiesWithTrine.length).toBe(2);
      expect(bodiesWithTrine).toContain("mars");
      expect(bodiesWithTrine).toContain("jupiter");
    });

    it("should return empty array when no aspects found", () => {
      const edges: AspectEdge[] = [
        {
          body1: "sun" as Body,
          body2: "moon" as Body,
          aspectType: "conjunct" as Aspect,
          phase: "exact",
          event: {} as Event,
        },
      ];

      const bodiesWithTrine = findBodiesWithAspectTo(
        "sun" as Body,
        "trine" as Aspect,
        edges
      );

      expect(bodiesWithTrine.length).toBe(0);
    });

    it("should handle body not in any edges", () => {
      const edges: AspectEdge[] = [
        {
          body1: "sun" as Body,
          body2: "moon" as Body,
          aspectType: "conjunct" as Aspect,
          phase: "exact",
          event: {} as Event,
        },
      ];

      const bodiesWithTrine = findBodiesWithAspectTo(
        "mars" as Body,
        "trine" as Aspect,
        edges
      );

      expect(bodiesWithTrine.length).toBe(0);
    });
  });

  describe("haveAspect", () => {
    it("should return true when bodies have the aspect (body1-body2 order)", () => {
      const edges: AspectEdge[] = [
        {
          body1: "sun" as Body,
          body2: "moon" as Body,
          aspectType: "conjunct" as Aspect,
          phase: "exact",
          event: {} as Event,
        },
      ];

      expect(
        haveAspect("sun" as Body, "moon" as Body, "conjunct" as Aspect, edges)
      ).toBe(true);
    });

    it("should return true when bodies have the aspect (body2-body1 order)", () => {
      const edges: AspectEdge[] = [
        {
          body1: "sun" as Body,
          body2: "moon" as Body,
          aspectType: "conjunct" as Aspect,
          phase: "exact",
          event: {} as Event,
        },
      ];

      expect(
        haveAspect("moon" as Body, "sun" as Body, "conjunct" as Aspect, edges)
      ).toBe(true);
    });

    it("should return false when bodies do not have the aspect", () => {
      const edges: AspectEdge[] = [
        {
          body1: "sun" as Body,
          body2: "moon" as Body,
          aspectType: "conjunct" as Aspect,
          phase: "exact",
          event: {} as Event,
        },
      ];

      expect(
        haveAspect("sun" as Body, "moon" as Body, "trine" as Aspect, edges)
      ).toBe(false);
    });

    it("should return false when bodies are not connected", () => {
      const edges: AspectEdge[] = [
        {
          body1: "sun" as Body,
          body2: "moon" as Body,
          aspectType: "conjunct" as Aspect,
          phase: "exact",
          event: {} as Event,
        },
      ];

      expect(
        haveAspect(
          "mars" as Body,
          "jupiter" as Body,
          "conjunct" as Aspect,
          edges
        )
      ).toBe(false);
    });

    it("should handle multiple edges", () => {
      const edges: AspectEdge[] = [
        {
          body1: "sun" as Body,
          body2: "moon" as Body,
          aspectType: "conjunct" as Aspect,
          phase: "exact",
          event: {} as Event,
        },
        {
          body1: "mars" as Body,
          body2: "jupiter" as Body,
          aspectType: "trine" as Aspect,
          phase: "forming",
          event: {} as Event,
        },
      ];

      expect(
        haveAspect("mars" as Body, "jupiter" as Body, "trine" as Aspect, edges)
      ).toBe(true);
    });
  });

  describe("determineMultiBodyPhase", () => {
    it("should return forming when pattern absent in previous but present in current", () => {
      const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");

      const edges: AspectEdge[] = [
        {
          body1: "sun" as Body,
          body2: "moon" as Body,
          aspectType: "conjunct" as Aspect,
          phase: "exact",
          event: {
            start: new Date("2024-03-21T12:00:00.000Z"),
            end: new Date("2024-03-21T13:00:00.000Z"),
          } as Event,
        },
      ];

      const phase = determineMultiBodyPhase(
        edges,
        currentMinute,
        ["sun" as Body, "moon" as Body],
        (edgesAtTime) => edgesAtTime.length > 0
      );

      expect(phase).toBe("forming");
    });

    it("should return dissolving when pattern present in current but absent in next", () => {
      const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");

      const edges: AspectEdge[] = [
        {
          body1: "sun" as Body,
          body2: "moon" as Body,
          aspectType: "conjunct" as Aspect,
          phase: "exact",
          event: {
            start: new Date("2024-03-21T11:00:00.000Z"),
            end: new Date("2024-03-21T12:00:00.000Z"),
          } as Event,
        },
      ];

      const phase = determineMultiBodyPhase(
        edges,
        currentMinute,
        ["sun" as Body, "moon" as Body],
        (edgesAtTime) => edgesAtTime.length > 0
      );

      expect(phase).toBe("dissolving");
    });

    it("should return null when pattern exists in all three time points", () => {
      const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");

      const edges: AspectEdge[] = [
        {
          body1: "sun" as Body,
          body2: "moon" as Body,
          aspectType: "conjunct" as Aspect,
          phase: "exact",
          event: {
            start: new Date("2024-03-21T11:00:00.000Z"),
            end: new Date("2024-03-21T13:00:00.000Z"),
          } as Event,
        },
      ];

      const phase = determineMultiBodyPhase(
        edges,
        currentMinute,
        ["sun" as Body, "moon" as Body],
        (edgesAtTime) => edgesAtTime.length > 0
      );

      expect(phase).toBeNull();
    });

    it("should return null when pattern not present in current minute", () => {
      const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");

      const edges: AspectEdge[] = [
        {
          body1: "sun" as Body,
          body2: "moon" as Body,
          aspectType: "conjunct" as Aspect,
          phase: "exact",
          event: {
            start: new Date("2024-03-21T10:00:00.000Z"),
            end: new Date("2024-03-21T11:00:00.000Z"),
          } as Event,
        },
      ];

      const phase = determineMultiBodyPhase(
        edges,
        currentMinute,
        ["sun" as Body, "moon" as Body],
        (edgesAtTime) => edgesAtTime.length > 0
      );

      expect(phase).toBeNull();
    });

    it("should filter edges by involved bodies", () => {
      const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");

      const edges: AspectEdge[] = [
        {
          body1: "sun" as Body,
          body2: "moon" as Body,
          aspectType: "conjunct" as Aspect,
          phase: "exact",
          event: {
            start: new Date("2024-03-21T12:00:00.000Z"),
            end: new Date("2024-03-21T13:00:00.000Z"),
          } as Event,
        },
        {
          body1: "mars" as Body,
          body2: "jupiter" as Body,
          aspectType: "trine" as Aspect,
          phase: "exact",
          event: {
            start: new Date("2024-03-21T12:00:00.000Z"),
            end: new Date("2024-03-21T13:00:00.000Z"),
          } as Event,
        },
      ];

      const phase = determineMultiBodyPhase(
        edges,
        currentMinute,
        ["sun" as Body, "moon" as Body],
        (edgesAtTime) => {
          // Should only see edges involving sun and moon
          const filtered = edgesAtTime.filter(
            (edge) =>
              (edge.body1 === "sun" || edge.body1 === "moon") &&
              (edge.body2 === "sun" || edge.body2 === "moon")
          );
          return filtered.length > 0;
        }
      );

      expect(phase).toBe("forming");
    });

    it("should handle complex pattern checking", () => {
      const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");

      const edges: AspectEdge[] = [
        {
          body1: "sun" as Body,
          body2: "moon" as Body,
          aspectType: "conjunct" as Aspect,
          phase: "exact",
          event: {
            start: new Date("2024-03-21T12:00:00.000Z"),
            end: new Date("2024-03-21T13:00:00.000Z"),
          } as Event,
        },
        {
          body1: "sun" as Body,
          body2: "mars" as Body,
          aspectType: "square" as Aspect,
          phase: "exact",
          event: {
            start: new Date("2024-03-21T12:00:00.000Z"),
            end: new Date("2024-03-21T13:00:00.000Z"),
          } as Event,
        },
      ];

      const phase = determineMultiBodyPhase(
        edges,
        currentMinute,
        ["sun" as Body, "moon" as Body, "mars" as Body],
        (edgesAtTime) => {
          // Complex pattern: need both conjunct and square
          const hasConjunct = edgesAtTime.some(
            (edge) => edge.aspectType === "conjunct"
          );
          const hasSquare = edgesAtTime.some(
            (edge) => edge.aspectType === "square"
          );
          return hasConjunct && hasSquare;
        }
      );

      expect(phase).toBe("forming");
    });

    it("should handle empty edges array", () => {
      const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");

      const phase = determineMultiBodyPhase(
        [],
        currentMinute,
        ["sun" as Body, "moon" as Body],
        (edgesAtTime) => edgesAtTime.length > 0
      );

      expect(phase).toBeNull();
    });
  });
});
