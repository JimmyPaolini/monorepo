import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { WiktionaryService } from "./wiktionary.service";

describe("WiktionaryService", () => {
  let service: WiktionaryService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [WiktionaryService],
    }).compile();

    service = module.get(WiktionaryService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
