import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { ValidatorRulesService } from "./validator-rules.service";

describe(ValidatorRulesService, () => {
  let service: ValidatorRulesService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [ValidatorRulesService],
    }).compile();

    service = await module.resolve(ValidatorRulesService);
  });

  it("is defined", () => {
    expect(service).toBeDefined();
  });
});
