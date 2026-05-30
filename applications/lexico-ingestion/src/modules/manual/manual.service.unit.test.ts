import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { ManualService } from "./manual.service";

describe("ManualService", () => {
  let service: ManualService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [ManualService],
    }).compile();

    service = module.get(ManualService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
