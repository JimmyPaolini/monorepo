import { describe, expect, it } from "vitest";

import {
  centerIdByBody,
  commandIdByAsteroid,
  commandIdByBody,
  commandIdByComet,
  commandIdByPlanet,
  dateRegex,
  decimalRegex,
  horizonsUrl,
  QUANTITY_ANGULAR_DIAMETER,
  QUANTITY_APPARENT_AZIMUTH_ELEVATION,
  QUANTITY_ECLIPTIC_LONGITUDE_LATITUDE,
  QUANTITY_ILLUMINATED_FRACTION,
  QUANTITY_RANGE_RATE,
} from "./ephemeris.constants";

describe("ephemeris.constants", () => {
  describe("horizonsUrl", () => {
    it("should be the JPL Horizons API URL", () => {
      expect(horizonsUrl).toBe("https://ssd.jpl.nasa.gov/api/horizons.api");
    });
  });

  describe("dateRegex", () => {
    it("should match valid date-time strings", () => {
      const validDates = [
        "2024-Mar-21 06:30",
        "2023-Jan-01 00:00",
        "2025-Dec-31 23:59",
        "2024-Feb-29 12:00",
      ];

      validDates.forEach((date) => {
        expect(dateRegex.test(date)).toBe(true);
      });
    });

    it("should capture date-time group", () => {
      const testString = "Some text 2024-Mar-21 06:30 more text";
      const match = testString.match(dateRegex);

      expect(match).toBeDefined();
      expect(match![1]).toBe("2024-Mar-21 06:30");
    });

    it("should not match invalid date formats", () => {
      const invalidDates = [
        "2024-03-21 06:30", // numeric month
        "2024-March-21 06:30", // full month name
        "Mar-21-2024 06:30", // wrong order
        "2024-Mar-21", // missing time
      ];

      invalidDates.forEach((date) => {
        expect(dateRegex.test(date)).toBe(false);
      });
    });
  });

  describe("decimalRegex", () => {
    it("should match valid decimal numbers", () => {
      const validNumbers = [
        "123.456",
        "-123.456",
        "0.001",
        "-0.001",
        "1.0",
        "-999.999",
      ];

      validNumbers.forEach((num) => {
        expect(decimalRegex.test(num)).toBe(true);
      });
    });

    it("should capture decimal number group", () => {
      const testString = "Value is -123.456 degrees";
      const match = testString.match(decimalRegex);

      expect(match).toBeDefined();
      expect(match![1]).toBe("-123.456");
    });

    it("should not match integers without decimal point", () => {
      expect(decimalRegex.test("123")).toBe(false);
      expect(decimalRegex.test("-456")).toBe(false);
    });
  });

  describe("commandIdByPlanet", () => {
    it("should have command IDs for all planets", () => {
      expect(commandIdByPlanet.sun).toBe("10");
      expect(commandIdByPlanet.mercury).toBe("199");
      expect(commandIdByPlanet.venus).toBe("299");
      expect(commandIdByPlanet.moon).toBe("301");
      expect(commandIdByPlanet.mars).toBe("499");
      expect(commandIdByPlanet.jupiter).toBe("599");
      expect(commandIdByPlanet.saturn).toBe("699");
      expect(commandIdByPlanet.uranus).toBe("799");
      expect(commandIdByPlanet.neptune).toBe("899");
      expect(commandIdByPlanet.pluto).toBe("999");
    });

    it("should have exactly 10 planet entries", () => {
      expect(Object.keys(commandIdByPlanet)).toHaveLength(10);
    });
  });

  describe("commandIdByAsteroid", () => {
    it("should have command IDs for asteroids", () => {
      expect(commandIdByAsteroid.chiron).toBe("'DES=20002060;'");
      expect(commandIdByAsteroid.lilith).toBe("'DES=20001181;'");
      expect(commandIdByAsteroid.ceres).toBe("'DES=2000001;'");
      expect(commandIdByAsteroid.pallas).toBe("'DES=2000002;'");
      expect(commandIdByAsteroid.juno).toBe("'DES=20000003;'");
      expect(commandIdByAsteroid.vesta).toBe("'DES=2000004;'");
    });

    it("should have exactly 6 asteroid entries", () => {
      expect(Object.keys(commandIdByAsteroid)).toHaveLength(6);
    });

    it("should format asteroid IDs with DES designations", () => {
      Object.values(commandIdByAsteroid).forEach((id) => {
        expect(id).toMatch(/^'DES=\d+;'$/);
      });
    });
  });

  describe("commandIdByComet", () => {
    it("should have command IDs for comets", () => {
      expect(commandIdByComet.halley).toBe("'DES=20002688;'");
    });

    it("should have exactly 1 comet entry", () => {
      expect(Object.keys(commandIdByComet)).toHaveLength(1);
    });
  });

  describe("commandIdByBody", () => {
    it("should contain all planet command IDs", () => {
      Object.entries(commandIdByPlanet).forEach(([planet, id]) => {
        expect(commandIdByBody[planet as keyof typeof commandIdByPlanet]).toBe(
          id
        );
      });
    });

    it("should contain all asteroid command IDs", () => {
      Object.entries(commandIdByAsteroid).forEach(([asteroid, id]) => {
        expect(
          commandIdByBody[asteroid as keyof typeof commandIdByAsteroid]
        ).toBe(id);
      });
    });

    it("should contain all comet command IDs", () => {
      Object.entries(commandIdByComet).forEach(([comet, id]) => {
        expect(commandIdByBody[comet as keyof typeof commandIdByComet]).toBe(
          id
        );
      });
    });

    it("should have exactly 17 body entries (10 planets + 6 asteroids + 1 comet)", () => {
      expect(Object.keys(commandIdByBody)).toHaveLength(17);
    });
  });

  describe("centerIdByBody", () => {
    it("should have center ID for Earth", () => {
      expect(centerIdByBody.earth).toBe("500@399");
    });

    it("should have center ID for Sun", () => {
      expect(centerIdByBody.sun).toBe("500@10");
    });

    it("should have exactly 2 center entries", () => {
      expect(Object.keys(centerIdByBody)).toHaveLength(2);
    });
  });

  describe("quantity constants", () => {
    it("should have correct quantity code for azimuth/elevation", () => {
      expect(QUANTITY_APPARENT_AZIMUTH_ELEVATION).toBe("4");
    });

    it("should have correct quantity code for illuminated fraction", () => {
      expect(QUANTITY_ILLUMINATED_FRACTION).toBe("10");
    });

    it("should have correct quantity code for angular diameter", () => {
      expect(QUANTITY_ANGULAR_DIAMETER).toBe("13");
    });

    it("should have correct quantity code for range rate", () => {
      expect(QUANTITY_RANGE_RATE).toBe("20");
    });

    it("should have correct quantity code for ecliptic coordinates", () => {
      expect(QUANTITY_ECLIPTIC_LONGITUDE_LATITUDE).toBe("31");
    });

    it("should have all quantity codes as strings", () => {
      expect(typeof QUANTITY_APPARENT_AZIMUTH_ELEVATION).toBe("string");
      expect(typeof QUANTITY_ILLUMINATED_FRACTION).toBe("string");
      expect(typeof QUANTITY_ANGULAR_DIAMETER).toBe("string");
      expect(typeof QUANTITY_RANGE_RATE).toBe("string");
      expect(typeof QUANTITY_ECLIPTIC_LONGITUDE_LATITUDE).toBe("string");
    });
  });
});
