import { ProgressiveUtilities } from "@caelundas/src/modules/progressive/progressive.utilities";
import { createMock } from "@golevelup/ts-vitest";
import { Test } from "@nestjs/testing";
import _ from "lodash";
import moment from "moment-timezone";
import { beforeAll, describe, expect, it } from "vitest";

import { SpecialtyAspectsProgressiveService } from "./specialty-aspects-progressive.service";

import type { Event } from "@caelundas/src/modules/calendar/calendar.types";

describe(SpecialtyAspectsProgressiveService, () => {
  let service: SpecialtyAspectsProgressiveService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SpecialtyAspectsProgressiveService,
        {
          provide: ProgressiveUtilities,
          useValue: createMock<ProgressiveUtilities>(),
        },
      ],
    }).compile();

    service = await module.resolve(SpecialtyAspectsProgressiveService);
  });

  const progressiveUtilitiesService = {
    pairProgressiveEvents:
      vi.fn<ProgressiveUtilities["pairProgressiveEvents"]>(),
  };

  const mockService = new SpecialtyAspectsProgressiveService(
    progressiveUtilitiesService as never,
  );
  const specialtyAspectsProgressiveService = mockService as unknown as {
    extractTypedAspectValues: (args: {
      aspectCapitalized: string;
      body1Capitalized: string;
      body2Capitalized: string;
      categories: string[];
    }) => { aspect: string; body1: string; body2: string };
    getSpecialtyAspectProgressiveEvent: (
      beginning: Event,
      ending: Event,
    ) => Event;
    processAspectGroup: (
      aspectGroupKey: string,
      aspectGroupEvents: Event[],
    ) => Event[];
    specialtyAspectGroupKey: (event: Event) => string;
  };

  it("is defined", () => {
    expect(service).toBeDefined();
  });

  it("returns an empty group key for incomplete categories", () => {
    expect(
      specialtyAspectsProgressiveService.specialtyAspectGroupKey({
        categories: ["Astronomy", "Astrology"],
        description: "Incomplete categories",
        end: moment.utc("2024-03-21T10:00:00.000Z"),
        start: moment.utc("2024-03-21T10:00:00.000Z"),
        summary: "Incomplete categories",
      } as Event),
    ).toBe("");
  });

  it("returns an empty array for an empty progressive group key", () => {
    expect(
      specialtyAspectsProgressiveService.processAspectGroup("", []),
    ).toStrictEqual([]);
  });

  it("throws when categories do not include a complete specialty aspect", () => {
    expect(() =>
      specialtyAspectsProgressiveService.getSpecialtyAspectProgressiveEvent(
        {
          categories: ["Astronomy", "Astrology", "Specialty Aspect", "Sun"],
          description: "Invalid beginning",
          end: moment.utc("2024-03-21T10:00:00.000Z"),
          start: moment.utc("2024-03-21T10:00:00.000Z"),
          summary: "Invalid beginning",
        } as Event,
        {
          categories: ["Astronomy", "Astrology", "Specialty Aspect", "Sun"],
          description: "Invalid ending",
          end: moment.utc("2024-03-21T11:00:00.000Z"),
          start: moment.utc("2024-03-21T11:00:00.000Z"),
          summary: "Invalid ending",
        } as Event,
      ),
    ).toThrow("Could not extract aspect info from categories");
  });

  it("throws when extracted specialty values cannot be cast to typed values", () => {
    expect(() =>
      specialtyAspectsProgressiveService.extractTypedAspectValues({
        aspectCapitalized: "Not Specialty",
        body1Capitalized: "Sun",
        body2Capitalized: "Moon",
        categories: ["Not Specialty", "Sun", "Moon"],
      }),
    ).toThrow("Could not extract typed values from categories");
  });

  it("falls back to empty body strings when sorted bodies include undefined", () => {
    const sortBySpy = vi
      .spyOn(_, "sortBy")
      .mockReturnValue([undefined, "Moon"] as unknown as string[]);

    expect(() =>
      specialtyAspectsProgressiveService.getSpecialtyAspectProgressiveEvent(
        {
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Specialty Aspect",
            "Sun",
            "Moon",
            "Quintile",
            "Forming",
          ],
          description: "invalid beginning",
          end: moment.utc("2024-03-21T10:00:00.000Z"),
          start: moment.utc("2024-03-21T10:00:00.000Z"),
          summary: "invalid beginning",
        } as Event,
        {
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Specialty Aspect",
            "Sun",
            "Moon",
            "Quintile",
            "Dissolving",
          ],
          description: "invalid ending",
          end: moment.utc("2024-03-21T11:00:00.000Z"),
          start: moment.utc("2024-03-21T11:00:00.000Z"),
          summary: "invalid ending",
        } as Event,
      ),
    ).toThrow("Could not extract typed values from categories");

    sortBySpy.mockRestore();
  });

  it("creates progressive events from grouped forming and dissolving events", () => {
    progressiveUtilitiesService.pairProgressiveEvents.mockReturnValueOnce([
      [
        {
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Specialty Aspect",
            "Sun",
            "Moon",
            "Quintile",
            "Forming",
          ],
          description: "Sun quintile Moon",
          end: moment.utc("2024-03-21T10:00:00.000Z"),
          start: moment.utc("2024-03-21T10:00:00.000Z"),
          summary: "⬠ Sun quintile Moon",
        },
        {
          categories: [
            "Astronomy",
            "Astrology",
            "Simple Aspect",
            "Specialty Aspect",
            "Sun",
            "Moon",
            "Quintile",
            "Dissolving",
          ],
          description: "Sun quintile Moon",
          end: moment.utc("2024-03-21T11:00:00.000Z"),
          start: moment.utc("2024-03-21T11:00:00.000Z"),
          summary: "⬠ Sun quintile Moon",
        },
      ],
    ]);

    const progressiveEvents = mockService.detectProgressive([
      {
        categories: [
          "Astronomy",
          "Astrology",
          "Simple Aspect",
          "Specialty Aspect",
          "Sun",
          "Moon",
          "Quintile",
          "Forming",
        ],
        description: "Sun quintile Moon",
        end: moment.utc("2024-03-21T10:00:00.000Z"),
        start: moment.utc("2024-03-21T10:00:00.000Z"),
        summary: "⬠ Sun quintile Moon",
      } as Event,
      {
        categories: [
          "Astronomy",
          "Astrology",
          "Simple Aspect",
          "Specialty Aspect",
          "Sun",
          "Moon",
          "Quintile",
          "Dissolving",
        ],
        description: "Sun quintile Moon",
        end: moment.utc("2024-03-21T11:00:00.000Z"),
        start: moment.utc("2024-03-21T11:00:00.000Z"),
        summary: "⬠ Sun quintile Moon",
      } as Event,
    ]);

    expect(
      progressiveUtilitiesService.pairProgressiveEvents,
    ).toHaveBeenCalledWith();
    expect(progressiveEvents).toHaveLength(1);
    expect(progressiveEvents[0]?.description).toBe("Moon quintile Sun");
    expect(progressiveEvents[0]?.summary).toContain("Moon quintile Sun");
  });
});
