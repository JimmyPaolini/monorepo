import {
  Form,
  Lexeme,
  NominalForm,
  Word,
  WordForm,
  WordLexeme,
} from "@monorepo/lexico-entities";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { FormsService } from "./forms.service";

describe("FormsService", () => {
  let service: FormsService;
  let formRepository: any;
  let wordRepository: any;
  let wordFormRepository: any;

  beforeAll(async () => {
    const mockQueryBuilder = {
      insert: vi.fn().mockReturnThis(),
      into: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      orIgnore: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue(undefined),
    };

    const module = await Test.createTestingModule({
      providers: [
        FormsService,
        {
          provide: getRepositoryToken(Form),
          useValue: { find: vi.fn(), remove: vi.fn(), save: vi.fn() },
        },
        {
          provide: getRepositoryToken(Word),
          useValue: { upsert: vi.fn(), find: vi.fn() },
        },
        {
          provide: getRepositoryToken(WordLexeme),
          useValue: {
            createQueryBuilder: vi.fn().mockReturnValue(mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(WordForm),
          useValue: { save: vi.fn() },
        },
      ],
    }).compile();

    service = await module.resolve(FormsService);
    formRepository = module.get(getRepositoryToken(Form));
    wordRepository = module.get(getRepositoryToken(Word));
    wordFormRepository = module.get(getRepositoryToken(WordForm));
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
      newForm.rawWords = ["amō"];

      formRepository.find.mockResolvedValue([existingForm]);
      formRepository.remove.mockResolvedValue(undefined);
      formRepository.save.mockResolvedValue([newForm]);
      wordRepository.upsert.mockResolvedValue(undefined);
      wordRepository.find.mockResolvedValue([]);
      wordFormRepository.save.mockResolvedValue([]);

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
      form.rawWords = ["amō"];

      const savedForm = new NominalForm();
      savedForm.rawWords = ["amō"];

      formRepository.find.mockResolvedValue([]);
      formRepository.save.mockResolvedValue([savedForm]);
      wordRepository.upsert.mockResolvedValue(undefined);
      wordRepository.find.mockResolvedValue([]);
      wordFormRepository.save.mockResolvedValue([]);

      await service.ingestLexemeForms([form], lexeme);

      expect(wordRepository.upsert).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ word: "am\u014D" })]),
        { conflictPaths: ["word"], skipUpdateIfNoValuesChanged: true },
      );
    });

    it("should skip word upsert when no valid normalized words exist", async () => {
      const lexeme = new Lexeme();
      lexeme.id = "lexeme-id";

      const form = new NominalForm();
      form.rawWords = ["123"];

      formRepository.find.mockResolvedValue([]);
      formRepository.save.mockResolvedValue([form]);

      await service.ingestLexemeForms([form], lexeme);

      expect(wordRepository.upsert).not.toHaveBeenCalled();
    });
  });
});
