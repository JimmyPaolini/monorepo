export { AuditableEntity } from "./entities/Auditable.entity.js";
export { Lexeme } from "./entities/Lexeme.entity.js";
export { Translation } from "./entities/Translation.entity.js";
export { Word } from "./entities/Word.entity.js";
export { WordForm } from "./entities/WordForm.entity.js";
export { WordLexeme } from "./entities/WordLexeme.entity.js";
export type { PartOfSpeech } from "./entities/PartOfSpeech.entity.js";
export { partOfSpeechValues } from "./entities/PartOfSpeech.entity.js";
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
export { LexicoNamingStrategy } from "./database/lexico-naming-strategy.js";
export { Form } from "./entities/form/Form.entity.js";
export { NominalForm } from "./entities/form/NominalForm.entity.js";
export { AdjectivalForm } from "./entities/form/AdjectivalForm.entity.js";
export { AdverbForm } from "./entities/form/AdverbForm.entity.js";
export { FiniteVerbForm } from "./entities/form/FiniteVerbForm.entity.js";
export { InfinitiveForm } from "./entities/form/InfinitiveForm.entity.js";
export { ParticipleForm } from "./entities/form/ParticipleForm.entity.js";
export { GerundForm } from "./entities/form/GerundForm.entity.js";
export { SupineForm } from "./entities/form/SupineForm.entity.js";
export {
  formCaseValues,
  formNumberValues,
  formGenderValues,
  formMoodValues,
  formVoiceValues,
  formTenseValues,
  formPersonValues,
  formDegreeValues,
  formNonFiniteTenseValues,
  formGerundCaseValues,
  formSupineCaseValues,
} from "./entities/form/Form.entity.js";
export type {
  FormCase,
  FormNumber,
  FormGender,
  FormMood,
  FormVoice,
  FormTense,
  FormPerson,
  FormDegree,
  FormNonFiniteTense,
  FormGerundCase,
  FormSupineCase,
} from "./entities/form/Form.entity.js";
