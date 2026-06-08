import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { SampleService } from "./sample.service";

describe("SampleService", () => {
  let service: SampleService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [SampleService],
    }).compile();

    service = await module.resolve(SampleService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
