import {
  symbolByBody,
  symbolByMajorAspect,
} from "@caelundas/src/modules/caelundas/caelundas.symbol-constants";
import { Test } from "@nestjs/testing";
import moment from "moment-timezone";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { SimpleAspectsEventService } from "./simple-aspects-event.service";

describe(SimpleAspectsEventService, () => {
  let service: SimpleAspectsEventService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [SimpleAspectsEventService],
    }).compile();

    service = await module.resolve(SimpleAspectsEventService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("is defined", () => {
    expect(service).toBeDefined();
  });

  it("should assemble a simple aspect event", () => {
    const log = vi.fn();
    const timestamp = moment.utc("2024-03-21T12:00:00.000Z");

    const event = service.assembleSimpleAspectEvent({
      aspectCategory: "Major Aspect",
      aspectName: "conjunct",
      aspectSymbol: symbolByMajorAspect.conjunct,
      body1: "sun",
      body2: "moon",
      log,
      phase: "perfective",
      timestamp,
    });

    expect(event.categories).toContain("Simple Aspect");
    expect(event.categories).toContain("Major Aspect");
    expect(event.summary).toContain(symbolByBody.sun);
    expect(event.summary).toContain(symbolByBody.moon);
    expect(event.description).toContain("perfective");
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining("perfective conjunct"),
    );
  });

  it("should find the first matching aspect", () => {
    const aspect = service.findFirstMatchingAspect({
      aspects: ["conjunct", "opposite"],
      isMatchingAspect: (value) => value === "opposite",
    });

    expect(aspect).toBe("opposite");
  });
});
