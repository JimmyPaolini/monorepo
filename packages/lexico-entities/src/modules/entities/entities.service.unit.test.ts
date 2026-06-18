import { beforeAll, describe, expect, it } from "vitest";

import { EntitiesService } from "./entities.service";

describe("EntitiesService", () => {
  let service: EntitiesService;

  beforeAll(() => {
    service = new EntitiesService();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
