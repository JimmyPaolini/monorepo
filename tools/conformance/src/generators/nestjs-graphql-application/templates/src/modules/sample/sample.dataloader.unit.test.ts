import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { SampleDataLoader } from "./sample.dataloader";
import { SampleService } from "./sample.service";

describe("SampleDataLoader", () => {
  let dataloader: SampleDataLoader;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SampleDataLoader,
        {
          provide: SampleService,
          useValue: {},
        },
      ],
    }).compile();

    dataloader = await module.resolve(SampleDataLoader);
  });

  it("should be defined", () => {
    expect(dataloader).toBeDefined();
  });
});
