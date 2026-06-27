import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { ConventionalConfigIoService } from "./conventional-config-io.service";

describe(ConventionalConfigIoService, () => {
  let service: ConventionalConfigIoService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [ConventionalConfigIoService],
    }).compile();

    service = await module.resolve(ConventionalConfigIoService);
  });

  it("is defined", () => {
    expect(service).toBeDefined();
  });
});
