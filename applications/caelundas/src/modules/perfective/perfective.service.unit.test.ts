import { DatetimeService } from "@caelundas/src/modules/datetime/datetime.service";
import { EphemerisAggregatesService } from "@caelundas/src/modules/ephemeris/ephemeris.aggregates";
import { AnnualSolarCycleService } from "@caelundas/src/modules/events/annualSolarCycle/annual-solar-cycle.service";
import { AspectsService } from "@caelundas/src/modules/events/aspects/aspects.service";
import { DailyCyclesService } from "@caelundas/src/modules/events/dailyCycles/daily-cycles.service";
import { EclipsesService } from "@caelundas/src/modules/events/eclipses/eclipses.service";
import { IngressesService } from "@caelundas/src/modules/events/ingresses/ingresses.service";
import { MonthlyLunarCycleService } from "@caelundas/src/modules/events/monthlyLunarCycle/monthly-lunar-cycle.service";
import { PhasesService } from "@caelundas/src/modules/events/phases/phases.service";
import { RetrogradesService } from "@caelundas/src/modules/events/retrogrades/retrogrades.service";
import { TwilightsService } from "@caelundas/src/modules/events/twilights/twilights.service";
import { Test } from "@nestjs/testing";
import moment from "moment-timezone";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { PerfectiveService } from "./perfective.service";

import type { Input } from "@caelundas/src/modules/input/input.types";

vi.mock("fs", () => ({
  default: {
    writeFileSync: vi.fn(),
  },
}));

const baseInput: Input = {
  latitude: 39.9526,
  longitude: -75.1652,
  start: moment.tz("2025-06-15", "America/New_York"),
  end: moment.tz("2025-06-16", "America/New_York"),
  timezone: "America/New_York",
};

const emptyEphemerides = {
  azimuthElevationEphemerisByBody: {} as never,
  coordinateEphemerisByBody: {} as never,
  diameterEphemerisByBody: {} as never,
  distanceEphemerisByBody: {} as never,
  illuminationEphemerisByBody: {} as never,
};

describe("PerfectiveService", () => {
  let service: PerfectiveService;

  const datetimeMock = { generateDates: vi.fn(), generateMinutes: vi.fn() };
  const ephemerisAggMock = { getEphemerides: vi.fn() };
  const aspectsMock = { detect: vi.fn() };
  const eclipsesMock = { detect: vi.fn() };
  const retrogradesMock = { detect: vi.fn() };
  const ingressesMock = { detect: vi.fn() };
  const dailyCyclesMock = { detect: vi.fn() };
  const monthlyLunarCycleMock = { detect: vi.fn() };
  const annualSolarCycleMock = { detect: vi.fn() };
  const twilightsMock = { detect: vi.fn() };
  const phasesMock = { detect: vi.fn() };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PerfectiveService,
        { provide: DatetimeService, useValue: datetimeMock },
        { provide: EphemerisAggregatesService, useValue: ephemerisAggMock },
        { provide: AspectsService, useValue: aspectsMock },
        { provide: EclipsesService, useValue: eclipsesMock },
        { provide: RetrogradesService, useValue: retrogradesMock },
        { provide: IngressesService, useValue: ingressesMock },
        { provide: DailyCyclesService, useValue: dailyCyclesMock },
        { provide: MonthlyLunarCycleService, useValue: monthlyLunarCycleMock },
        { provide: AnnualSolarCycleService, useValue: annualSolarCycleMock },
        { provide: TwilightsService, useValue: twilightsMock },
        { provide: PhasesService, useValue: phasesMock },
      ],
    }).compile();

    service = module.get(PerfectiveService);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("detect", () => {
    it("should return an empty array when no dates are generated", () => {
      datetimeMock.generateDates.mockReturnValue([]);

      const result = service.detect(baseInput);

      expect(result).toEqual([]);
    });

    it("should return an empty array when no minutes are generated within a day", () => {
      const date = moment.tz("2025-06-15", "America/New_York");
      datetimeMock.generateDates.mockReturnValue([date]);
      ephemerisAggMock.getEphemerides.mockReturnValue(emptyEphemerides);
      datetimeMock.generateMinutes.mockReturnValue([]);

      const result = service.detect(baseInput);

      expect(result).toEqual([]);
    });

    it("should request ephemerides with MARGIN_MINUTES padding around the day", () => {
      const date = moment.tz("2025-06-15", "America/New_York");
      datetimeMock.generateDates.mockReturnValue([date]);
      ephemerisAggMock.getEphemerides.mockReturnValue(emptyEphemerides);
      datetimeMock.generateMinutes.mockReturnValue([]);

      service.detect(baseInput);

      expect(ephemerisAggMock.getEphemerides).toHaveBeenCalledOnce();
      const { start, end } =
        ephemerisAggMock.getEphemerides.mock.calls[0]?.[0] ?? {};
      expect(end?.isAfter(start)).toBe(true);
    });

    it("should accumulate events returned by sub-services across all minutes", () => {
      const date = moment.tz("2025-06-15", "America/New_York");
      const minute1 = date.clone().startOf("day");
      const minute2 = date.clone().startOf("day").add(1, "minute");
      const fakeEvent1 = { summary: "event-1" } as never;
      const fakeEvent2 = { summary: "event-2" } as never;

      datetimeMock.generateDates.mockReturnValue([date]);
      ephemerisAggMock.getEphemerides.mockReturnValue(emptyEphemerides);
      datetimeMock.generateMinutes.mockReturnValue([minute1, minute2]);

      aspectsMock.detect
        .mockReturnValueOnce({ events: [fakeEvent1], aspectBodies: [] })
        .mockReturnValueOnce({ events: [fakeEvent2], aspectBodies: [] });

      for (const subMock of [
        eclipsesMock,
        retrogradesMock,
        ingressesMock,
        dailyCyclesMock,
        monthlyLunarCycleMock,
        annualSolarCycleMock,
        twilightsMock,
        phasesMock,
      ]) {
        subMock.detect.mockReturnValue([]);
      }

      const result = service.detect(baseInput);

      expect(result).toContain(fakeEvent1);
      expect(result).toContain(fakeEvent2);
    });
  });
});
