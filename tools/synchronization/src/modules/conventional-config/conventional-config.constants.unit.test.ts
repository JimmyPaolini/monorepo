import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { ConventionalConfigConstantsService } from "./conventional-config.constants";

describe(ConventionalConfigConstantsService, () => {
  let service: ConventionalConfigConstantsService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [ConventionalConfigConstantsService],
    }).compile();

    service = await module.resolve(ConventionalConfigConstantsService);
  });

  it("is defined", () => {
    expect(service).toBeDefined();
  });
});
