import moment from "moment-timezone";
import { describe, expect, it, vi } from "vitest";
import { calc } from "sweph";

vi.mock("sweph", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sweph")>();
  return {
    ...actual,
    calc: vi.fn().mockReturnValue({
      data: [120.5, -1.2, 1.01, 0, 0, 0],
      error: "",
      flag: 258,
    }),
    nod_aps_ut: vi.fn().mockReturnValue({
      data: {
        perihelion: [90, 0, 0, 0, 0, 0],
      },
      error: "",
      flag: 258,
    }),
  };
});

vi.mock("./ephemeris.constants", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./ephemeris.constants")>();
  return {
    ...actual,
    swissEphemerisConstantByNode: {
      "lunar apogee": 22,
      "lunar perigee": null,
      "north lunar node": null,
      "south lunar node": 11,
    },
  };
});

import { EphemerisCoordinateService } from "./ephemeris-coordinate.service";

describe("EphemerisCoordinateService branch coverage", () => {
  const constantsService = {
    getSwissEphemerisConstantForBody: vi.fn().mockReturnValue(0),
  };
  const timeService = {
    dateToJulianDays: vi.fn().mockReturnValue({
      julianDayEphemerisTime: 2_460_395.5,
      julianDayUniversalTime: 2_460_395.499_306,
    }),
    generateMinutes: vi.fn((start: moment.Moment, end: moment.Moment) => {
      const values: moment.Moment[] = [];
      let current = start.clone();
      while (current.valueOf() <= end.valueOf()) {
        values.push(current.clone());
        current = current.clone().add(1, "minute");
      }
      return values;
    }),
  };
  const mathService = {
    normalizeDegrees: vi.fn((degree: number) => degree),
  };

  const service = new EphemerisCoordinateService(
    constantsService as never,
    timeService as never,
    mathService,
  );

  it("throws when a node has no Swiss Ephemeris constant", () => {
    expect(() =>
      service.computeNodeBodyMinutes({
        body: "north lunar node",
        end: moment.utc("2024-03-21T00:00:00.000Z"),
        start: moment.utc("2024-03-21T00:00:00.000Z"),
      }),
    ).toThrow("No Swiss Ephemeris constant configured for node: north lunar node");
  });

  it("throws when a regular node calculation fails", () => {
    vi.mocked(calc).mockReturnValueOnce({
      data: [0, 0, 0, 0, 0, 0],
      error: "calc failed",
      flag: -1,
    } as never);

    expect(() =>
      service.computeNodeBodyMinutes({
        body: "south lunar node",
        end: moment.utc("2024-03-21T00:00:00.000Z"),
        start: moment.utc("2024-03-21T00:00:00.000Z"),
      }),
    ).toThrow("calc failed for south lunar node: calc failed");
  });
});
