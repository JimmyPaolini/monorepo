import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { ClearService } from "./clear.service";

describe("ClearService", () => {
  let service: ClearService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [ClearService],
    }).compile();

    service = module.get(ClearService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
