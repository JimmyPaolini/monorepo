import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { GeneratorTemplateService } from "./generator-template.service";

describe(GeneratorTemplateService, () => {
  let service: GeneratorTemplateService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [GeneratorTemplateService],
    }).compile();

    service = await module.resolve(GeneratorTemplateService);
  });

  it("is defined", () => {
    expect(service).toBeDefined();
  });
});
