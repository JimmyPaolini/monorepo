import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { {{namePascal}}Service } from "./{{nameCamel}}.service";

describe("{{namePascal}}Service", () => {
  let service: {{namePascal}}Service;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [{{namePascal}}Service],
    }).compile();

    service = module.get({{namePascal}}Service);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
