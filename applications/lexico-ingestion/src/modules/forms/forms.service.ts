import {
  AdjectivalForm,
  AdverbForm,
  FiniteVerbForm,
  Form,
  formCaseValues,
  formDegreeValues,
  formGerundCaseValues,
  type FormMood,
  formMoodValues,
  formNonFiniteTenseValues,
  formNumberValues,
  formPersonValues,
  formSupineCaseValues,
  formTenseValues,
  formVoiceValues,
  GerundForm,
  InfinitiveForm,
  type Lexeme,
  NominalForm,
  ParticipleForm,
  type PartOfSpeech,
  SupineForm,
} from "@monorepo/lexico-entities";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { WordsService } from "../words/words.service";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    (value as unknown[]).every((v: unknown) => typeof v === "string")
  );
}

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
  ) {}

  // 🔐 Private Fields
  private readonly transientWords = new WeakMap<Form, string[]>();

  // 🔑 Public Fields

  // 🔏 Private Methods

  /**
   * Sets transient word strings for a Form instance. These are used during
   * ingestion to link forms to their corresponding Word rows but are not
   * persisted on the Form entity itself.
   */
  setTransientWords(form: Form, words: string[]): void {
    this.transientWords.set(form, words);
  }

  private async fetchExistingForms(lexemeId: string): Promise<Form[]> {
    return this.formRepository.find({
      where: { lexeme: { id: lexemeId } },
    });
  }

  private async saveNewForms(forms: Form[], lexeme: Lexeme): Promise<Form[]> {
    for (const form of forms) {
      form.lexeme = lexeme;
    }
    return this.formRepository.save(forms);
  }

  private buildNormalizedWordMap(
    savedForms: Form[],
    rawWordsPerForm: string[][],
  ): Map<string, Set<Form>> {
    const formsByWord = new Map<string, Set<Form>>();
    for (const [i, savedForm] of savedForms.entries()) {
      const rawWords = rawWordsPerForm[i];
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

  private buildNominalForms(rawForms: unknown, lexeme: Lexeme): Form[] {
    const forms: Form[] = [];
    if (!isRecord(rawForms)) return forms;

    for (const caseKey of Object.keys(rawForms)) {
      const formCase = formCaseValues.find((v) => v === caseKey);
      if (!formCase) continue;

      const numberMap = rawForms[caseKey];
      if (!isRecord(numberMap)) continue;

      for (const numberKey of Object.keys(numberMap)) {
        const formNumber = formNumberValues.find((v) => v === numberKey);
        if (!formNumber) continue;

        const words = numberMap[numberKey];
        if (!isStringArray(words) || words.length === 0) continue;

        const form = new NominalForm();
        form.lexeme = lexeme;
        form.case = formCase;
        form.number = formNumber;
        this.setTransientWords(form, words);
        forms.push(form);
      }
    }

    return forms;
  }

  private buildAdjectivalForms(rawForms: unknown, lexeme: Lexeme): Form[] {
    const forms: Form[] = [];
    if (!isRecord(rawForms)) return forms;

    const genderValues = ["masculine", "feminine", "neuter"] as const;

    for (const genderKey of Object.keys(rawForms)) {
      const formGender = genderValues.find((v) => v === genderKey);
      if (!formGender) continue;

      const caseMap = rawForms[genderKey];
      if (!isRecord(caseMap)) continue;

      for (const caseKey of Object.keys(caseMap)) {
        const formCase = formCaseValues.find((v) => v === caseKey);
        if (!formCase) continue;

        const numberMap = caseMap[caseKey];
        if (!isRecord(numberMap)) continue;

        for (const numberKey of Object.keys(numberMap)) {
          const formNumber = formNumberValues.find((v) => v === numberKey);
          if (!formNumber) continue;

          const words = numberMap[numberKey];
          if (!isStringArray(words) || words.length === 0) continue;

          const form = new AdjectivalForm();
          form.lexeme = lexeme;
          form.gender = formGender;
          form.case = formCase;
          form.number = formNumber;
          this.setTransientWords(form, words);
          forms.push(form);
        }
      }
    }

    return forms;
  }

  private buildAdverbForms(rawForms: unknown, lexeme: Lexeme): Form[] {
    const forms: Form[] = [];
    if (!isRecord(rawForms)) return forms;

    for (const degreeKey of formDegreeValues) {
      const words = rawForms[degreeKey];
      if (!isStringArray(words) || words.length === 0) continue;

      const form = new AdverbForm();
      form.lexeme = lexeme;
      form.degree = degreeKey;
      this.setTransientWords(form, words);
      forms.push(form);
    }

    return forms;
  }

  private buildVerbForms(rawForms: unknown, lexeme: Lexeme): Form[] {
    const forms: Form[] = [];
    if (!isRecord(rawForms)) return forms;

    for (const moodKey of formMoodValues) {
      const moodData = rawForms[moodKey];
      if (!isRecord(moodData)) continue;
      forms.push(...this.buildFiniteMoodForms(moodData, moodKey, lexeme));
    }

    const nonFinite = rawForms["nonFinite"];
    if (isRecord(nonFinite)) {
      forms.push(...this.buildNonFiniteForms(nonFinite, lexeme));
    }

    const verbalNouns = rawForms["verbalNouns"];
    if (isRecord(verbalNouns)) {
      forms.push(...this.buildVerbalNounForms(verbalNouns, lexeme));
    }

    return forms;
  }

  private buildFiniteMoodForms(
    moodData: Record<string, unknown>,
    mood: FormMood,
    lexeme: Lexeme,
  ): Form[] {
    const forms: Form[] = [];

    for (const voiceKey of formVoiceValues) {
      const voiceData = moodData[voiceKey];
      if (!isRecord(voiceData)) continue;

      for (const tenseKey of formTenseValues) {
        const tenseData = voiceData[tenseKey];
        if (!isRecord(tenseData)) continue;

        for (const numberKey of formNumberValues) {
          const numberData = tenseData[numberKey];
          if (!isRecord(numberData)) continue;

          for (const personKey of formPersonValues) {
            const words = numberData[personKey];
            if (!isStringArray(words) || words.length === 0) continue;

            const form = new FiniteVerbForm();
            form.lexeme = lexeme;
            form.mood = mood;
            form.voice = voiceKey;
            form.tense = tenseKey;
            form.number = numberKey;
            form.person = personKey;
            this.setTransientWords(form, words);
            forms.push(form);
          }
        }
      }
    }

    return forms;
  }

  private buildNonFiniteForms(
    nonFinite: Record<string, unknown>,
    lexeme: Lexeme,
  ): Form[] {
    const forms: Form[] = [];

    const infinitiveData = nonFinite["infinitive"];
    if (isRecord(infinitiveData)) {
      for (const voiceKey of formVoiceValues) {
        const voiceData = infinitiveData[voiceKey];
        if (!isRecord(voiceData)) continue;

        for (const tenseKey of formNonFiniteTenseValues) {
          const words = voiceData[tenseKey];
          if (!isStringArray(words) || words.length === 0) continue;

          const form = new InfinitiveForm();
          form.lexeme = lexeme;
          form.voice = voiceKey;
          form.tense = tenseKey;
          this.setTransientWords(form, words);
          forms.push(form);
        }
      }
    }

    const participleData = nonFinite["participle"];
    if (isRecord(participleData)) {
      for (const voiceKey of formVoiceValues) {
        const voiceData = participleData[voiceKey];
        if (!isRecord(voiceData)) continue;

        for (const tenseKey of formNonFiniteTenseValues) {
          const words = voiceData[tenseKey];
          if (!isStringArray(words) || words.length === 0) continue;

          const form = new ParticipleForm();
          form.lexeme = lexeme;
          form.voice = voiceKey;
          form.tense = tenseKey;
          this.setTransientWords(form, words);
          forms.push(form);
        }
      }
    }

    return forms;
  }

  private buildVerbalNounForms(
    verbalNouns: Record<string, unknown>,
    lexeme: Lexeme,
  ): Form[] {
    const forms: Form[] = [];

    const gerundData = verbalNouns["gerund"];
    if (isRecord(gerundData)) {
      for (const caseKey of formGerundCaseValues) {
        const words = gerundData[caseKey];
        if (!isStringArray(words) || words.length === 0) continue;

        const form = new GerundForm();
        form.lexeme = lexeme;
        form.case = caseKey;
        this.setTransientWords(form, words);
        forms.push(form);
      }
    }

    const supineData = verbalNouns["supine"];
    if (isRecord(supineData)) {
      for (const caseKey of formSupineCaseValues) {
        const words = supineData[caseKey];
        if (!isStringArray(words) || words.length === 0) continue;

        const form = new SupineForm();
        form.lexeme = lexeme;
        form.case = caseKey;
        this.setTransientWords(form, words);
        forms.push(form);
      }
    }

    return forms;
  }

  // 🌎 Public Methods

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
    // Query + Write: remove stale forms for idempotency (WordForms cascade-delete via FK).
    const existingForms = await this.fetchExistingForms(lexeme.id);

    // Attempt to match new forms to existing forms to preserve IDs
    for (const form of forms) {
      const matchIndex = existingForms.findIndex((ef) => {
        if (ef.constructor.name !== form.constructor.name) return false;
        const keys = Object.keys(form).filter(
          (k) => !["id", "createdAt", "updatedAt", "lexeme"].includes(k),
        );
        return keys.every((k) => Reflect.get(ef, k) === Reflect.get(form, k));
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

    if (existingForms.length > 0)
      await this.formRepository.remove(existingForms);

    // Capture rawWords before save — transient field is not persisted.
    const rawWordsPerForm = forms.map((f) => this.transientWords.get(f) ?? []);

    // Write
    const savedForms = await this.saveNewForms(forms, lexeme);

    // Build
    const formsByWord = this.buildNormalizedWordMap(
      savedForms,
      rawWordsPerForm,
    );
    if (formsByWord.size === 0) return;

    // Write Words and Junctions
    await this.wordsService.upsertWordsAndJunctions(formsByWord, lexeme);
  }

  /**
   * Builds Form entities from the raw parsed forms object for a given POS.
   * Returns an empty array when rawForms is null or the POS has no form table.
   */
  buildForms(pos: PartOfSpeech, rawForms: unknown, lexeme: Lexeme): Form[] {
    if (!rawForms) return [];

    switch (pos) {
      case "noun":
      case "properNoun":
      case "pronoun":
      case "determiner": {
        return this.buildNominalForms(rawForms, lexeme);
      }
      case "adjective":
      case "participle":
      case "numeral":
      case "suffix": {
        return this.buildAdjectivalForms(rawForms, lexeme);
      }
      case "adverb": {
        return this.buildAdverbForms(rawForms, lexeme);
      }
      case "verb": {
        return this.buildVerbForms(rawForms, lexeme);
      }
      case "preposition":
      case "conjunction":
      case "abbreviation":
      case "particle":
      case "interjection":
      case "prefix":
      case "interfix":
      case "circumfix":
      case "inflection":
      case "phrase":
      case "proverb":
      case "idiom": {
        return [];
      }
    }
  }
}
