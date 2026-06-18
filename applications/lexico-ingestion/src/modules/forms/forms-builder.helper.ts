import {
  AdjectivalForm,
  AdverbForm,
  FiniteVerbForm,
  type Form,
  formCaseValues,
  formGerundCaseValues,
  type FormMood,
  formMoodValues,
  type FormNonFiniteTense,
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
    private readonly assignTransientWords: (
      form: Form,
      words: string[],
    ) => void,
  ) {}

  private readonly adjectivalPartOfSpeechSet = new Set<PartOfSpeech>([
    "adjective",
    "numeral",
    "participle",
    "suffix",
  ]);

  private readonly nominalPartOfSpeechSet = new Set<PartOfSpeech>([
    "determiner",
    "noun",
    "pronoun",
    "properNoun",
  ]);

  private readonly unsupportedPartOfSpeechSet = new Set<PartOfSpeech>([
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

  // 🔑 Public Methods

  /**
   * Builds structured data used during form entity building.
   */
  private buildAdjectivalCaseForms(
    caseMap: Record<string, unknown>,
    formGender: "feminine" | "masculine" | "neuter",
    lexeme: Lexeme,
  ): Form[] {
    const forms: Form[] = [];

    for (const caseKey of Object.keys(caseMap)) {
      if (!isFormCase(caseKey)) continue;

      const numberMap = caseMap[caseKey];
      if (!isRecord(numberMap)) continue;

      forms.push(
        ...this.buildAdjectivalNumberForms({
          formCase: caseKey,
          formGender,
          lexeme,
          numberMap,
        }),
      );
    }

    return forms;
  }

  // 🔏 Private Methods

  /**
   * Builds structured data used during form entity building.
   */
  private buildAdjectivalFormsFromRaw(
    rawForms: unknown,
    lexeme: Lexeme,
  ): Form[] {
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

  /**
   * Builds structured data used during form entity building.
   */
  private buildAdjectivalNumberForms(args: {
    formCase: (typeof formCaseValues)[number];
    formGender: "feminine" | "masculine" | "neuter";
    lexeme: Lexeme;
    numberMap: Record<string, unknown>;
  }): Form[] {
    const { formCase, formGender, lexeme, numberMap } = args;
    const forms: Form[] = [];

    for (const numberKey of Object.keys(numberMap)) {
      if (!isFormNumber(numberKey)) continue;

      const words = numberMap[numberKey];
      if (!isStringArray(words) || words.length === 0) continue;

      const form = new AdjectivalForm();
      form.lexeme = lexeme;
      form.gender = formGender;
      form.case = formCase;
      form.number = numberKey;
      this.assignTransientWords(form, words);
      forms.push(form);
    }

    return forms;
  }

  /**
   * Builds structured data used during form entity building.
   */
  private buildAdverbFormsFromRaw(rawForms: unknown, lexeme: Lexeme): Form[] {
    const forms: Form[] = [];
    if (!isRecord(rawForms)) return forms;

    const words = rawForms["forms"];
    if (!isStringArray(words) || words.length === 0) return forms;

    const form = new AdverbForm();
    form.lexeme = lexeme;
    this.assignTransientWords(form, words);
    forms.push(form);

    return forms;
  }

  /**
   * Builds structured data used during form entity building.
   */
  private buildFiniteMoodForms(
    moodData: Record<string, unknown>,
    mood: FormMood,
    lexeme: Lexeme,
  ): Form[] {
    const forms: Form[] = [];

    for (const voiceKey of Object.keys(moodData)) {
      if (!isFormVoice(voiceKey)) continue;
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

  /**
   * Builds structured data used during form entity building.
   */
  private buildFiniteNumberForms(args: {
    lexeme: Lexeme;
    mood: FormMood;
    tenseData: Record<string, unknown>;
    tenseKey: string;
    voiceKey: string;
  }): Form[] {
    const forms: Form[] = [];
    for (const numberKey of Object.keys(args.tenseData)) {
      if (!isFormNumber(numberKey)) continue;
      const numberData = args.tenseData[numberKey];
      if (!isRecord(numberData)) continue;

      forms.push(
        ...this.buildFinitePersonForms({
          lexeme: args.lexeme,
          mood: args.mood,
          numberData,
          numberKey,
          tenseKey: args.tenseKey,
          voiceKey: args.voiceKey,
        }),
      );
    }
    return forms;
  }

  /**
   * Builds structured data used during form entity building.
   */
  private buildFinitePersonForms(args: {
    lexeme: Lexeme;
    mood: FormMood;
    numberData: Record<string, unknown>;
    numberKey: string;
    tenseKey: string;
    voiceKey: string;
  }): Form[] {
    const forms: Form[] = [];
    for (const personKey of Object.keys(args.numberData)) {
      if (!isFormPerson(personKey)) continue;
      const words = args.numberData[personKey];
      if (!isStringArray(words) || words.length === 0) continue;
      if (!isFormNumber(args.numberKey)) continue;
      if (!isFormTense(args.tenseKey)) continue;
      if (!isFormVoice(args.voiceKey)) continue;

      const form = new FiniteVerbForm();
      form.lexeme = args.lexeme;
      form.mood = args.mood;
      form.voice = args.voiceKey;
      form.tense = args.tenseKey;
      form.number = args.numberKey;
      form.person = personKey;
      this.assignTransientWords(form, words);
      forms.push(form);
    }
    return forms;
  }

  /**
   * Builds structured data used during form entity building.
   */
  private buildFiniteTenseForms(args: {
    lexeme: Lexeme;
    mood: FormMood;
    voiceData: Record<string, unknown>;
    voiceKey: string;
  }): Form[] {
    const forms: Form[] = [];
    for (const tenseKey of Object.keys(args.voiceData)) {
      if (!isFormTense(tenseKey)) continue;
      const tenseData = args.voiceData[tenseKey];
      if (!isRecord(tenseData)) continue;

      forms.push(
        ...this.buildFiniteNumberForms({
          lexeme: args.lexeme,
          mood: args.mood,
          tenseData,
          tenseKey,
          voiceKey: args.voiceKey,
        }),
      );
    }
    return forms;
  }

  /**
   * Builds structured data used during form entity building.
   */
  private buildGerundForms(
    gerundData: Record<string, unknown>,
    lexeme: Lexeme,
  ): Form[] {
    const forms: Form[] = [];
    for (const caseKey of Object.keys(gerundData)) {
      if (!isGerundCase(caseKey)) continue;
      const words = gerundData[caseKey];
      if (!isStringArray(words) || words.length === 0) continue;

      const form = new GerundForm();
      form.lexeme = lexeme;
      form.case = caseKey;
      this.assignTransientWords(form, words);
      forms.push(form);
    }

    return forms;
  }

  /**
   * Builds structured data used during form entity building.
   */
  private buildInfinitiveForms(
    infinitiveData: Record<string, unknown>,
    lexeme: Lexeme,
  ): Form[] {
    const forms: Form[] = [];

    for (const tenseKey of Object.keys(infinitiveData)) {
      if (!isFormNonFiniteTense(tenseKey)) continue;
      const words = infinitiveData[tenseKey];
      if (!isStringArray(words) || words.length === 0) continue;

      const form = new InfinitiveForm();
      form.lexeme = lexeme;
      form.tense = tenseKey;
      this.assignTransientWords(form, words);
      forms.push(form);
    }

    return forms;
  }

  /**
   * Builds structured data used during form entity building.
   */
  private buildNominalFormsFromRaw(rawForms: unknown, lexeme: Lexeme): Form[] {
    const forms: Form[] = [];
    if (!isRecord(rawForms)) return forms;

    for (const caseKey of Object.keys(rawForms)) {
      if (!isFormCase(caseKey)) continue;

      const numberMap = rawForms[caseKey];
      if (!isRecord(numberMap)) continue;

      forms.push(
        ...this.buildNominalNumberForms({
          formCase: caseKey,
          lexeme,
          numberMap,
        }),
      );
    }

    return forms;
  }

  /**
   * Builds structured data used during form entity building.
   */
  private buildNominalNumberForms(args: {
    formCase: (typeof formCaseValues)[number];
    lexeme: Lexeme;
    numberMap: Record<string, unknown>;
  }): Form[] {
    const { formCase, lexeme, numberMap } = args;
    const forms: Form[] = [];

    for (const numberKey of Object.keys(numberMap)) {
      if (!isFormNumber(numberKey)) continue;

      const words = numberMap[numberKey];
      if (!isStringArray(words) || words.length === 0) continue;

      const form = new NominalForm();
      form.lexeme = lexeme;
      form.case = formCase;
      form.number = numberKey;
      this.assignTransientWords(form, words);
      forms.push(form);
    }

    return forms;
  }

  /**
   * Builds structured data used during form entity building.
   */
  private buildParticipleFormsFromRaw(
    participleData: Record<string, unknown>,
    lexeme: Lexeme,
  ): Form[] {
    const forms: Form[] = [];

    for (const tenseKey of Object.keys(participleData)) {
      if (!isFormNonFiniteTense(tenseKey)) continue;
      const tenseData = participleData[tenseKey];
      if (!isRecord(tenseData)) continue;

      for (const genderKey of Object.keys(tenseData)) {
        if (!isFormGender(genderKey)) continue;

        const caseMap = tenseData[genderKey];
        if (!isRecord(caseMap)) continue;

        forms.push(
          ...this.buildAdjectivalCaseForms(caseMap, genderKey, lexeme),
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

  /**
   * Builds structured data used during form entity building.
   */
  private buildSupineForms(
    supineData: Record<string, unknown>,
    lexeme: Lexeme,
  ): Form[] {
    const forms: Form[] = [];
    for (const caseKey of Object.keys(supineData)) {
      if (!isSupineCase(caseKey)) continue;
      const words = supineData[caseKey];
      if (!isStringArray(words) || words.length === 0) continue;

      const form = new SupineForm();
      form.lexeme = lexeme;
      form.case = caseKey;
      this.assignTransientWords(form, words);
      forms.push(form);
    }

    return forms;
  }

  /**
   * Builds structured data used during form entity building.
   */
  private buildVerbFormsFromRaw(rawForms: unknown, lexeme: Lexeme): Form[] {
    const forms: Form[] = [];
    if (!isRecord(rawForms)) return forms;

    for (const moodKey of Object.keys(rawForms)) {
      if (!isFormMood(moodKey)) continue;
      const moodData = rawForms[moodKey];
      if (!isRecord(moodData)) continue;
      forms.push(...this.buildFiniteMoodForms(moodData, moodKey, lexeme));
    }

    const nonFinite = rawForms["nonFinite"];
    if (isRecord(nonFinite)) {
      forms.push(...this.buildVerbNonFiniteForms(nonFinite, lexeme));
    }

    const verbalNouns = rawForms["verbalNouns"];
    if (isRecord(verbalNouns)) {
      forms.push(...this.buildVerbNounForms(verbalNouns, lexeme));
    }

    return forms;
  }

  /**
   * Builds structured data used during form entity building.
   */
  private buildVerbNonFiniteForms(
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
      forms.push(...this.buildParticipleFormsFromRaw(participle, lexeme));
    }

    return forms;
  }

  /**
   * Builds structured data used during form entity building.
   */
  private buildVerbNounForms(
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

  /**
   * Builds Form entities from the raw parsed forms object for a given POS.
   * Returns an empty array when rawForms is null or the POS has no form table.
   */
  buildFormsForPartOfSpeech(
    pos: PartOfSpeech,
    rawForms: unknown,
    lexeme: Lexeme,
  ): Form[] {
    if (!rawForms) return [];
    if (this.unsupportedPartOfSpeechSet.has(pos)) return [];

    if (this.adjectivalPartOfSpeechSet.has(pos)) {
      return this.buildAdjectivalFormsFromRaw(rawForms, lexeme);
    }

    if (pos === "adverb") {
      return this.buildAdverbFormsFromRaw(rawForms, lexeme);
    }

    if (this.nominalPartOfSpeechSet.has(pos)) {
      return this.buildNominalFormsFromRaw(rawForms, lexeme);
    }

    if (pos === "verb") {
      return this.buildVerbFormsFromRaw(rawForms, lexeme);
    }

    return [];
  }
}

/**
 * Narrows a string to a supported grammatical case value.
 */
function isFormCase(value: string): value is (typeof formCaseValues)[number] {
  return formCaseValueList.includes(value);
}

/**
 * Narrows a string to one of the canonical grammatical gender values.
 */
function isFormGender(
  value: string,
): value is "feminine" | "masculine" | "neuter" {
  return value === "feminine" || value === "masculine" || value === "neuter";
}

/**
 * Narrows a string to a supported finite mood value.
 */
function isFormMood(value: string): value is FormMood {
  return formMoodValueList.includes(value);
}

/**
 * Narrows a string to a supported non-finite tense value.
 */
function isFormNonFiniteTense(value: string): value is FormNonFiniteTense {
  return formNonFiniteTenseValueList.includes(value);
}

/**
 * Narrows a string to a supported grammatical number value.
 */
function isFormNumber(
  value: string,
): value is (typeof formNumberValues)[number] {
  return formNumberValueList.includes(value);
}

/**
 * Narrows a string to a supported grammatical person value.
 */
function isFormPerson(
  value: string,
): value is (typeof formPersonValues)[number] {
  return formPersonValueList.includes(value);
}

/**
 * Narrows a string to a supported finite tense value.
 */
function isFormTense(value: string): value is FormTense {
  return formTenseValueList.includes(value);
}

/**
 * Narrows a string to a supported voice value.
 */
function isFormVoice(value: string): value is (typeof formVoiceValues)[number] {
  return formVoiceValueList.includes(value);
}

/**
 * Narrows a string to a supported gerund case value.
 */
function isGerundCase(
  value: string,
): value is (typeof formGerundCaseValues)[number] {
  return formGerundCaseValueList.includes(value);
}

/**
 * Guards unknown values as plain object records.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Guards unknown values as arrays containing only strings.
 */
function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    (value as unknown[]).every((v: unknown) => typeof v === "string")
  );
}

/**
 * Narrows a string to a supported supine case value.
 */
function isSupineCase(
  value: string,
): value is (typeof formSupineCaseValues)[number] {
  return formSupineCaseValueList.includes(value);
}

/**
 * Normalizes mixed arrays to string-only arrays used by type guards.
 */
function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string");
}

const formCaseValueList = normalizeStringArray(formCaseValues);
const formGerundCaseValueList = normalizeStringArray(formGerundCaseValues);
const formMoodValueList = normalizeStringArray(formMoodValues);
const formNumberValueList = normalizeStringArray(formNumberValues);
const formPersonValueList = normalizeStringArray(formPersonValues);
const formSupineCaseValueList = normalizeStringArray(formSupineCaseValues);
const formTenseValueList = normalizeStringArray(formNonFiniteTenseValues);
const formNonFiniteTenseValueList = normalizeStringArray(
  formNonFiniteTenseValues,
);
const formVoiceValueList = normalizeStringArray(formVoiceValues);
