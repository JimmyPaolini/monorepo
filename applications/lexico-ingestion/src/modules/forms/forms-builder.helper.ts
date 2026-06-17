import {
  AdjectivalForm,
  AdverbForm,
  FiniteVerbForm,
  type Form,
  formCaseValues,
  formGerundCaseValues,
  type FormMood,
  formMoodValues,
  formNonFiniteTenseValues,
  formNumberValues,
  formPersonValues,
  formSupineCaseValues,
  type FormTense,
  formVoiceValues,
  GerundForm,
  InfinitiveForm,
  type Lexeme,
  NominalForm,
  ParticipleForm,
  type PartOfSpeech,
  SupineForm,
} from "@monorepo/lexico-entities";

// 🛠️ Helpers

/**
 * Helper service for building Form entities from raw parsed form data.
 *
 * Isolates form-building logic from database operations and maintains
 * immutability of input data during transformation.
 */
export class FormsBuilderHelper {
  // 🔐 Private Fields

  constructor(
    private readonly setTransientWords: (form: Form, words: string[]) => void,
  ) {}

  private readonly adjectivalFormsPosList = new Set<PartOfSpeech>([
    "adjective",
    "numeral",
    "participle",
    "suffix",
  ]);

  private readonly noFormsPosList = new Set<PartOfSpeech>([
    "abbreviation",
    "circumfix",
    "conjunction",
    "idiom",
    "inflection",
    "interfix",
    "interjection",
    "particle",
    "phrase",
    "prefix",
    "preposition",
    "proverb",
  ]);

  // 🏗 Constructor

  private readonly nominalFormsPosList = new Set<PartOfSpeech>([
    "determiner",
    "noun",
    "pronoun",
    "properNoun",
  ]);

  // 🔑 Public Methods

  private buildAdjectivalCaseForms(
    caseMap: Record<string, unknown>,
    formGender: "feminine" | "masculine" | "neuter",
    lexeme: Lexeme,
  ): Form[] {
    const forms: Form[] = [];

    for (const caseKey of Object.keys(caseMap)) {
      const formCase = formCaseValues.find((v) => v === caseKey);
      if (!formCase) continue;

      const numberMap = caseMap[caseKey];
      if (!isRecord(numberMap)) continue;

      forms.push(
        ...this.buildAdjectivalNumberForms({
          formCase,
          formGender,
          lexeme,
          numberMap,
        }),
      );
    }

    return forms;
  }

  // 🔏 Private Methods

  private buildAdjectivalForms(rawForms: unknown, lexeme: Lexeme): Form[] {
    const forms: Form[] = [];
    if (!isRecord(rawForms)) return forms;

    for (const genderKey of Object.keys(rawForms)) {
      const formGender = (["feminine", "masculine", "neuter"] as const).find(
        (v) => v === genderKey,
      );
      if (!formGender) continue;

      const caseMap = rawForms[genderKey];
      if (!isRecord(caseMap)) continue;

      forms.push(...this.buildAdjectivalCaseForms(caseMap, formGender, lexeme));
    }

    return forms;
  }

  private buildAdjectivalNumberForms(args: {
    formCase: (typeof formCaseValues)[number];
    formGender: "feminine" | "masculine" | "neuter";
    lexeme: Lexeme;
    numberMap: Record<string, unknown>;
  }): Form[] {
    const { formCase, formGender, lexeme, numberMap } = args;
    const forms: Form[] = [];

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

    return forms;
  }

  private buildAdverbForms(rawForms: unknown, lexeme: Lexeme): Form[] {
    const forms: Form[] = [];
    if (!isRecord(rawForms)) return forms;

    const words = rawForms["forms"];
    if (!isStringArray(words) || words.length === 0) return forms;

    const form = new AdverbForm();
    form.lexeme = lexeme;
    this.setTransientWords(form, words);
    forms.push(form);

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

      forms.push(
        ...this.buildFiniteTenseForms({
          lexeme,
          mood,
          voiceData,
          voiceKey,
        }),
      );
    }

