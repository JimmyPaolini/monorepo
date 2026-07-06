import { MathService } from "@caelundas/src/modules/math/math.service";
import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { AspectUtilitiesService } from "./aspects-utilities.service";

describe(AspectUtilitiesService, () => {
  let service: AspectUtilitiesService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [AspectUtilitiesService, MathService],
    }).compile();

    service = await module.resolve(AspectUtilitiesService);
  });

  it("is defined", () => {
    expect(service).toBeDefined();
  });
});
