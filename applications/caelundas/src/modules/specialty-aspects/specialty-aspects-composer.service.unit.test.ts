import { EphemerisService } from "@caelundas/src/modules/ephemeris/ephemeris.service";
import { createMock } from "@golevelup/ts-vitest";
import { Test } from "@nestjs/testing";
import moment from "moment-timezone";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { LoggerService } from "../logger/logger.service";

import { SpecialtyAspectsComposerService } from "./specialty-aspects-composer.service";

describe("SpecialtyAspectsComposerService", () => {
  let service: SpecialtyAspectsComposerService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SpecialtyAspectsComposerService,
        { provide: LoggerService, useValue: createMock<LoggerService>() },
        {
          provide: EphemerisService,
          useValue: createMock<EphemerisService>(),
        },
      ],
    }).compile();

    service = await module.resolve(SpecialtyAspectsComposerService);
  });

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

  const mockService = new SpecialtyAspectsComposerService(
    mockLogger as never,
    mockEphemerisService as never,
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("assembles boundary events for every phase", () => {
    const timestamp = moment.utc("2024-03-21T12:00:00.000Z");

    expect(
      mockService.buildSpecialtyAspectEventFromParts({
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
      mockService.extractAspectBodiesFromCategories([
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
      mockService.extractTypedAspectValues({
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

    expect(
      mockService.phaseFields({
        baseCategories: ["Astronomy", "Astrology"],
        body1Capitalized: "Moon",
        body2Capitalized: "Sun",
        phase: "forming",
        specialtyAspect: "quintile",
      }),
    ).toEqual(
      expect.objectContaining({
        description: "Moon forming quintile Sun",
        phaseEmoji: "➡️",
      }),
    );
    expect(
      mockService.phaseFields({
        baseCategories: ["Astronomy", "Astrology"],
        body1Capitalized: "Moon",
        body2Capitalized: "Sun",
        phase: "perfective",
        specialtyAspect: "quintile",
      }),
    ).toEqual(
      expect.objectContaining({
        description: "Moon perfective quintile Sun",
        phaseEmoji: "🎯",
      }),
    );
    expect(
      mockService.phaseFields({
        baseCategories: ["Astronomy", "Astrology"],
        body1Capitalized: "Moon",
        body2Capitalized: "Sun",
        phase: "dissolving",
        specialtyAspect: "quintile",
      }),
    ).toEqual(
      expect.objectContaining({
        description: "Moon dissolving quintile Sun",
        phaseEmoji: "⬅️",
      }),
    );

    expect(mockService.specialtyAspectGroupKey(beginning)).toBe(
      "Moon-Quintile-Sun",
    );
    expect(
      mockService.specialtyAspectGroupKey({
        ...beginning,
        categories: ["Moon"],
      }),
    ).toBe("");

    expect(
      mockService.getSpecialtyAspectProgressiveEvent(beginning, ending),
    ).toEqual(
      expect.objectContaining({
        description: "Moon quintile Sun",
        summary: "🌙⬠☀️ Moon quintile Sun",
      }),
    );

    expect(
      mockService.getBodyLongitudesWindow({
        ephemeris: {},
        minute,
        nextMinute: minute.clone().add(1, "minute"),
        previousMinute: minute.clone().subtract(1, "minute"),
      }),
    ).toEqual({ current: 72, next: 73, previous: 71 });
  });

  it("rejects invalid input and formats grouped events", () => {
    expect(() =>
      mockService.extractTypedAspectValues({
        aspectCapitalized: "Not An Aspect",
        body1Capitalized: "Moon",
        body2Capitalized: "Sun",
        categories: ["Moon", "Sun"],
      }),
    ).toThrow("Could not extract typed values");

    expect(() =>
      mockService.extractAspectBodiesFromCategories(["Moon"]),
    ).toThrow("Could not extract aspect info");
    expect(() =>
      mockService.getSpecialtyAspectProgressiveEvent(
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

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