    return forms;
  }

  private buildFiniteNumberForms(args: {
    lexeme: Lexeme;
    mood: FormMood;
    tenseData: Record<string, unknown>;
    tenseKey: FormTense;
    voiceKey: (typeof formVoiceValues)[number];
  }): Form[] {
    const { lexeme, mood, tenseData, tenseKey, voiceKey } = args;
    const forms: Form[] = [];
    for (const numberKey of formNumberValues) {
      const numberData = tenseData[numberKey];
      if (!isRecord(numberData)) continue;

      forms.push(
        ...this.buildFinitePersonForms({
          lexeme,
          mood,
          numberData,
          numberKey,
          tenseKey,
          voiceKey,
        }),
      );
    }
    return forms;
  }

  private buildFinitePersonForms(args: {
    lexeme: Lexeme;
    mood: FormMood;
    numberData: Record<string, unknown>;
    numberKey: (typeof formNumberValues)[number];
    tenseKey: FormTense;
    voiceKey: (typeof formVoiceValues)[number];
  }): Form[] {
    const { lexeme, mood, numberData, numberKey, tenseKey, voiceKey } = args;
    const forms: Form[] = [];
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
    return forms;
  }

  private buildFiniteTenseForms(args: {
    lexeme: Lexeme;
    mood: FormMood;
    voiceData: Record<string, unknown>;
    voiceKey: (typeof formVoiceValues)[number];
  }): Form[] {
    const { lexeme, mood, voiceData, voiceKey } = args;
    const forms: Form[] = [];
    for (const tenseKey of formNonFiniteTenseValues) {
      const tenseData = voiceData[tenseKey];
      if (!isRecord(tenseData)) continue;

      forms.push(
        ...this.buildFiniteNumberForms({
          lexeme,
          mood,
          tenseData,
          tenseKey,
          voiceKey,
        }),
      );
    }
    return forms;
  }

  private buildGerundForms(
    gerundData: Record<string, unknown>,
    lexeme: Lexeme,
  ): Form[] {
    const forms: Form[] = [];
    for (const caseKey of formGerundCaseValues) {
      const words = gerundData[caseKey];
      if (!isStringArray(words) || words.length === 0) continue;

      const form = new GerundForm();
      form.lexeme = lexeme;
      form.case = caseKey;
      this.setTransientWords(form, words);
      forms.push(form);
    }

    return forms;
  }

  private buildInfinitiveForms(
    infinitiveData: Record<string, unknown>,
    lexeme: Lexeme,
  ): Form[] {
    const forms: Form[] = [];

    for (const tenseKey of formNonFiniteTenseValues) {
      const words = infinitiveData[tenseKey];
      if (!isStringArray(words) || words.length === 0) continue;

      const form = new InfinitiveForm();
      form.lexeme = lexeme;
      form.tense = tenseKey;
      this.setTransientWords(form, words);
      forms.push(form);
    }

    return forms;
  }

  private buildNominalForms(rawForms: unknown, lexeme: Lexeme): Form[] {
    const forms: Form[] = [];
    if (!isRecord(rawForms)) return forms;

    for (const caseKey of Object.keys(rawForms)) {
      const formCase = formCaseValues.find((v) => v === caseKey);
      if (!formCase) continue;

      const numberMap = rawForms[caseKey];
      if (!isRecord(numberMap)) continue;

      forms.push(
        ...this.buildNominalNumberForms({ formCase, lexeme, numberMap }),
      );
    }

    return forms;
  }

  private buildNominalNumberForms(args: {
    formCase: (typeof formCaseValues)[number];
    lexeme: Lexeme;
    numberMap: Record<string, unknown>;
  }): Form[] {
    const { formCase, lexeme, numberMap } = args;
    const forms: Form[] = [];

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

    return forms;
  }

  private buildNonFiniteForms(
    nonFiniteData: Record<string, unknown>,
    lexeme: Lexeme,
  ): Form[] {
    const forms: Form[] = [];

    const infinitive = nonFiniteData["infinitive"];
    if (isRecord(infinitive)) {
      forms.push(...this.buildInfinitiveForms(infinitive, lexeme));
    }

    const participle = nonFiniteData["participle"];
    if (isRecord(participle)) {
      forms.push(...this.buildParticipleForms(participle, lexeme));
    }

    return forms;
  }

  private buildParticipleForms(
    participleData: Record<string, unknown>,
    lexeme: Lexeme,
  ): Form[] {
    const forms: Form[] = [];

    for (const tenseKey of formNonFiniteTenseValues) {
      const tenseData = participleData[tenseKey];
      if (!isRecord(tenseData)) continue;

      for (const genderKey of Object.keys(tenseData)) {
        const formGender = (["feminine", "masculine", "neuter"] as const).find(
          (v) => v === genderKey,
        );
        if (!formGender) continue;

        const caseMap = tenseData[genderKey];
        if (!isRecord(caseMap)) continue;

        forms.push(
          ...this.buildAdjectivalCaseForms(caseMap, formGender, lexeme),
        );

        for (const form of forms) {
          if (form instanceof ParticipleForm) {
            form.tense = tenseKey;
          }
        }
      }
    }

    return forms;
  }

  private buildSupineForms(
    supineData: Record<string, unknown>,
    lexeme: Lexeme,
  ): Form[] {
    const forms: Form[] = [];
    for (const caseKey of formSupineCaseValues) {
      const words = supineData[caseKey];
      if (!isStringArray(words) || words.length === 0) continue;

      const form = new SupineForm();
      form.lexeme = lexeme;
      form.case = caseKey;
      this.setTransientWords(form, words);
      forms.push(form);
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
      forms.push(...this.buildGerundForms(gerundData, lexeme));
    }

    const supineData = verbalNouns["supine"];
    if (isRecord(supineData)) {
      forms.push(...this.buildSupineForms(supineData, lexeme));
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

  /**
   * Builds Form entities from the raw parsed forms object for a given POS.
   * Returns an empty array when rawForms is null or the POS has no form table.
   */
  buildForms(pos: PartOfSpeech, rawForms: unknown, lexeme: Lexeme): Form[] {
    if (!rawForms) return [];
    if (this.noFormsPosList.has(pos)) return [];

    if (this.adjectivalFormsPosList.has(pos)) {
      return this.buildAdjectivalForms(rawForms, lexeme);
    }

    if (pos === "adverb") {
      return this.buildAdverbForms(rawForms, lexeme);
    }

    if (this.nominalFormsPosList.has(pos)) {
      return this.buildNominalForms(rawForms, lexeme);
    }

    if (pos === "verb") {
      return this.buildVerbForms(rawForms, lexeme);
    }

    return [];
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    (value as unknown[]).every((v: unknown) => typeof v === "string")
  );
}
