import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { EtymologyService } from "./etymology.service";

describe("EtymologyService", () => {
  let service: EtymologyService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [EtymologyService],
    }).compile();

    service = module.get(EtymologyService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
