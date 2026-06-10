export { LexicoDatabaseModule } from "./database/lexico-database.module.js";
export { LexicoNamingStrategy } from "./database/lexico-naming-strategy.js";
export { AuditableEntity } from "./entities/Auditable.entity.js";
export { CreatableEntity } from "./entities/Creatable.entity.js";
export { DeletableEntity } from "./entities/Deletable.entity.js";
export { AdjectivalForm } from "./entities/dictionary/form/AdjectivalForm.entity.js";
export { AdverbForm } from "./entities/dictionary/form/AdverbForm.entity.js";
export { FiniteVerbForm } from "./entities/dictionary/form/FiniteVerbForm.entity.js";
export { Form } from "./entities/dictionary/form/Form.entity.js";
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
} from "./entities/dictionary/form/Form.entity.js";
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
} from "./entities/dictionary/form/Form.entity.js";
export { GerundForm } from "./entities/dictionary/form/GerundForm.entity.js";
export { InfinitiveForm } from "./entities/dictionary/form/InfinitiveForm.entity.js";
export { NominalForm } from "./entities/dictionary/form/NominalForm.entity.js";
export { ParticipleForm } from "./entities/dictionary/form/ParticipleForm.entity.js";
export { SupineForm } from "./entities/dictionary/form/SupineForm.entity.js";
export {
  adjectiveDeclensionValues,
  adjectiveDegreeValues,
  AdjectiveInflection,
} from "./entities/dictionary/inflection/AdjectiveInflection.entity.js";
export type {
  AdjectiveDeclension,
  AdjectiveDegree,
} from "./entities/dictionary/inflection/AdjectiveInflection.entity.js";
export {
  adverbDegreeValues,
  AdverbInflection,
  adverbTypeValues,
} from "./entities/dictionary/inflection/AdverbInflection.entity.js";
export type {
  AdverbDegree,
  AdverbType,
} from "./entities/dictionary/inflection/AdverbInflection.entity.js";
export { Inflection } from "./entities/dictionary/inflection/Inflection.entity.js";
export {
  declensionEnumValues,
  nounDeclensionValues,
  nounGenderValues,
  NounInflection,
} from "./entities/dictionary/inflection/NounInflection.entity.js";
export type {
  NounDeclension,
  NounGender,
} from "./entities/dictionary/inflection/NounInflection.entity.js";
export {
  prepositionCaseValues,
  PrepositionInflection,
} from "./entities/dictionary/inflection/PrepositionInflection.entity.js";
export type { PrepositionCase } from "./entities/dictionary/inflection/PrepositionInflection.entity.js";
export { Uninflected } from "./entities/dictionary/inflection/Uninflected.entity.js";
export {
  verbConjugationValues,
  VerbInflection,
} from "./entities/dictionary/inflection/VerbInflection.entity.js";
export type { VerbConjugation } from "./entities/dictionary/inflection/VerbInflection.entity.js";
export { Lexeme } from "./entities/dictionary/Lexeme.entity.js";
export type { PartOfSpeech } from "./entities/dictionary/PartOfSpeech.entity.js";
export { partOfSpeechValues } from "./entities/dictionary/PartOfSpeech.entity.js";
export { PrincipalPart } from "./entities/dictionary/PrincipalPart.entity.js";
export {
  Pronunciation,
  pronunciationVariantValues,
} from "./entities/dictionary/Pronunciation.entity.js";
export type { PronunciationVariant } from "./entities/dictionary/Pronunciation.entity.js";
export { Translation } from "./entities/dictionary/Translation.entity.js";
export { Word } from "./entities/dictionary/Word.entity.js";
export { WordForm } from "./entities/dictionary/WordForm.entity.js";
export { WordLexeme } from "./entities/dictionary/WordLexeme.entity.js";
export { IdentifiableEntity } from "./entities/Identifiable.entity.js";
export { Author } from "./entities/literature/Author.entity.js";
export { Line } from "./entities/literature/Line.entity.js";
export { Text } from "./entities/literature/Text.entity.js";
export { Token } from "./entities/literature/Token.entity.js";
export { UpdatableEntity } from "./entities/Updatable.entity.js";
