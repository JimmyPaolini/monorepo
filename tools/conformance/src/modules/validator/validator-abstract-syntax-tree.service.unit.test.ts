import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { ValidatorAbstractSyntaxTreeService } from "./validator-abstract-syntax-tree.service";

describe(ValidatorAbstractSyntaxTreeService, () => {
  let service: ValidatorAbstractSyntaxTreeService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [ValidatorAbstractSyntaxTreeService],
    }).compile();

    service = await module.resolve(ValidatorAbstractSyntaxTreeService);
  });

  it("is defined", () => {
    expect(service).toBeDefined();
  });
});
