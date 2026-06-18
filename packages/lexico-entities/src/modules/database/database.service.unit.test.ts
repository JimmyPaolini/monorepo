import { beforeAll, describe, expect, it } from "vitest";

import { DatabaseService } from "./database.service";

describe("DatabaseService", () => {
  let service: DatabaseService;

  beforeAll(() => {
    service = new DatabaseService();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
