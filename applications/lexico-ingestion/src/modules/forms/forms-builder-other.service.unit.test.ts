import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { Lexeme } from "@monorepo/lexico-entities";

import { FormsBuilderGuardsProvider } from "./forms-builder-guards.service";
import { FormsBuilderHelper } from "./forms-builder-other.service";
import { FormsBuilderVerbProvider } from "./forms-builder-verb.service";
import { FormsTransientWordsService } from "./forms-transient-words.service";

describe("FormsBuilderHelper", () => {
  let service: FormsBuilderHelper;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        FormsBuilderHelper,
        FormsBuilderGuardsProvider,
        FormsBuilderVerbProvider,
        FormsTransientWordsService,
      ],
    }).compile();

    service = await module.resolve(FormsBuilderHelper);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should return empty array for unsupported part of speech", () => {
    const forms = service.buildFormsForPartOfSpeech(
      "preposition",
      { forms: ["ad"] },
      new Lexeme(),
    );

    expect(forms).toEqual([]);
  });

  it("should build adverb forms for adverb part of speech", () => {
    const forms = service.buildFormsForPartOfSpeech(
      "adverb",
      { forms: ["bene"] },
      new Lexeme(),
    );

    expect(forms.length).toBeGreaterThan(0);
  });
});
