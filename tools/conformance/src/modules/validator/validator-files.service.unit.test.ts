import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { ValidatorFilesService } from "./validator-files.service";

describe(ValidatorFilesService, () => {
  let service: ValidatorFilesService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [ValidatorFilesService],
    }).compile();

    service = await module.resolve(ValidatorFilesService);
  });

  it("is defined", () => {
    expect(service).toBeDefined();
  });
});
