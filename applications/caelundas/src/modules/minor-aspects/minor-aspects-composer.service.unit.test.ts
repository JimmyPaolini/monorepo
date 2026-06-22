import { EphemerisService } from "@caelundas/src/modules/ephemeris/ephemeris.service";
import { ProgressiveUtilities } from "@caelundas/src/modules/progressive/progressive.utilities";
import { createMock } from "@golevelup/ts-vitest";
import { Test } from "@nestjs/testing";
import moment from "moment-timezone";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { LoggerService } from "../logger/logger.service";

import { MinorAspectsComposerService } from "./minor-aspects-composer.service";

import type { Mocked } from "vitest";

describe(MinorAspectsComposerService, () => {
  let service: MinorAspectsComposerService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MinorAspectsComposerService,
        { provide: LoggerService, useValue: createMock<LoggerService>() },
        {
          provide: EphemerisService,
          useValue: createMock<EphemerisService>(),
        },
        {
          provide: ProgressiveUtilities,
          useValue: createMock<ProgressiveUtilities>(),
        },
      ],
    }).compile();

    service = await module.resolve(MinorAspectsComposerService);
  });

  const mockLogger: LoggerService = {
    error: vi.fn<LoggerService["error"]>(),
    log: vi.fn<LoggerService["log"]>(),
    setContext: vi.fn<LoggerService["setContext"]>(),
  } as unknown as LoggerService;
  const mockEphemerisService: EphemerisService = {
    getLongitudesWindow: vi
      .fn<EphemerisService["getLongitudesWindow"]>()
      .mockReturnValue({
        current: 10,
        next: 11,
        previous: 9,
      }),
  } as unknown as EphemerisService;
  const mockProgressiveUtilitiesService: Mocked<ProgressiveUtilities> = {
    pairProgressiveEvents:
      vi.fn<ProgressiveUtilities["pairProgressiveEvents"]>(),
  } as unknown as Mocked<ProgressiveUtilities>;

  const mockService = new MinorAspectsComposerService(
    mockLogger,
    mockEphemerisService,
    mockProgressiveUtilitiesService,
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is defined", () => {
    expect(service).toBeDefined();
  });

  it("assembles boundary events for every phase", () => {
    const timestamp = moment.utc("2024-03-21T12:00:00.000Z");

    expect(
      mockService.assembleMinorAspectEvent({
        body1: "sun",
        body2: "moon",
        minorAspect: "semisextile",
        phase: "perfective",
        timestamp,
      }),
    ).toStrictEqual(
      expect.objectContaining({
        categories: expect.arrayContaining(["Perfective", "Minor Aspect"]),
        description: "Sun perfective semisextile Moon",
        summary: "🎯 ☀️ ⚺ 🌙 Sun perfective semisextile Moon",
      }),
    );

    expect(
      mockService.assembleMinorAspectEvent({
        body1: "sun",
        body2: "moon",
        minorAspect: "semisextile",
        phase: "forming",
        timestamp,
      }),
    ).toStrictEqual(
      expect.objectContaining({
        categories: expect.arrayContaining(["Forming"]),
        description: "Sun forming semisextile Moon",
        summary: "➡️ ☀️ ⚺ 🌙 Sun forming semisextile Moon",
      }),
    );

    expect(
      mockService.assembleMinorAspectEvent({
        body1: "sun",
        body2: "moon",
        minorAspect: "semisextile",
        phase: "dissolving",
        timestamp,
      }),
    ).toStrictEqual(
      expect.objectContaining({
        categories: expect.arrayContaining(["Dissolving"]),
        description: "Sun dissolving semisextile Moon",
        summary: "⬅️ ☀️ ⚺ 🌙 Sun dissolving semisextile Moon",
      }),
    );
  });

  it("extracts and casts aspect components", () => {
    expect(
      mockService.extractAspectComponents([
        "Astronomy",
        "Astrology",
        "Simple Aspect",
        "Minor Aspect",
        "Moon",
        "Sun",
        "Semisextile",
      ]),
    ).toStrictEqual({
      aspect: "semisextile",
      aspectCapitalized: "Semisextile",
      body1: "moon",
      body1Capitalized: "Moon",
      body2: "sun",
      body2Capitalized: "Sun",
    });

    expect(
      mockService.castAspectComponentsToTypes({
        aspectCapitalized: "Semisextile",
        body1Capitalized: "Moon",
        body2Capitalized: "Sun",
        categories: ["Semisextile", "Moon", "Sun"],
      }),
    ).toStrictEqual({
      aspect: "semisextile",
      body1: "moon",
      body2: "sun",
    });

    expect(() =>
      mockService.extractAspectComponents([
        "Astronomy",
        "Minor Aspect",
        "Moon",
      ]),
    ).toThrow("Could not extract aspect info");
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

    expect(mockService.buildGroupKey(beginning)).toBe("Moon-Semisextile-Sun");
    expect(
      mockService.buildGroupKey({ ...beginning, categories: ["Moon"] }),
    ).toBe("");

    expect(
      mockService.getMinorAspectProgressiveEvent(beginning, ending),
    ).toStrictEqual(
      expect.objectContaining({
        categories: expect.arrayContaining(["Minor Aspect", "Semisextile"]),
        description: "Moon semisextile Sun",
      }),
    );

    expect(
      mockService.processAspectGroup("Moon-Semisextile-Sun", [
        beginning,
        ending,
      ]),
    ).toHaveLength(1);
    expect(
      mockService.processAspectGroup("", [beginning, ending]),
    ).toStrictEqual([]);

    const pairProgressiveEventsCall =
      mockProgressiveUtilitiesService.pairProgressiveEvents.mock.calls[0];

    expect(pairProgressiveEventsCall).toStrictEqual([
      [beginning],
      [ending],
      "minor aspect Moon-Semisextile-Sun",
    ]);
  });

  it("reads longitudes from ephemerides and rejects invalid input", () => {
    expect(
      mockService.getLongitudesWindowForBody({
        body: "sun",
        coordinateEphemerisByBody: { sun: {} as never },
        minute: moment.utc("2024-03-21T12:00:00.000Z"),
        nextMinute: moment.utc("2024-03-21T12:01:00.000Z"),
        previousMinute: moment.utc("2024-03-21T11:59:00.000Z"),
      }),
    ).toStrictEqual({ current: 10, next: 11, previous: 9 });

    expect(() =>
      mockService.castAspectComponentsToTypes({
        aspectCapitalized: "Not An Aspect",
        body1Capitalized: "Moon",
        body2Capitalized: "Sun",
        categories: ["Moon", "Sun"],
      }),
    ).toThrow("Could not extract typed values");
  });
});
