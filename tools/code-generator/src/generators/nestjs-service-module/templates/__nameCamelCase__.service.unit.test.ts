import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { <%= namePascalCase %>Service } from "./<%= nameCamelCase %>.service";

describe("<%= namePascalCase %>Service", () => {
  let service: <%= namePascalCase %>Service;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [<%= namePascalCase %>Service],
    }).compile();

    service = module.get(<%= namePascalCase %>Service);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
