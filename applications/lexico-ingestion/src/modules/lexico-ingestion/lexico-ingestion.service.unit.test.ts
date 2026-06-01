import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { LexicoIngestionService } from "./lexico-ingestion.service";

describe("LexicoIngestionService", () => {
  let service: LexicoIngestionService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [LexicoIngestionService],
    }).compile();
    service = module.get(LexicoIngestionService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
