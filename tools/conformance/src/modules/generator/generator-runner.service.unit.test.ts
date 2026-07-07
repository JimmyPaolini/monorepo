import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { GeneratorRunnerService } from "./generator-runner.service";

describe(GeneratorRunnerService, () => {
  let service: GeneratorRunnerService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [GeneratorRunnerService],
    }).compile();

    service = await module.resolve(GeneratorRunnerService);
  });

  it("is defined", () => {
    expect(service).toBeDefined();
  });
});
