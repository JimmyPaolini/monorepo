import { Test } from "@nestjs/testing";
import { describe, expect, it } from "vitest";

import { LexicoIngestionCommand } from "./lexico-ingestion.command";

describe("LexicoIngestionCommand", () => {
  it("can be created by the Nest testing module", async () => {
    const module = await Test.createTestingModule({
      providers: [LexicoIngestionCommand],
    }).compile();

    const command = module.get(LexicoIngestionCommand);
    expect(command).toBeDefined();
  });
});
