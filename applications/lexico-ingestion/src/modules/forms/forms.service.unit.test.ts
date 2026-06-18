import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  type Mocked,
  vi,
} from "vitest";

import { Form, Lexeme, NominalForm, WordForm } from "@monorepo/lexico-entities";

import { WordsService } from "../words/words.service";

import { FormsBuilderHelper } from "./forms-builder-other.service";
import { FormsTransientWordsService } from "./forms-transient-words.service";
import { FormsService } from "./forms.service";

import type { Repository } from "typeorm";

describe("FormsService", () => {
  let service: FormsService;
  let formRepository: Mocked<Repository<Form>>;
  let wordFormRepository: Mocked<Repository<WordForm>>;
  let wordsService: Mocked<WordsService>;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        FormsService,
        {
          provide: getRepositoryToken(Form),
          useValue: { find: vi.fn(), remove: vi.fn(), save: vi.fn() },
        },
        {
          provide: getRepositoryToken(WordForm),
          useValue: { save: vi.fn() },
        },
        {
          provide: WordsService,
          useValue: {
            upsertWordsAndJunctions: vi.fn().mockResolvedValue(new Map()),
          },
        },
        {
          provide: FormsBuilderHelper,
          useValue: { buildFormsForPartOfSpeech: vi.fn() },
        },
        FormsTransientWordsService,
      ],
    }).compile();

    service = module.get(FormsService);
    formRepository = module.get(getRepositoryToken(Form));
    wordFormRepository = module.get(getRepositoryToken(WordForm));
    wordsService = module.get(WordsService);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("ingestLexemeForms", () => {
    it("should remove existing forms and save new ones", async () => {
      const lexeme = new Lexeme();
      lexeme.id = "lexeme-id";

      const existingForm = new Form();
      const newForm = new NominalForm();
      service.setTransientWords(newForm, ["amō"]);

      formRepository.find.mockResolvedValue([existingForm]);
      formRepository.remove.mockResolvedValue(undefined as unknown as Form);
      formRepository.save.mockResolvedValue([newForm] as unknown as Form);
      wordsService.upsertWordsAndJunctions.mockResolvedValue(undefined);
      wordFormRepository.save.mockResolvedValue([] as unknown as WordForm);

      await service.ingestLexemeForms([newForm], lexeme);

      expect(formRepository.find).toHaveBeenCalledWith({
        where: { lexeme: { id: "lexeme-id" } },
      });
      expect(formRepository.remove).toHaveBeenCalledWith([existingForm]);
      expect(formRepository.save).toHaveBeenCalled();
    });

    it("should upsert word records for normalized raw words", async () => {
      const lexeme = new Lexeme();
      lexeme.id = "lexeme-id";

      const form = new NominalForm();
      service.setTransientWords(form, ["amō"]);

      const savedForm = new NominalForm();
      service.setTransientWords(savedForm, ["amō"]);

      formRepository.find.mockResolvedValue([]);
      formRepository.save.mockResolvedValue([savedForm] as unknown as Form);
      wordsService.upsertWordsAndJunctions.mockResolvedValue(undefined);
      wordFormRepository.save.mockResolvedValue([] as unknown as WordForm);

      await service.ingestLexemeForms([form], lexeme);

      expect(wordsService.upsertWordsAndJunctions).toHaveBeenCalledWith(
        expect.any(Map),
        lexeme,
      );
    });

    it("should skip word upsert when no valid normalized words exist", async () => {
      const lexeme = new Lexeme();
      lexeme.id = "lexeme-id";

      const form = new NominalForm();
      service.setTransientWords(form, ["123"]);

      formRepository.find.mockResolvedValue([]);
      formRepository.save.mockResolvedValue([form] as unknown as Form);

      await service.ingestLexemeForms([form], lexeme);

      expect(wordsService.upsertWordsAndJunctions).not.toHaveBeenCalled();
    });
  });
});
