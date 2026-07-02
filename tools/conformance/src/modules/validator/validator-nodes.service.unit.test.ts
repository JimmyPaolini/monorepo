import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { ValidatorNodesService } from "./validator-nodes.service";

describe(ValidatorNodesService, () => {
  let service: ValidatorNodesService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [ValidatorNodesService],
    }).compile();

    service = await module.resolve(ValidatorNodesService);
  });

  it("is defined", () => {
    expect(service).toBeDefined();
  });
});
