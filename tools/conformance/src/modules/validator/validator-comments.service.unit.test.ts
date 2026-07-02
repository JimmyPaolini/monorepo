import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { ValidatorCommentsService } from "./validator-comments.service";

describe(ValidatorCommentsService, () => {
  let service: ValidatorCommentsService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [ValidatorCommentsService],
    }).compile();

    service = await module.resolve(ValidatorCommentsService);
  });

  it("is defined", () => {
    expect(service).toBeDefined();
  });
});
