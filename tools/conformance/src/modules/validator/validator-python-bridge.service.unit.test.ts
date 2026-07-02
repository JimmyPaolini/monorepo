import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { ValidatorPythonBridgeService } from "./validator-python-bridge.service";

describe(ValidatorPythonBridgeService, () => {
  let service: ValidatorPythonBridgeService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [ValidatorPythonBridgeService],
    }).compile();

    service = await module.resolve(ValidatorPythonBridgeService);
  });

  it("is defined", () => {
    expect(service).toBeDefined();
  });
});
