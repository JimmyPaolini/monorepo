import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { Form } from "@monorepo/lexico-entities";

import { FormsTransientWordsService } from "./forms-transient-words.service";

describe("FormsTransientWordsService", () => {
  let service: FormsTransientWordsService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [FormsTransientWordsService],
    }).compile();

    service = module.get(FormsTransientWordsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should return empty words when none were set", () => {
    const form = new Form();

    expect(service.getTransientWords(form)).toEqual([]);
  });

  it("should store and retrieve transient words for a form", () => {
    const form = new Form();

    service.setTransientWords(form, ["amo", "amas"]);

    expect(service.getTransientWords(form)).toEqual(["amo", "amas"]);
  });
});
