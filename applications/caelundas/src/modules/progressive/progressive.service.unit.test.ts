import { AnnualSolarCycleService } from "@caelundas/src/modules/annualSolarCycle/annualSolarCycle.service";
import { AspectsService } from "@caelundas/src/modules/aspects/aspects.service";
import { EclipsesService } from "@caelundas/src/modules/eclipses/eclipses.service";
import { IngressesService } from "@caelundas/src/modules/ingresses/ingresses.service";
import { MonthlyLunarCycleService } from "@caelundas/src/modules/monthlyLunarCycle/monthlyLunarCycle.service";
import { PhasesService } from "@caelundas/src/modules/phases/phases.service";
import { RetrogradesService } from "@caelundas/src/modules/retrogrades/retrogrades.service";
import { TwilightsService } from "@caelundas/src/modules/twilights/twilights.service";
import { Test } from "@nestjs/testing";
import moment from "moment-timezone";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { ProgressiveService } from "./progressive.service";
import { ProgressiveUtilities } from "./progressive.utilities";

import type { Event } from "@caelundas/src/modules/calendar/calendar.types";

function makeEvent(summary: string): Event {
  return {
    start: moment.utc("2025-06-15T12:00:00Z"),
    end: moment.utc("2025-06-15T12:00:00Z"),
    summary,
    description: summary,
    categories: [],
  };
}

describe("ProgressiveService", () => {
  let service: ProgressiveService;
  let utilitiesService: ProgressiveUtilities;

  const annualSolarCycleMock = { detectProgressive: vi.fn() };
  const aspectsMock = { detectProgressive: vi.fn() };
  const eclipsesMock = { detectProgressive: vi.fn() };
  const ingressesMock = { detectProgressive: vi.fn() };
  const monthlyLunarCycleMock = { detectProgressive: vi.fn() };
  const phasesMock = { detectProgressive: vi.fn() };
  const retrogradesMock = { detectProgressive: vi.fn() };
  const twilightsMock = { detectProgressive: vi.fn() };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProgressiveService,
        { provide: AnnualSolarCycleService, useValue: annualSolarCycleMock },
        { provide: AspectsService, useValue: aspectsMock },
        { provide: EclipsesService, useValue: eclipsesMock },
        { provide: IngressesService, useValue: ingressesMock },
        { provide: MonthlyLunarCycleService, useValue: monthlyLunarCycleMock },
        { provide: PhasesService, useValue: phasesMock },
        { provide: RetrogradesService, useValue: retrogradesMock },
        { provide: TwilightsService, useValue: twilightsMock },
        ProgressiveUtilities,
      ],
    }).compile();

    service = module.get(ProgressiveService);
    utilitiesService = module.get(ProgressiveUtilities);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("detect", () => {
    it("should return an empty array when all sub-services return nothing", () => {
      for (const subMock of [
        annualSolarCycleMock,
        aspectsMock,
        eclipsesMock,
        ingressesMock,
        monthlyLunarCycleMock,
        phasesMock,
        retrogradesMock,
        twilightsMock,
      ]) {
        subMock.detectProgressive.mockReturnValue([]);
      }

      const result = service.detect([]);

      expect(result).toEqual([]);
    });

    it("should aggregate events from all sub-services into a single flat array", () => {
      const aspectEvent = makeEvent("aspect");
      const retrogradeEvent = makeEvent("retrograde");
      const eclipseEvent = makeEvent("eclipse");

      aspectsMock.detectProgressive.mockReturnValue([aspectEvent]);
      retrogradesMock.detectProgressive.mockReturnValue([retrogradeEvent]);
      eclipsesMock.detectProgressive.mockReturnValue([eclipseEvent]);
      ingressesMock.detectProgressive.mockReturnValue([]);
      monthlyLunarCycleMock.detectProgressive.mockReturnValue([]);
      twilightsMock.detectProgressive.mockReturnValue([]);
      phasesMock.detectProgressive.mockReturnValue([]);
      annualSolarCycleMock.detectProgressive.mockReturnValue([]);

      const result = service.detect([]);

      expect(result).toContain(aspectEvent);
      expect(result).toContain(retrogradeEvent);
      expect(result).toContain(eclipseEvent);
      expect(result).toHaveLength(3);
    });

    it("should forward the perfective events array to every sub-service", () => {
      const perfectiveEvents = [makeEvent("perfective")];

      for (const subMock of [
        annualSolarCycleMock,
        aspectsMock,
        eclipsesMock,
        ingressesMock,
        monthlyLunarCycleMock,
        phasesMock,
        retrogradesMock,
        twilightsMock,
      ]) {
        subMock.detectProgressive.mockReturnValue([]);
      }

      service.detect(perfectiveEvents);

      for (const subMock of [
        annualSolarCycleMock,
        aspectsMock,
        eclipsesMock,
        ingressesMock,
        monthlyLunarCycleMock,
        phasesMock,
        retrogradesMock,
        twilightsMock,
      ]) {
        expect(subMock.detectProgressive).toHaveBeenCalledWith(
          perfectiveEvents,
        );
      }
    });
  });

  describe("pairProgressiveEvents", () => {
    it("should return an empty array when both inputs are empty", () => {
      const result = utilitiesService.pairProgressiveEvents([], [], "test");

      expect(result).toEqual([]);
    });

    it("should pair beginnings with their corresponding endings", () => {
      const beginning1 = makeEvent("beginning-1");
      const ending1 = makeEvent("ending-1");
      const beginning2 = makeEvent("beginning-2");
      const ending2 = makeEvent("ending-2");

      const result = utilitiesService.pairProgressiveEvents(
        [beginning1, beginning2],
        [ending1, ending2],
        "test",
      );

      expect(result).toEqual([
        [beginning1, ending1],
        [beginning2, ending2],
      ]);
    });

    it("should truncate to the shorter list when counts differ", () => {
      const beginning1 = makeEvent("beginning-1");
      const beginning2 = makeEvent("beginning-2");
      const ending1 = makeEvent("ending-1");

      const result = utilitiesService.pairProgressiveEvents(
        [beginning1, beginning2],
        [ending1],
        "test",
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual([beginning1, ending1]);
    });

    it("should emit a console warning when beginning and ending counts differ", () => {
      const warnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => undefined);

      utilitiesService.pairProgressiveEvents(
        [makeEvent("a"), makeEvent("b")],
        [makeEvent("c")],
        "my-label",
      );

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("my-label"));

      warnSpy.mockRestore();
    });

    it("should not warn when counts are equal", () => {
      const warnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => undefined);

      utilitiesService.pairProgressiveEvents(
        [makeEvent("a")],
        [makeEvent("b")],
        "test",
      );

      expect(warnSpy).not.toHaveBeenCalled();

      warnSpy.mockRestore();
    });
  });
});
