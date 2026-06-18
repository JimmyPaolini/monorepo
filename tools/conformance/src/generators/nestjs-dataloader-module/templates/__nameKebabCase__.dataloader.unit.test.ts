import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { {{namePascalCase}}DataLoader } from "./{{nameKebabCase}}.dataloader";
import { {{namePascalCase}}Service } from "./{{nameKebabCase}}.service";

describe("{{namePascalCase}}DataLoader", () => {
  let dataloader: {{namePascalCase}}DataLoader;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        {{namePascalCase}}DataLoader,
        {
          provide: {{namePascalCase}}Service,
          useValue: {},
        },
      ],
    }).compile();

    dataloader = module.get({{namePascalCase}}DataLoader);
  });

  it("should be defined", () => {
    expect(dataloader).toBeDefined();
  });
});
