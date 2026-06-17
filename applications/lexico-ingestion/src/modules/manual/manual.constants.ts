/* eslint-disable unicorn/prevent-abbreviations */
// ♟️ Constants
import {
  AdjectivalForm,
  AdjectiveInflection,
  type FormCase,
  type FormGender,
  type FormNumber,
  Lexeme,
  NounInflection,
  PrincipalPart,
  Translation,
  UninflectedInflection,
} from "@monorepo/lexico-entities";

export const MANUAL_LEXEMES_TO_DELETE = [
  { disambiguator: 0, lemma: "qui" },
  { disambiguator: 0, lemma: "quis" },
  { disambiguator: 0, lemma: "latinitas" },
  { disambiguator: 0, lemma: "ille" },
  { disambiguator: 1, lemma: "ille" },
  { disambiguator: 0, lemma: "omnis" },
];

export const PRAENOMEN_ABBREVIATIONS: Record<
  string,
  { feminine?: string; masculine?: string }
> = {
  a: { feminine: "aula", masculine: "aulus" },
  agr: { masculine: "agrippa" },
  ap: { feminine: "appia", masculine: "appius" },
  c: { feminine: "gaia", masculine: "gaius" },
  d: { feminine: "decima", masculine: "decimo" },
  f: { feminine: "fausta", masculine: "faustus" },
  gn: { feminine: "gnaea", masculine: "gnaeus" },
  h: { feminine: "hosta" },
  k: { masculine: "caeso" },
  l: { feminine: "lucia", masculine: "lucius" },
  m: { feminine: "marcia", masculine: "marcus" },
  "m'": { feminine: "mania", masculine: "manius" },
  mai: { feminine: "maio" },
  mam: { feminine: "mamerca", masculine: "mamercus" },
  min: { feminine: "mino" },
  n: { feminine: "numeria", masculine: "numerius" },
  o: { masculine: "octavius" },
  oct: { feminine: "octavia" },
  opet: { masculine: "opiter" },
  p: { masculine: "publius" },
  post: { feminine: "postuma", masculine: "postumus" },
  pro: { feminine: "procula", masculine: "proculus" },
  q: { feminine: "quinta", masculine: "quintus" },
  s: { masculine: "spurius" },
  sec: { feminine: "secunda" },
  seq: { feminine: "secunda" },
  ser: { feminine: "servia", masculine: "servius" },
  sert: { masculine: "sertor" },
  sex: { feminine: "sexta", masculine: "sextus" },
  sp: { feminine: "spuria" },
  st: { feminine: "statia", masculine: "statius" },
  t: { feminine: "titia", masculine: "titus" },
  ti: { feminine: "tiberia", masculine: "tiberius" },
  v: { feminine: "vibia", masculine: "vibius" },
  vol: { feminine: "volusa", masculine: "volesus" },
  vop: { feminine: "vopisca", masculine: "vopiscus" },
};

/**
 * Creates a manual pronoun template for `hic` with predefined declension forms,
 * principal parts, and canonical translations.
 */
export function buildHicTemplate(): Lexeme {
  const lexeme = new Lexeme();
  lexeme.lemma = "hic";

  lexeme.disambiguator = 100;
  lexeme.partOfSpeech = "pronoun";

  const inflection = new AdjectiveInflection();
  inflection.declension = "first/second";
  inflection.degree = "positive";
  lexeme.inflection = inflection;

  lexeme.principalParts = buildGenderedPrincipalParts("hic", "haec", "hoc");

  lexeme.translations = [
    new Translation("he, she, it; ", lexeme),
    new Translation("this (thing); these (things)", lexeme),
  ];

  lexeme.forms = buildAdjectivalForms({
    feminine: {
      ablative: { plural: ["hīs"], singular: ["hāc"] },
      accusative: { plural: ["hās"], singular: ["hanc"] },
      dative: { plural: ["hīs"], singular: ["huic"] },
      genitive: { plural: ["hārum"], singular: ["huius", "hujus"] },
      nominative: { plural: ["hae"], singular: ["haec"] },
    },
    masculine: {
      ablative: { plural: ["hīs"], singular: ["hōc"] },
      accusative: { plural: ["hōs"], singular: ["hunc"] },
      dative: { plural: ["hīs"], singular: ["huic"] },
      genitive: { plural: ["hōrum"], singular: ["huius", "hujus"] },
      nominative: { plural: ["hī"], singular: ["hic"] },
    },
    neuter: {
      ablative: { plural: ["hīs"], singular: ["hōc"] },
      accusative: { plural: ["haec"], singular: ["hoc"] },
      dative: { plural: ["hīs"], singular: ["huic"] },
      genitive: { plural: ["hōrum"], singular: ["huius", "hujus"] },
      nominative: { plural: ["haec"], singular: ["hoc"] },
    },
  });

  return lexeme;
}

/**
 * Creates a manual pronoun template for `ille` with predefined declension forms,
 * principal parts, and canonical translations.
 */
