import moment from "moment-timezone";
import { describe, expect, it, vi } from "vitest";

import { SpecialtyAspectsProgressiveService } from "./specialty-aspects-progressive.service";

import type { Event } from "@caelundas/src/modules/calendar/calendar.types";

describe("SpecialtyAspectsProgressiveService", () => {
  const progressiveUtilitiesService = {
    pairProgressiveEvents: vi.fn(),
  };

  const service = new SpecialtyAspectsProgressiveService(
    progressiveUtilitiesService as never,
  );
  const specialtyAspectsProgressiveService = service as unknown as {
    getSpecialtyAspectProgressiveEvent: (beginning: Event, ending: Event) => Event;
    processAspectGroup: (aspectGroupKey: string, aspectGroupEvents: Event[]) => Event[];
    specialtyAspectGroupKey: (event: Event) => string;
  };

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
    expect(specialtyAspectsProgressiveService.processAspectGroup("", [])).toEqual(
      [],
    );
  });

  it("throws when categories do not include a complete specialty aspect", () => {
    expect(() =>
      specialtyAspectsProgressiveService.getSpecialtyAspectProgressiveEvent(
        {
          categories: [
            "Astronomy",
            "Astrology",
            "Specialty Aspect",
            "Sun",
          ],
          description: "Invalid beginning",
          end: moment.utc("2024-03-21T10:00:00.000Z"),
          start: moment.utc("2024-03-21T10:00:00.000Z"),
          summary: "Invalid beginning",
        } as Event,
        {
          categories: [
            "Astronomy",
            "Astrology",
            "Specialty Aspect",
            "Sun",
          ],
          description: "Invalid ending",
          end: moment.utc("2024-03-21T11:00:00.000Z"),
          start: moment.utc("2024-03-21T11:00:00.000Z"),
          summary: "Invalid ending",
        } as Event,
      ),
    ).toThrow("Could not extract aspect info from categories");
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
      ],
    ]);

    const progressiveEvents = service.detectProgressive([
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

    expect(progressiveUtilitiesService.pairProgressiveEvents).toHaveBeenCalled();
    expect(progressiveEvents).toHaveLength(1);
    expect(progressiveEvents[0]?.description).toBe("Moon quintile Sun");
    expect(progressiveEvents[0]?.summary).toContain("Moon quintile Sun");
  });
});
