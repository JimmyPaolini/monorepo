import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { ValidatorWorkspaceService } from "./validator-workspace.service";

describe(ValidatorWorkspaceService, () => {
  let service: ValidatorWorkspaceService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [ValidatorWorkspaceService],
    }).compile();

    service = await module.resolve(ValidatorWorkspaceService);
  });

  it("is defined", () => {
    expect(service).toBeDefined();
  });
});
