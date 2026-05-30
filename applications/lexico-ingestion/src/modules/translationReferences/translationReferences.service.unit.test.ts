import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { TranslationReferencesService } from "./translationReferences.service";

describe("TranslationReferencesService", () => {
  let service: TranslationReferencesService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [TranslationReferencesService],
    }).compile();

    service = module.get(TranslationReferencesService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
