import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { CaelundasService } from "./caelundas.service";

describe("CaelundasService", () => {
  let service: CaelundasService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [CaelundasService],
    }).compile();

    service = await module.resolve(CaelundasService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
