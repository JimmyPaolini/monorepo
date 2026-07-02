import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { ValidatorTypescriptService } from "./validator-typescript.service";

describe(ValidatorTypescriptService, () => {
  let service: ValidatorTypescriptService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [ValidatorTypescriptService],
    }).compile();

    service = await module.resolve(ValidatorTypescriptService);
  });

  it("is defined", () => {
    expect(service).toBeDefined();
  });
});