export function buildIlleTemplate(): Lexeme {
  const lexeme = new Lexeme();
  lexeme.lemma = "ille";

  lexeme.disambiguator = 100;
  lexeme.partOfSpeech = "pronoun";

  const inflection = new AdjectiveInflection();
  inflection.declension = "first/second";
  inflection.degree = "positive";
  lexeme.inflection = inflection;

  lexeme.principalParts = buildGenderedPrincipalParts("ille", "illa", "illud");

  lexeme.translations = [
    new Translation("that (thing); those (things)", lexeme),
    new Translation(
      "(Vulgar Latin) he, she, it (third-person personal pronoun)",
      lexeme,
    ),
  ];

  lexeme.forms = buildAdjectivalForms({
    feminine: {
      ablative: { plural: ["illīs"], singular: ["illā"] },
      accusative: { plural: ["illās"], singular: ["illam"] },
      dative: { plural: ["illīs"], singular: ["illī"] },
      genitive: { plural: ["illārum"], singular: ["illīus"] },
      nominative: { plural: ["illae"], singular: ["illa"] },
    },
    masculine: {
      ablative: { plural: ["illīs"], singular: ["illō"] },
      accusative: { plural: ["illōs"], singular: ["illum"] },
      dative: { plural: ["illīs"], singular: ["illī"] },
      genitive: { plural: ["illōrum"], singular: ["illīus"] },
      nominative: { plural: ["illī"], singular: ["ille"] },
    },
    neuter: {
      ablative: { plural: ["illīs"], singular: ["illōc"] },
      accusative: { plural: ["illa"], singular: ["illud"] },
      dative: { plural: ["illīs"], singular: ["illī"] },
      genitive: { plural: ["illōrum"], singular: ["illīus"] },
      nominative: { plural: ["illa"], singular: ["illud"] },
    },
  });

  return lexeme;
}

/**
 * Creates a manual adjective template for `omnis` with third-declension forms
 * and normalized translation text.
 */
export function buildOmnisTemplate(): Lexeme {
  const lexeme = new Lexeme();
  lexeme.lemma = "omnis";

  lexeme.disambiguator = 100;
  lexeme.partOfSpeech = "adjective";

  const inflection = new AdjectiveInflection();
  inflection.declension = "third";
  inflection.degree = "positive";
  lexeme.inflection = inflection;

  lexeme.principalParts = buildGenderedPrincipalParts("omnis", "omnis", "omne");

  lexeme.translations = [new Translation("every (sg), all (pl)", lexeme)];

  lexeme.forms = buildAdjectivalForms({
    feminine: {
      ablative: { plural: ["omnibus"], singular: ["omnī"] },
      accusative: { plural: ["omnēs", "omnīs"], singular: ["omnem"] },
      dative: { plural: ["omnibus"], singular: ["omnī"] },
      genitive: { plural: ["omnium"], singular: ["omnis"] },
      nominative: { plural: ["omnēs"], singular: ["omnis"] },
      vocative: { plural: ["omnēs"], singular: ["omnis"] },
    },
    masculine: {
      ablative: { plural: ["omnibus"], singular: ["omnī"] },
      accusative: { plural: ["omnēs", "omnīs"], singular: ["omnem"] },
      dative: { plural: ["omnibus"], singular: ["omnī"] },
      genitive: { plural: ["omnium"], singular: ["omnis"] },
      nominative: { plural: ["omnēs"], singular: ["omnis"] },
      vocative: { plural: ["omnēs"], singular: ["omnis"] },
    },
    neuter: {
      ablative: { plural: ["omnibus"], singular: ["omnī"] },
      accusative: { plural: ["omnia"], singular: ["omne"] },
      dative: { plural: ["omnibus"], singular: ["omnī"] },
      genitive: { plural: ["omnium"], singular: ["omnis"] },
      nominative: { plural: ["omnia"], singular: ["omne"] },
      vocative: { plural: ["omnia"], singular: ["omne"] },
    },
  });

  return lexeme;
}

/**
 * Creates a reusable noun template used to expand praenomen abbreviations.
 */
export function buildPraenomenAbbreviationTemplate(): Lexeme {
  const lexeme = new Lexeme();
  lexeme.disambiguator = 100;
  lexeme.partOfSpeech = "noun";

  const inflection = new NounInflection();
  inflection.declension = "";
  lexeme.inflection = inflection;

  const ppL = new PrincipalPart();
  ppL.name = "letters";

  const ppP = new PrincipalPart();
  ppP.name = "period";

  lexeme.principalParts = [ppL, ppP];

  return lexeme;
}

/**
 * Creates a reusable numeral template for manual Roman numeral entries.
 */
export function buildRomanNumeralTemplate(): Lexeme {
  const lexeme = new Lexeme();
  lexeme.disambiguator = 100;
  lexeme.partOfSpeech = "numeral";

  const inflection = new UninflectedInflection();
  lexeme.inflection = inflection;

  const pp = new PrincipalPart();
  pp.name = "masculine";

  lexeme.principalParts = [pp];

  return lexeme;
}

function buildAdjectivalForms(
  rawForms: Record<string, Record<string, Record<string, string[]>>>,
): AdjectivalForm[] {
  const forms: AdjectivalForm[] = [];
  for (const gender of Object.keys(rawForms)) {
    const cases = rawForms[gender];
    if (!cases) continue;
    for (const caseName of Object.keys(cases)) {
      const numbers = cases[caseName];
      if (!numbers) continue;
      for (const number of Object.keys(numbers)) {
        if (numbers[number]?.length) {
          const form = new AdjectivalForm();
          form.gender = gender as FormGender; // type-coverage:ignore-line
          form.case = caseName as FormCase; // type-coverage:ignore-line
          form.number = number as FormNumber; // type-coverage:ignore-line
          forms.push(form);
        }
      }
    }
  }
  return forms;
}

function buildGenderedPrincipalParts(
  masculine: string,
  feminine: string,
  neuter: string,
): PrincipalPart[] {
  const ppM = new PrincipalPart();
  ppM.name = "masculine";
  ppM.text = [masculine];

  const ppF = new PrincipalPart();
  ppF.name = "feminine";
  ppF.text = [feminine];

  const ppN = new PrincipalPart();
  ppN.name = "neuter";
  ppN.text = [neuter];

  return [ppM, ppF, ppN];
}
