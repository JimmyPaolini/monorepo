import moment from "moment-timezone";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MinorAspectsComposerService } from "./minor-aspects-composer.service";

describe("MinorAspectsComposerService", () => {
  const mockLogger = {
    error: vi.fn(),
    log: vi.fn(),
    setContext: vi.fn(),
  };
  const mockEphemerisService = {
    getLongitudesWindow: vi.fn().mockReturnValue({
      current: 10,
      next: 11,
      previous: 9,
    }),
  };
  const mockProgressiveUtilitiesService = {
    pairProgressiveEvents: vi.fn(),
  };

  const service = new MinorAspectsComposerService(
    mockLogger as never,
    mockEphemerisService as never,
    mockProgressiveUtilitiesService as never,
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("assembles boundary events for every phase", () => {
    const timestamp = moment.utc("2024-03-21T12:00:00.000Z");

    expect(
      service.assembleMinorAspectEvent({
        body1: "sun",
        body2: "moon",
        minorAspect: "semisextile",
        phase: "perfective",
        timestamp,
      }),
    ).toEqual(
      expect.objectContaining({
        categories: expect.arrayContaining(["Perfective", "Minor Aspect"]),
        description: "Sun perfective semisextile Moon",
        summary: "🎯 ☀️ ⚺ 🌙 Sun perfective semisextile Moon",
      }),
    );

    expect(
      service.assembleMinorAspectEvent({
        body1: "sun",
        body2: "moon",
        minorAspect: "semisextile",
        phase: "forming",
        timestamp,
      }),
    ).toEqual(
      expect.objectContaining({
        categories: expect.arrayContaining(["Forming"]),
        description: "Sun forming semisextile Moon",
        summary: "➡️ ☀️ ⚺ 🌙 Sun forming semisextile Moon",
      }),
    );

    expect(
      service.assembleMinorAspectEvent({
        body1: "sun",
        body2: "moon",
        minorAspect: "semisextile",
        phase: "dissolving",
        timestamp,
      }),
    ).toEqual(
      expect.objectContaining({
        categories: expect.arrayContaining(["Dissolving"]),
        description: "Sun dissolving semisextile Moon",
        summary: "⬅️ ☀️ ⚺ 🌙 Sun dissolving semisextile Moon",
      }),
    );
  });

  it("extracts and casts aspect components", () => {
    expect(
      service.extractAspectComponents([
        "Astronomy",
        "Astrology",
        "Simple Aspect",
        "Minor Aspect",
        "Moon",
        "Sun",
        "Semisextile",
      ]),
    ).toEqual({
      aspect: "semisextile",
      aspectCapitalized: "Semisextile",
      body1: "moon",
      body1Capitalized: "Moon",
      body2: "sun",
      body2Capitalized: "Sun",
    });

    expect(
      service.castAspectComponentsToTypes({
        aspectCapitalized: "Semisextile",
        body1Capitalized: "Moon",
        body2Capitalized: "Sun",
        categories: ["Semisextile", "Moon", "Sun"],
      }),
    ).toEqual({
      aspect: "semisextile",
      body1: "moon",
      body2: "sun",
    });
  });

  it("builds progressive events and grouping keys", () => {
    const minute = moment.utc("2024-03-21T12:00:00.000Z");
    const beginning = {
      categories: [
        "Astronomy",
        "Astrology",
        "Simple Aspect",
        "Minor Aspect",
        "Moon",
        "Sun",
        "Semisextile",
        "Forming",
      ],
      description: "Sun forming semisextile Moon",
      end: minute,
      start: minute,
      summary: "➡️ ☀️ ⚺ 🌙 Sun forming semisextile Moon",
    };
    const ending = {
      ...beginning,
      categories: beginning.categories.map((category) =>
        category === "Forming" ? "Dissolving" : category,
      ),
      description: "Sun dissolving semisextile Moon",
      summary: "⬅️ ☀️ ⚺ 🌙 Sun dissolving semisextile Moon",
      start: minute.clone().add(1, "hour"),
      end: minute.clone().add(1, "hour"),
    };

    mockProgressiveUtilitiesService.pairProgressiveEvents.mockReturnValue([
      [beginning, ending],
    ]);

    expect(service.buildGroupKey(beginning)).toBe(
      "Moon-Semisextile-Sun",
    );
    expect(service.buildGroupKey({ ...beginning, categories: ["Moon"] })).toBe(
      "",
    );

    expect(service.getMinorAspectProgressiveEvent(beginning, ending)).toEqual(
      expect.objectContaining({
        categories: expect.arrayContaining(["Minor Aspect", "Semisextile"]),
        description: "Moon semisextile Sun",
      }),
    );

    expect(
      service.processAspectGroup("Moon-Semisextile-Sun", [
        beginning,
        ending,
      ]),
    ).toHaveLength(1);
    expect(
      mockProgressiveUtilitiesService.pairProgressiveEvents,
    ).toHaveBeenCalledWith([beginning], [ending], "minor aspect Moon-Semisextile-Sun");
  });

  it("reads longitudes from ephemerides and rejects invalid input", () => {
    expect(
      service.getLongitudesWindowForBody({
        body: "sun",
        coordinateEphemerisByBody: { sun: {} as never },
        minute: moment.utc("2024-03-21T12:00:00.000Z"),
        nextMinute: moment.utc("2024-03-21T12:01:00.000Z"),
        previousMinute: moment.utc("2024-03-21T11:59:00.000Z"),
      }),
    ).toEqual({ current: 10, next: 11, previous: 9 });

    expect(() =>
      service.castAspectComponentsToTypes({
        aspectCapitalized: "Not An Aspect",
        body1Capitalized: "Moon",
        body2Capitalized: "Sun",
        categories: ["Moon", "Sun"],
      }),
    ).toThrow("Could not extract typed values");
  });
});
