import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { LoggerModule } from "../logger/logger.module";

import { LatinLibraryCommand } from "./latin-library.command";

describe("LatinLibraryCommand", () => {
  let command: LatinLibraryCommand;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [LatinLibraryCommand],
    }).compile();

    command = module.get(LatinLibraryCommand);
  });

  it("should be defined", () => {
    expect(command).toBeDefined();
  });
});
