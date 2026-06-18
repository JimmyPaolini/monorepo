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

  const guardsProvider = new FormsBuilderGuardsService();

  it("should be defined", () => {
    expect(guardsProvider).toBeDefined();
  });

  it("should identify valid part of speech values", () => {
    expect(guardsProvider.isPartOfSpeech("verb")).toBe(true);
    expect(guardsProvider.isPartOfSpeech("not-a-part-of-speech")).toBe(false);
  });

  it("should identify record and string array values", () => {
    expect(guardsProvider.isRecord({ value: 1 })).toBe(true);
    expect(guardsProvider.isRecord(["a"])).toBe(false);
    expect(guardsProvider.isStringArray(["amo", "amas"])).toBe(true);
    expect(guardsProvider.isStringArray(["amo", 1])).toBe(false);
  });
});
