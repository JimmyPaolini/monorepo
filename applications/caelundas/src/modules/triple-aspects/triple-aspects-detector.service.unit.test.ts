import { LoggerService } from "@caelundas/src/modules/logger/logger.service";
import { createMock } from "@golevelup/ts-vitest";
import { Test } from "@nestjs/testing";
import moment from "moment-timezone";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { TripleAspectsComposerService } from "./triple-aspects-composer.service";
import { TripleAspectsDetectorService } from "./triple-aspects-detector.service";

import type { AspectBodies } from "@caelundas/src/modules/aspects/aspects.service";

describe("TripleAspectsDetectorService", () => {
  let service: TripleAspectsDetectorService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TripleAspectsDetectorService,
        TripleAspectsComposerService,
        { provide: LoggerService, useValue: createMock<LoggerService>() },
      ],
    }).compile();

    service = module.get(TripleAspectsDetectorService);
    void module.get(LoggerService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("groupAspectsByType", () => {
    it("groups edges by aspect type", () => {
      const edges: AspectBodies[] = [
        { aspect: "conjunct", bodies: ["sun", "moon"] },
        { aspect: "trine", bodies: ["mars", "jupiter"] },
        { aspect: "conjunct", bodies: ["venus", "saturn"] },
      ];

      const grouped = TripleAspectsDetectorService.groupAspectsByType(edges);

      expect(grouped.size).toBe(2);
      expect(grouped.get("conjunct")?.length).toBe(2);
      expect(grouped.get("trine")?.length).toBe(1);
    });
  });

  describe("composeTSquares", () => {
    it("detects forming T-Square", () => {
      const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
      const currentAspectBodies: AspectBodies[] = [
        { aspect: "opposite", bodies: ["sun", "moon"] },
        { aspect: "square", bodies: ["sun", "mars"] },
        { aspect: "square", bodies: ["moon", "mars"] },
      ];

      const events = service.composeTSquares({
        currentAspectBodies,
        minute: currentMinute,
        previousAspectBodies: [],
      });

      expect(events.length).toBeGreaterThanOrEqual(1);
      expect(events[0]?.categories).toContain("T Square");
      expect(events[0]?.categories).toContain("Forming");
    });
  });

  describe("composeYods", () => {
    it("detects forming Yod", () => {
      const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
      const currentAspectBodies: AspectBodies[] = [
        { aspect: "sextile", bodies: ["sun", "moon"] },
        { aspect: "quincunx", bodies: ["sun", "venus"] },
        { aspect: "quincunx", bodies: ["moon", "venus"] },
      ];

      const events = service.composeYods({
        currentAspectBodies,
        minute: currentMinute,
        previousAspectBodies: [],
      });

      expect(events.length).toBeGreaterThanOrEqual(1);
      expect(events[0]?.categories).toContain("Yod");
      expect(events[0]?.categories).toContain("Forming");
    });
  });

  describe("composeGrandTrines", () => {
    it("detects forming Grand Trine", () => {
      const currentMinute = moment.utc("2024-03-21T12:00:00.000Z");
      const currentAspectBodies: AspectBodies[] = [
        { aspect: "trine", bodies: ["sun", "moon"] },
        { aspect: "trine", bodies: ["sun", "mars"] },
        { aspect: "trine", bodies: ["moon", "mars"] },
      ];

      const events = service.composeGrandTrines({
        currentAspectBodies,
        minute: currentMinute,
        previousAspectBodies: [],
      });

      expect(events.length).toBeGreaterThanOrEqual(1);
      expect(events[0]?.categories).toContain("Grand Trine");
      expect(events[0]?.categories).toContain("Forming");
    });
  });
});
