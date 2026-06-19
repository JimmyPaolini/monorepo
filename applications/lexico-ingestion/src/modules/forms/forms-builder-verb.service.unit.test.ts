import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { Lexeme } from "@monorepo/lexico-entities";

import { FormsBuilderGuardsProvider } from "./forms-builder-guards.service";
import { FormsBuilderVerbService } from "./forms-builder-verb.service";
import { FormsTransientWordsService } from "./forms-transient-words.service";

describe("FormsBuilderVerbService", () => {
  let service: FormsBuilderVerbService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        FormsBuilderVerbService,
        FormsBuilderGuardsProvider,
        FormsTransientWordsService,
      ],
    }).compile();

    service = await module.resolve(FormsBuilderVerbService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should build finite person forms from valid person data", () => {
    const forms = service.buildFinitePersonForms({
      lexeme: new Lexeme(),
      mood: "indicative",
      number: "singular",
      numberData: {
        first: ["amo"],
        invalid: ["x"],
      },
      tense: "present",
      voice: "active",
    });

    expect(forms).toHaveLength(1);
  });
});
