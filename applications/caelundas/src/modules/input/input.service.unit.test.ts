import { mockDates } from "@caelundas/testing/mocks";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import moment from "moment-timezone";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { environmentSchema, inputSchema } from "./input.constants";
import { InputService } from "./input.service";

import type { Environment } from "./input.types";

describe("InputService", () => {
  let service: InputService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        InputService,
        { provide: ConfigService, useValue: { get: vi.fn() } },
      ],
    }).compile();
    service = await module.resolve(InputService);
  });

  describe("environmentSchema.parse", () => {
    it("should return validated environment with all fields provided", () => {
      const env = environmentSchema.parse({
        LATITUDE: "40.7128",
        LONGITUDE: "-74.006",
        START_DATE: "2025-01-01",
        END_DATE: "2025-01-02",
        OUTPUT_DIRECTORY: "./out",
      });
      expect(env.LATITUDE).toBe(40.7128);
      expect(env.LONGITUDE).toBe(-74.006);
      expect(env.START_DATE).toBe("2025-01-01");
      expect(env.END_DATE).toBe("2025-01-02");
      expect(env.OUTPUT_DIRECTORY).toBe("./out");
    });

    it("should default OUTPUT_DIRECTORY to ./output when omitted", () => {
      const env = environmentSchema.parse({});
      expect(env.OUTPUT_DIRECTORY).toBe("./output");
    });

    it("should coerce string coordinates to numbers", () => {
      const env = environmentSchema.parse({
        LATITUDE: "40.7128",
        LONGITUDE: "-74.006",
      });
      expect(typeof env.LATITUDE).toBe("number");
      expect(typeof env.LONGITUDE).toBe("number");
    });

    it("should succeed when all fields are omitted", () => {
      expect(() => environmentSchema.parse({})).not.toThrow();
    });

    it("should throw when LATITUDE is out of range", () => {
      expect(() => environmentSchema.parse({ LATITUDE: "91" })).toThrow();
    });

    it("should throw when LONGITUDE is out of range", () => {
      expect(() => environmentSchema.parse({ LONGITUDE: "181" })).toThrow();
    });

    it("should throw when START_DATE format is invalid", () => {
      expect(() =>
        environmentSchema.parse({ START_DATE: "01-01-2025" }),
      ).toThrow();
    });

    it("should throw when END_DATE format is invalid", () => {
      expect(() =>
        environmentSchema.parse({ END_DATE: "not-a-date" }),
      ).toThrow();
    });
  });

  describe("parse", () => {
    mockDates();

    function makeService(env: Partial<Environment>): InputService {
      const configService = {
        get: vi.fn((key: string) => env[key as keyof Environment]),
      } as unknown as ConfigService<Environment>;
      return new InputService(configService);
    }

    it("should parse valid environment into an Input domain object", () => {
      const service = makeService({
        LATITUDE: 40.7128,
        LONGITUDE: -74.006,
        START_DATE: "2025-01-01",
        END_DATE: "2025-01-02",
      });
      const result = service.parse();
      expect(result.latitude).toBe(40.7128);
      expect(result.longitude).toBe(-74.006);
      expect(result.timezone).toBe("America/New_York");
      expect(moment.isMoment(result.start)).toBe(true);
      expect(moment.isMoment(result.end)).toBe(true);
    });

    it("should use Philadelphia defaults when coordinates are omitted", () => {
      const service = makeService({
        START_DATE: "2025-01-01",
        END_DATE: "2025-01-02",
      });
      const result = service.parse();
      expect(result.latitude).toBe(39.949_309);
      expect(result.longitude).toBe(-75.171_69);
    });

    it("should use default date range when dates are omitted", () => {
      const service = makeService({});
      const result = service.parse();
      expect(result.start.valueOf()).toBeLessThan(result.end.valueOf());
    });

    it("should throw when end date is before start date", () => {
      const service = makeService({
        LATITUDE: 40,
        LONGITUDE: -74,
        START_DATE: "2025-03-21",
        END_DATE: "2025-03-20",
      });
      expect(() => service.parse()).toThrow();
    });
  });

  describe("inputSchema", () => {
    // Mock moment to return a fixed date for default value testing
    mockDates();

    describe("latitude validation", () => {
      it("should accept valid latitudes", () => {
        const result = inputSchema.parse({
          latitude: "40.7128",
          longitude: "-74.006",
          startDate: "2025-01-01",
          endDate: "2025-01-02",
        });
        expect(result.latitude).toBe(40.7128);
      });

      it("should accept boundary latitudes", () => {
        expect(
          inputSchema.parse({
            latitude: "-90",
            longitude: "0",
            startDate: "2025-01-01",
            endDate: "2025-01-02",
          }).latitude,
        ).toBe(-90);

        expect(
          inputSchema.parse({
            latitude: "90",
            longitude: "0",
            startDate: "2025-01-01",
            endDate: "2025-01-02",
          }).latitude,
        ).toBe(90);
      });

      it("should reject latitudes outside valid range", () => {
        expect(() =>
          inputSchema.parse({
            latitude: "91",
            longitude: "0",
            startDate: "2025-01-01",
            endDate: "2025-01-02",
          }),
        ).toThrow();

        expect(() =>
          inputSchema.parse({
            latitude: "-91",
            longitude: "0",
            startDate: "2025-01-01",
            endDate: "2025-01-02",
          }),
        ).toThrow();
      });

      it("should use default latitude when not provided", () => {
        const result = inputSchema.parse({
          startDate: "2025-01-01",
          endDate: "2025-01-02",
        });
        expect(result.latitude).toBe(39.949_309); // Philadelphia
      });
    });

    describe("longitude validation", () => {
      it("should accept valid longitudes", () => {
        const result = inputSchema.parse({
          latitude: "40.7128",
          longitude: "-74.006",
          startDate: "2025-01-01",
          endDate: "2025-01-02",
        });
        expect(result.longitude).toBe(-74.006);
      });

      it("should accept boundary longitudes", () => {
        expect(
          inputSchema.parse({
            latitude: "0",
            longitude: "-180",
            startDate: "2025-01-01",
            endDate: "2025-01-02",
          }).longitude,
        ).toBe(-180);

        expect(
          inputSchema.parse({
            latitude: "0",
            longitude: "180",
            startDate: "2025-01-01",
            endDate: "2025-01-02",
          }).longitude,
        ).toBe(180);
      });

      it("should reject longitudes outside valid range", () => {
        expect(() =>
          inputSchema.parse({
            latitude: "0",
            longitude: "181",
            startDate: "2025-01-01",
            endDate: "2025-01-02",
          }),
        ).toThrow();

        expect(() =>
          inputSchema.parse({
            latitude: "0",
            longitude: "-181",
            startDate: "2025-01-01",
            endDate: "2025-01-02",
          }),
        ).toThrow();
      });

      it("should use default longitude when not provided", () => {
        const result = inputSchema.parse({
          startDate: "2025-01-01",
          endDate: "2025-01-02",
        });
        expect(result.longitude).toBe(-75.171_69); // Philadelphia
      });
    });

    describe("timezone inference", () => {
      it("should infer timezone from coordinates", () => {
        // New York coordinates
        const nyResult = inputSchema.parse({
          latitude: "40.7128",
          longitude: "-74.006",
          startDate: "2025-01-01",
          endDate: "2025-01-02",
        });
        expect(nyResult.timezone).toBe("America/New_York");

        // Los Angeles coordinates
        const laResult = inputSchema.parse({
          latitude: "34.0522",
          longitude: "-118.2437",
          startDate: "2025-01-01",
          endDate: "2025-01-02",
        });
        expect(laResult.timezone).toBe("America/Los_Angeles");

        // London coordinates
        const londonResult = inputSchema.parse({
          latitude: "51.5074",
          longitude: "-0.1278",
          startDate: "2025-01-01",
          endDate: "2025-01-02",
        });
        expect(londonResult.timezone).toBe("Europe/London");
      });
    });

    describe("date validation", () => {
      it("should parse valid date strings", () => {
        const result = inputSchema.parse({
          latitude: "40",
          longitude: "-74",
          startDate: "2025-03-20",
          endDate: "2025-03-21",
        });

        expect(moment.isMoment(result.start)).toBe(true);
        expect(moment.isMoment(result.end)).toBe(true);
      });

      it("should require end date after start date", () => {
        expect(() =>
          inputSchema.parse({
            latitude: "40",
            longitude: "-74",
            startDate: "2025-03-21",
            endDate: "2025-03-20",
          }),
        ).toThrow();
      });

      it("should reject identical start and end dates", () => {
        expect(() =>
          inputSchema.parse({
            latitude: "40",
            longitude: "-74",
            startDate: "2025-03-20",
            endDate: "2025-03-20",
          }),
        ).toThrow();
      });

      it("should reject dates before 1900", () => {
        expect(() =>
          inputSchema.parse({
            latitude: "40",
            longitude: "-74",
            startDate: "1899-12-31",
            endDate: "1900-01-02",
          }),
        ).toThrow();
      });

      it("should reject dates after 2100", () => {
        expect(() =>
          inputSchema.parse({
            latitude: "40",
            longitude: "-74",
            startDate: "2100-12-30",
            endDate: "2101-01-01",
          }),
        ).toThrow();
      });
    });

    describe("default date values", () => {
      it("should default to 1 month before and after current date", () => {
        const result = inputSchema.parse({});

        // Verify start is before end
        expect(result.start.valueOf()).toBeLessThan(result.end.valueOf());
        // Verify approximately 2 months span
        const diffDays =
          (result.end.valueOf() - result.start.valueOf()) /
          (1000 * 60 * 60 * 24);
        expect(diffDays).toBeGreaterThan(50); // ~2 months
        expect(diffDays).toBeLessThan(70);
      });
    });

    describe("coercion", () => {
      it("should coerce string latitude/longitude to numbers", () => {
        const result = inputSchema.parse({
          latitude: "40.7128",
          longitude: "-74.006",
          startDate: "2025-01-01",
          endDate: "2025-01-02",
        });

        expect(typeof result.latitude).toBe("number");
        expect(typeof result.longitude).toBe("number");
      });
    });
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
