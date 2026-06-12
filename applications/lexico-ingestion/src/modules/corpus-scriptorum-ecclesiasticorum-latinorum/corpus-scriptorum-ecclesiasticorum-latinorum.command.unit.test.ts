import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { LoggerModule } from "../logger/logger.module";

import { CorpusScriptorumEcclesiasticorumLatinorumCommand } from "./corpus-scriptorum-ecclesiasticorum-latinorum.command";

describe("CorpusScriptorumEcclesiasticorumLatinorumCommand", () => {
  let command: CorpusScriptorumEcclesiasticorumLatinorumCommand;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [CorpusScriptorumEcclesiasticorumLatinorumCommand],
    }).compile();

    command = await module.resolve(
      CorpusScriptorumEcclesiasticorumLatinorumCommand,
    );
  });

  it("should be defined", () => {
    expect(command).toBeDefined();
  });
});
