import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import {
  Form,
  type Lexeme,
  type PartOfSpeech,
} from "@monorepo/lexico-entities";

import { WordsService } from "../words/words.service";

import { FormsBuilderHelper } from "./forms-builder.helper.js";

/**
 * Builds Form entities from raw parsed forms and persists them along with
 * the associated Word and junction rows.
 * Transient word strings are tracked via a WeakMap during the ingestion lifecycle.
 */
@Injectable()
export class FormsService {
  // 🏗 Dependency Injection

  constructor(
    @InjectRepository(Form)
    private readonly formRepository: Repository<Form>,
    private readonly wordsService: WordsService,
  ) {
    this.formsBuilder = new FormsBuilderHelper((form, words) => {
      this.transientWords.set(form, words);
    });
  }

  private readonly formsBuilder: FormsBuilderHelper;

  // 🔐 Private Fields

  private readonly transientWords = new WeakMap<Form, string[]>();

  // 🌎 Public Methods

  private buildNormalizedWordMap(
    savedForms: Form[],
    rawWordsPerForm: string[][],
  ): Map<string, Set<Form>> {
    const formsByWord = new Map<string, Set<Form>>();
    for (const [index, savedForm] of savedForms.entries()) {
      const rawWords = rawWordsPerForm[index];
      if (!rawWords) continue;

      for (const wordString of rawWords) {
        const normalized = wordString
          .normalize("NFD")
          .replaceAll(/[\u0300-\u036F]/gu, "")
          .trim();
        if (!/^-?[A-Za-z]/.test(normalized)) continue;

        const existing = formsByWord.get(normalized) ?? new Set<Form>();
        existing.add(savedForm);
        formsByWord.set(normalized, existing);
      }
    }
    return formsByWord;
  }

  private async fetchExistingForms(lexemeId: string): Promise<Form[]> {
    return this.formRepository.find({
      where: { lexeme: { id: lexemeId } },
    });
  }

  private matchAndPreserveExistingForms(
    forms: Form[],
    existingForms: Form[],
  ): void {
    for (const form of forms) {
      const matchIndex = existingForms.findIndex((ef) => {
        if (ef.constructor.name !== form.constructor.name) return false;
        const keys = Object.keys(form).filter(
          (index) =>
            !["createdAt", "id", "lexeme", "updatedAt"].includes(index),
        );
        return keys.every(
          (index) => Reflect.get(ef, index) === Reflect.get(form, index),
        );
      });

      if (matchIndex !== -1) {
        const [match] = existingForms.splice(matchIndex, 1);
        if (match) {
          form.id = match.id;
          form.createdAt = match.createdAt;
          form.updatedAt = match.updatedAt;
        }
      }
    }
  }

  private async saveNewForms(forms: Form[], lexeme: Lexeme): Promise<Form[]> {
    for (const form of forms) {
      form.lexeme = lexeme;
    }
    return this.formRepository.save(forms);
  }

  /**
   * Builds Form entities from the raw parsed forms object for a given POS.
   * Returns an empty array when rawForms is null or the POS has no form table.
   */
  buildForms(pos: PartOfSpeech, rawForms: unknown, lexeme: Lexeme): Form[] {
    return this.formsBuilder.buildForms(pos, rawForms, lexeme);
  }

  /**
   * Saves Form entities for a Lexeme, then upserts Word rows and creates
   * explicit WordLexeme and WordForm junction records.
   *
   * Deletes any Forms previously associated with this Lexeme for idempotency —
   * the `onDelete: "CASCADE"` on WordForm.form means their WordForm rows are
   * removed by the database automatically. Matches new forms with existing
   * forms by properties to preserve IDs and avoid database churn.
   *
   * Uses batched DB operations: one upsert for all Word rows, one reload to
   * collect their IDs, then two bulk inserts for the junction rows.
   */
  async ingestLexemeForms(forms: Form[], lexeme: Lexeme): Promise<void> {
    const existingForms = await this.fetchExistingForms(lexeme.id);

    this.matchAndPreserveExistingForms(forms, existingForms);

    if (existingForms.length > 0) {
      await this.formRepository.remove(existingForms);
    }

    const rawWordsPerForm = forms.map((f) => this.transientWords.get(f) ?? []);

    const savedForms = await this.saveNewForms(forms, lexeme);

    const formsByWord = this.buildNormalizedWordMap(
      savedForms,
      rawWordsPerForm,
    );

    if (formsByWord.size > 0) {
      await this.wordsService.upsertWordsAndJunctions(formsByWord, lexeme);
    }
  }

  /**
   * Sets transient word strings for a Form instance. These are used during
   * ingestion to link forms to their corresponding Word rows but are not
   * persisted on the Form entity itself.
   */
  setTransientWords(form: Form, words: string[]): void {
    this.transientWords.set(form, words);
  }
}
