import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { EntitiesService } from "./entities.service";

describe("EntitiesService", () => {
  let service: EntitiesService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [EntitiesService],
    }).compile();

    service = module.get(EntitiesService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
