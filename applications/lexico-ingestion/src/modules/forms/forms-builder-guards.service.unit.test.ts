import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { FormsBuilderGuardsService } from "./forms-builder-guards.service";

describe("FormsBuilderGuardsService", () => {
  let service: FormsBuilderGuardsService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [FormsBuilderGuardsService],
    }).compile();

    service = await module.resolve(FormsBuilderGuardsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should identify valid part of speech values", () => {
    expect(service.isPartOfSpeech("verb")).toBe(true);
    expect(service.isPartOfSpeech("not-a-part-of-speech")).toBe(false);
  });

  it("should identify record and string array values", () => {
    expect(service.isRecord({ value: 1 })).toBe(true);
    expect(service.isRecord(["a"])).toBe(false);
    expect(service.isStringArray(["amo", "amas"])).toBe(true);
    expect(service.isStringArray(["amo", 1])).toBe(false);
  });
});
