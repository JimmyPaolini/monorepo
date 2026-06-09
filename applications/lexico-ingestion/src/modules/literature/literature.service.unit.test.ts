import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { LiteratureService } from "./literature.service";

describe("LiteratureService", () => {
  let service: LiteratureService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [LiteratureService],
    }).compile();

    service = await module.resolve(LiteratureService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
