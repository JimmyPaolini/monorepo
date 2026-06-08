import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { SampleDataLoader } from "./sample.dataloader";
import { SampleResolver } from "./sample.resolver";
import { SampleService } from "./sample.service";

describe("SampleResolver", () => {
  let resolver: SampleResolver;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [SampleDataLoader, SampleResolver, SampleService],
    }).compile();

    resolver = await module.resolve(SampleResolver);
  });

  it("should be defined", () => {
    expect(resolver).toBeDefined();
  });
});
