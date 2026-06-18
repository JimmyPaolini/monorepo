import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { LoggerModule } from "../logger/logger.module";

import { EpigraphikDatenbankClaussSlabyCommand } from "./epigraphik-datenbank-clauss-slaby.command";

describe("EpigraphikDatenbankClaussSlabyCommand", () => {
  let command: EpigraphikDatenbankClaussSlabyCommand;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [EpigraphikDatenbankClaussSlabyCommand],
    }).compile();

    command = module.get(EpigraphikDatenbankClaussSlabyCommand);
  });

  it("should be defined", () => {
    expect(command).toBeDefined();
  });
});
