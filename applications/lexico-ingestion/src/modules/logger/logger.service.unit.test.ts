import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { LexicoIngestionLogger } from "./logger.service";

describe("LexicoIngestionLogger", () => {
  let service: LexicoIngestionLogger;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [LexicoIngestionLogger],
    }).compile();

    service = module.get(LexicoIngestionLogger);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
