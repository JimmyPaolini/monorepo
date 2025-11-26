import { describe, it, expect } from "vitest";
import { inputSchema } from "./input.schema";
import { mockDates } from "../testing/mocks";

describe("input.schema", () => {
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
        }).latitude
      ).toBe(-90);

      expect(
        inputSchema.parse({
          latitude: "90",
          longitude: "0",
          startDate: "2025-01-01",
          endDate: "2025-01-02",
        }).latitude
      ).toBe(90);
    });

    it("should reject latitudes outside valid range", () => {
      expect(() =>
        inputSchema.parse({
          latitude: "91",
          longitude: "0",
          startDate: "2025-01-01",
          endDate: "2025-01-02",
        })
      ).toThrow();

      expect(() =>
        inputSchema.parse({
          latitude: "-91",
          longitude: "0",
          startDate: "2025-01-01",
          endDate: "2025-01-02",
        })
      ).toThrow();
    });

    it("should use default latitude when not provided", () => {
      const result = inputSchema.parse({
        startDate: "2025-01-01",
        endDate: "2025-01-02",
      });
      expect(result.latitude).toBe(39.949309); // Philadelphia
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
        }).longitude
      ).toBe(-180);

      expect(
        inputSchema.parse({
          latitude: "0",
          longitude: "180",
          startDate: "2025-01-01",
          endDate: "2025-01-02",
        }).longitude
      ).toBe(180);
    });

    it("should reject longitudes outside valid range", () => {
      expect(() =>
        inputSchema.parse({
          latitude: "0",
          longitude: "181",
          startDate: "2025-01-01",
          endDate: "2025-01-02",
        })
      ).toThrow();

      expect(() =>
        inputSchema.parse({
          latitude: "0",
          longitude: "-181",
          startDate: "2025-01-01",
          endDate: "2025-01-02",
        })
      ).toThrow();
    });

    it("should use default longitude when not provided", () => {
      const result = inputSchema.parse({
        startDate: "2025-01-01",
        endDate: "2025-01-02",
      });
      expect(result.longitude).toBe(-75.17169); // Philadelphia
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

      expect(result.start).toBeInstanceOf(Date);
      expect(result.end).toBeInstanceOf(Date);
    });

    it("should require end date after start date", () => {
      expect(() =>
        inputSchema.parse({
          latitude: "40",
          longitude: "-74",
          startDate: "2025-03-21",
          endDate: "2025-03-20",
        })
      ).toThrow();
    });

    it("should reject identical start and end dates", () => {
      expect(() =>
        inputSchema.parse({
          latitude: "40",
          longitude: "-74",
          startDate: "2025-03-20",
          endDate: "2025-03-20",
        })
      ).toThrow();
    });

    it("should reject dates before 1900", () => {
      expect(() =>
        inputSchema.parse({
          latitude: "40",
          longitude: "-74",
          startDate: "1899-12-31",
          endDate: "1900-01-02",
        })
      ).toThrow();
    });

    it("should reject dates after 2100", () => {
      expect(() =>
        inputSchema.parse({
          latitude: "40",
          longitude: "-74",
          startDate: "2100-12-30",
          endDate: "2101-01-01",
        })
      ).toThrow();
    });
  });

  describe("default date values", () => {
    it("should default to 1 month before and after current date", () => {
      const result = inputSchema.parse({});

      // Verify start is before end
      expect(result.start.getTime()).toBeLessThan(result.end.getTime());
      // Verify approximately 2 months span
      const diffDays =
        (result.end.getTime() - result.start.getTime()) / (1000 * 60 * 60 * 24);
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
