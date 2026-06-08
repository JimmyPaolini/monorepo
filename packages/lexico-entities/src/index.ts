export { LexicoDatabaseModule } from "./database/lexico-database.module.js";
export { LexicoNamingStrategy } from "./database/lexico-naming-strategy.js";
export { AuditableEntity } from "./entities/Auditable.entity.js";
export { AdjectivalForm } from "./entities/form/AdjectivalForm.entity.js";
export { AdverbForm } from "./entities/form/AdverbForm.entity.js";
export { FiniteVerbForm } from "./entities/form/FiniteVerbForm.entity.js";
export { Form } from "./entities/form/Form.entity.js";
export {
  formCaseValues,
  formDegreeValues,
  formGenderValues,
  formGerundCaseValues,
  formMoodValues,
  formNonFiniteTenseValues,
  formNumberValues,
  formPersonValues,
  formSupineCaseValues,
  formTenseValues,
  formVoiceValues,
} from "./entities/form/Form.entity.js";
export type {
  FormCase,
  FormDegree,
  FormGender,
  FormGerundCase,
  FormMood,
  FormNonFiniteTense,
  FormNumber,
  FormPerson,
  FormSupineCase,
  FormTense,
  FormVoice,
} from "./entities/form/Form.entity.js";
export { GerundForm } from "./entities/form/GerundForm.entity.js";
export { InfinitiveForm } from "./entities/form/InfinitiveForm.entity.js";
export { NominalForm } from "./entities/form/NominalForm.entity.js";
export { ParticipleForm } from "./entities/form/ParticipleForm.entity.js";
export { SupineForm } from "./entities/form/SupineForm.entity.js";
export {
  adjectiveDeclensionValues,
  adjectiveDegreeValues,
  AdjectiveInflection,
} from "./entities/inflection/AdjectiveInflection.entity.js";
export type {
  AdjectiveDeclension,
  AdjectiveDegree,
} from "./entities/inflection/AdjectiveInflection.entity.js";
export {
  adverbDegreeValues,
  AdverbInflection,
  adverbTypeValues,
} from "./entities/inflection/AdverbInflection.entity.js";
export type {
  AdverbDegree,
  AdverbType,
} from "./entities/inflection/AdverbInflection.entity.js";
export { Inflection } from "./entities/inflection/Inflection.entity.js";
export {
  declensionEnumValues,
  nounDeclensionValues,
  nounGenderValues,
  NounInflection,
} from "./entities/inflection/NounInflection.entity.js";
export type {
  NounDeclension,
  NounGender,
} from "./entities/inflection/NounInflection.entity.js";
export {
  prepositionCaseValues,
  PrepositionInflection,
} from "./entities/inflection/PrepositionInflection.entity.js";
export type { PrepositionCase } from "./entities/inflection/PrepositionInflection.entity.js";
export { Uninflected } from "./entities/inflection/Uninflected.entity.js";
export {
  verbConjugationValues,
  VerbInflection,
} from "./entities/inflection/VerbInflection.entity.js";
export type { VerbConjugation } from "./entities/inflection/VerbInflection.entity.js";
export { Lexeme } from "./entities/Lexeme.entity.js";
export type { PartOfSpeech } from "./entities/PartOfSpeech.entity.js";
export { partOfSpeechValues } from "./entities/PartOfSpeech.entity.js";
export { PrincipalPart } from "./entities/PrincipalPart.entity.js";
export {
  Pronunciation,
  pronunciationVariantValues,
} from "./entities/Pronunciation.entity.js";
export type { PronunciationVariant } from "./entities/Pronunciation.entity.js";
export { Translation } from "./entities/Translation.entity.js";
export { Word } from "./entities/Word.entity.js";
export { WordForm } from "./entities/WordForm.entity.js";
export { WordLexeme } from "./entities/WordLexeme.entity.js";
