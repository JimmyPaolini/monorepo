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
  Uninflected,
} from "@monorepo/lexico-entities";

export const MANUAL_LEXEMES_TO_DELETE = [
  { lemma: "qui", disambiguator: 0 },
  { lemma: "quis", disambiguator: 0 },
  { lemma: "latinitas", disambiguator: 0 },
  { lemma: "ille", disambiguator: 0 },
  { lemma: "ille", disambiguator: 1 },
  { lemma: "omnis", disambiguator: 0 },
];

export const PRAENOMEN_ABBREVIATIONS: Record<
  string,
  { masculine?: string; feminine?: string }
> = {
  a: { masculine: "aulus", feminine: "aula" },
  agr: { masculine: "agrippa" },
  ap: { masculine: "appius", feminine: "appia" },
  d: { masculine: "decimo", feminine: "decima" },
  f: { masculine: "faustus", feminine: "fausta" },
  c: { masculine: "gaius", feminine: "gaia" },
  gn: { masculine: "gnaeus", feminine: "gnaea" },
  h: { feminine: "hosta" },
  k: { masculine: "caeso" },
  l: { masculine: "lucius", feminine: "lucia" },
  m: { masculine: "marcus", feminine: "marcia" },
  "m'": { masculine: "manius", feminine: "mania" },
  mai: { feminine: "maio" },
  mam: { masculine: "mamercus", feminine: "mamerca" },
  min: { feminine: "mino" },
  n: { masculine: "numerius", feminine: "numeria" },
  o: { masculine: "octavius" },
  oct: { feminine: "octavia" },
  opet: { masculine: "opiter" },
  post: { masculine: "postumus", feminine: "postuma" },
  p: { masculine: "publius" },
  pro: { masculine: "proculus", feminine: "procula" },
  q: { masculine: "quintus", feminine: "quinta" },
  s: { masculine: "spurius" },
  sp: { feminine: "spuria" },
  st: { masculine: "statius", feminine: "statia" },
  sec: { feminine: "secunda" },
  seq: { feminine: "secunda" },
  ser: { masculine: "servius", feminine: "servia" },
  sert: { masculine: "sertor" },
  sex: { masculine: "sextus", feminine: "sexta" },
  t: { masculine: "titus", feminine: "titia" },
  ti: { masculine: "tiberius", feminine: "tiberia" },
  v: { masculine: "vibius", feminine: "vibia" },
  vol: { masculine: "volesus", feminine: "volusa" },
  vop: { masculine: "vopiscus", feminine: "vopisca" },
};

function buildAdjectivalForms(
  rawForms: Record<string, Record<string, Record<string, string[]>>>,
): AdjectivalForm[] {
  const forms: AdjectivalForm[] = [];
  for (const [gender, cases] of Object.entries(rawForms)) {
    for (const [caseName, numbers] of Object.entries(cases)) {
      for (const [number, rawWords] of Object.entries(numbers)) {
        if (rawWords.length > 0) {
          const form = new AdjectivalForm();
          form.gender = gender as FormGender;
          form.case = caseName as FormCase;
          form.number = number as FormNumber;
          form.rawWords = rawWords;
          forms.push(form);
        }
      }
    }
  }
  return forms;
}

/**
 *
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

  const ppM = new PrincipalPart();
  ppM.name = "masculine";
  ppM.text = ["hic"];

  const ppF = new PrincipalPart();
  ppF.name = "feminine";
  ppF.text = ["haec"];

  const ppN = new PrincipalPart();
  ppN.name = "neuter";
  ppN.text = ["hoc"];

  lexeme.principalParts = [ppM, ppF, ppN];

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
 *
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

  const ppM = new PrincipalPart();
  ppM.name = "masculine";
  ppM.text = ["ille"];

  const ppF = new PrincipalPart();
  ppF.name = "feminine";
  ppF.text = ["illa"];

  const ppN = new PrincipalPart();
  ppN.name = "neuter";
  ppN.text = ["illud"];

  lexeme.principalParts = [ppM, ppF, ppN];

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
 *
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

  const ppM = new PrincipalPart();
  ppM.name = "masculine";
  ppM.text = ["omnis"];

  const ppF = new PrincipalPart();
  ppF.name = "feminine";
  ppF.text = ["omnis"];

  const ppN = new PrincipalPart();
  ppN.name = "neuter";
  ppN.text = ["omne"];

  lexeme.principalParts = [ppM, ppF, ppN];

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
 *
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
 *
 */
export function buildRomanNumeralTemplate(): Lexeme {
  const lexeme = new Lexeme();
  lexeme.disambiguator = 100;
  lexeme.partOfSpeech = "numeral";

  const inflection = new Uninflected();
  lexeme.inflection = inflection;

  const pp = new PrincipalPart();
  pp.name = "masculine";

  lexeme.principalParts = [pp];

  return lexeme;
}
