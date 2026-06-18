import moment from "moment-timezone";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SpecialtyAspectsComposerService } from "./specialty-aspects-composer.service";

describe("SpecialtyAspectsComposerService", () => {
  const mockLogger = {
    error: vi.fn(),
    log: vi.fn(),
    setContext: vi.fn(),
  };
  const mockEphemerisService = {
    getLongitudesWindow: vi.fn().mockReturnValue({
      current: 72,
      next: 73,
      previous: 71,
    }),
  };

  const service = new SpecialtyAspectsComposerService(
    mockLogger as never,
    mockEphemerisService as never,
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("assembles boundary events for every phase", () => {
    const timestamp = moment.utc("2024-03-21T12:00:00.000Z");

    expect(
      service.buildSpecialtyAspectEventFromParts({
        body1Symbol: "☀️",
        body2Symbol: "🌙",
        categories: ["Astronomy", "Astrology", "Specialty Aspect"],
        description: "Sun quintile Moon",
        phaseEmoji: "🎯",
        specialtyAspectSymbol: "⬠",
        timestamp,
      }),
    ).toEqual(
      expect.objectContaining({
        description: "Sun quintile Moon",
        summary: "🎯 ☀️ ⬠ 🌙 Sun quintile Moon",
      }),
    );

    expect(mockLogger.log).toHaveBeenCalledWith(
      "🎯 ☀️ ⬠ 🌙 Sun quintile Moon at 2024-03-21T12:00:00.000Z",
    );
  });

  it("extracts and casts aspect components", () => {
    expect(
      service.extractAspectBodiesFromCategories([
        "Astronomy",
        "Astrology",
        "Specialty Aspect",
        "Moon",
        "Sun",
        "Quintile",
      ]),
    ).toEqual({
      aspectCapitalized: "Quintile",
      body1Capitalized: "Moon",
      body2Capitalized: "Sun",
    });

    expect(
      service.extractTypedAspectValues({
        aspectCapitalized: "Quintile",
        body1Capitalized: "Moon",
        body2Capitalized: "Sun",
        categories: ["Quintile", "Moon", "Sun"],
      }),
    ).toEqual({
      aspect: "quintile",
      body1: "moon",
      body2: "sun",
    });
  });

  it("builds progressive events and group keys", () => {
    const minute = moment.utc("2024-03-21T12:00:00.000Z");
    const beginning = {
      categories: [
        "Astronomy",
        "Astrology",
        "Simple Aspect",
        "Specialty Aspect",
        "Moon",
        "Sun",
        "Quintile",
        "Forming",
      ],
      description: "Sun forming quintile Moon",
      end: minute,
      start: minute,
      summary: "➡️ ☀️⬠🌙 Sun forming quintile Moon",
    };
    const ending = {
      ...beginning,
      categories: beginning.categories.map((category) =>
        category === "Forming" ? "Dissolving" : category,
      ),
      description: "Sun dissolving quintile Moon",
      summary: "⬅️ ☀️⬠🌙 Sun dissolving quintile Moon",
      start: minute.clone().add(1, "hour"),
      end: minute.clone().add(1, "hour"),
    };

    expect(service.phaseFields({
      baseCategories: ["Astronomy", "Astrology"],
      body1Capitalized: "Moon",
      body2Capitalized: "Sun",
      phase: "forming",
      specialtyAspect: "quintile",
    })).toEqual(
      expect.objectContaining({
        description: "Moon forming quintile Sun",
        phaseEmoji: "➡️",
      }),
    );
    expect(service.phaseFields({
      baseCategories: ["Astronomy", "Astrology"],
      body1Capitalized: "Moon",
      body2Capitalized: "Sun",
      phase: "perfective",
      specialtyAspect: "quintile",
    })).toEqual(
      expect.objectContaining({
        description: "Moon perfective quintile Sun",
        phaseEmoji: "🎯",
      }),
    );
    expect(service.phaseFields({
      baseCategories: ["Astronomy", "Astrology"],
      body1Capitalized: "Moon",
      body2Capitalized: "Sun",
      phase: "dissolving",
      specialtyAspect: "quintile",
    })).toEqual(
      expect.objectContaining({
        description: "Moon dissolving quintile Sun",
        phaseEmoji: "⬅️",
      }),
    );

    expect(service.specialtyAspectGroupKey(beginning)).toBe(
      "Moon-Quintile-Sun",
    );
    expect(service.specialtyAspectGroupKey({ ...beginning, categories: ["Moon"] })).toBe("");

    expect(
      service.getSpecialtyAspectProgressiveEvent(beginning, ending),
    ).toEqual(
      expect.objectContaining({
        description: "Moon quintile Sun",
        summary: "🌙⬠☀️ Moon quintile Sun",
      }),
    );

    expect(
      service.getBodyLongitudesWindow({
        ephemeris: {},
        minute,
        nextMinute: minute.clone().add(1, "minute"),
        previousMinute: minute.clone().subtract(1, "minute"),
      }),
    ).toEqual({ current: 72, next: 73, previous: 71 });
  });

  it("rejects invalid input and formats grouped events", () => {
    expect(() =>
      service.extractTypedAspectValues({
        aspectCapitalized: "Not An Aspect",
        body1Capitalized: "Moon",
        body2Capitalized: "Sun",
        categories: ["Moon", "Sun"],
      }),
    ).toThrow("Could not extract typed values");

    expect(() =>
      service.extractAspectBodiesFromCategories(["Moon"]),
    ).toThrow("Could not extract aspect info");
    expect(() =>
      service.getSpecialtyAspectProgressiveEvent(
        {
          categories: ["Astronomy", "Astrology", "Specialty Aspect", "Moon"],
          description: "Invalid",
          end: moment.utc("2024-03-21T12:00:00.000Z"),
          start: moment.utc("2024-03-21T12:00:00.000Z"),
          summary: "Invalid",
        },
        {
          categories: ["Astronomy", "Astrology", "Specialty Aspect", "Moon"],
          description: "Invalid",
          end: moment.utc("2024-03-21T12:01:00.000Z"),
          start: moment.utc("2024-03-21T12:01:00.000Z"),
          summary: "Invalid",
        },
      ),
    ).toThrow("Could not extract aspect info");
  });
});
