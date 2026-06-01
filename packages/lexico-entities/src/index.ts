export { AuditableEntity } from "./entities/Auditable.entity.js";
export { Lexeme } from "./entities/Lexeme.entity.js";
export { Translation } from "./entities/Translation.entity.js";
export { Word } from "./entities/Word.entity.js";
export type { PartOfSpeech } from "./entities/PartOfSpeech.js";
export { partOfSpeechValues } from "./entities/PartOfSpeech.js";
export { PrincipalPart } from "./entities/PrincipalPart.entity.js";
export {
  Pronunciation,
  pronunciationVariantValues,
} from "./entities/Pronunciation.entity.js";
export type { PronunciationVariant } from "./entities/Pronunciation.entity.js";
export { Inflection } from "./entities/inflection/Inflection.entity.js";
export {
  AdjectiveInflection,
  adjectiveDeclensionValues,
  adjectiveDegreeValues,
} from "./entities/inflection/AdjectiveInflection.entity.js";
export type {
  AdjectiveDeclension,
  AdjectiveDegree,
} from "./entities/inflection/AdjectiveInflection.entity.js";
export {
  AdverbInflection,
  adverbTypeValues,
  adverbDegreeValues,
} from "./entities/inflection/AdverbInflection.entity.js";
export type {
  AdverbType,
  AdverbDegree,
} from "./entities/inflection/AdverbInflection.entity.js";
export {
  NounInflection,
  nounDeclensionValues,
  nounGenderValues,
  declensionEnumValues,
} from "./entities/inflection/NounInflection.entity.js";
export type {
  NounDeclension,
  NounGender,
} from "./entities/inflection/NounInflection.entity.js";
export {
  PrepositionInflection,
  prepositionCaseValues,
} from "./entities/inflection/PrepositionInflection.entity.js";
export type { PrepositionCase } from "./entities/inflection/PrepositionInflection.entity.js";
export { Uninflected } from "./entities/inflection/Uninflected.entity.js";
export {
  VerbInflection,
  verbConjugationValues,
} from "./entities/inflection/VerbInflection.entity.js";
export type { VerbConjugation } from "./entities/inflection/VerbInflection.entity.js";
export { LexicoDatabaseModule } from "./database/lexico-database.module.js";

// Forms types (pure TypeScript + GraphQL — no TypeORM entity decorators)
export type { Forms as LexemeForms } from "./entities/forms/Forms.entity.js";
export {
  NounForms,
  NounCaseForms,
  NounNumber,
} from "./entities/forms/NounForms.entity.js";
export {
  AdjectiveForms,
  AdjectiveCaseForms,
  AdjectiveNumber,
} from "./entities/forms/AdjectiveForms.entity.js";
export { AdverbForms } from "./entities/forms/AdverbForms.entity.js";
export {
  VerbForms,
  IndicativeVoice,
  IndicativeTense,
  IndicativeNumber,
  IndicativePerson,
  SubjunctiveVoice,
  SubjunctiveTense,
  SubjunctiveNumber,
  SubjunctivePerson,
  ImperativeVoice,
  ImperativeActiveVoice,
  ImperativePassiveVoice,
  ImperativePresent,
  ImperativeActiveFuture,
  ImperativePassiveFuture,
  ImperativeSecond,
  ImperativeSecondThird,
  ImperativeThird,
  NonFiniteVoice,
  NonFiniteInfinitive,
  NonFiniteParticiple,
  NonFinitePresentPerfectFuture,
  NonFinitePresentFuture,
  VerbalNounForms,
  GerundForms,
  SupineForms,
} from "./entities/forms/VerbForms.entity.js";
export { type Forms } from "./entities/forms/Forms.entity.js";
