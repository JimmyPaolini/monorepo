import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { EtymologyService } from "./etymology.service.js";

describe("EtymologyService", () => {
  let service: EtymologyService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [EtymologyService],
    }).compile();

    service = await module.resolve(EtymologyService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
