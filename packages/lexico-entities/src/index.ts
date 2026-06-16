export { LexicoDatabaseModule } from "./modules/database/lexico-database.module.js";
export { LexicoNamingStrategy } from "./modules/database/lexico-naming-strategy.js";
export { AuditableEntity } from "./modules/entities/Auditable.entity.js";
export { CreatableEntity } from "./modules/entities/Creatable.entity.js";
export { DeletableEntity } from "./modules/entities/Deletable.entity.js";
export { AdjectivalForm } from "./modules/entities/dictionary/form/AdjectivalForm.entity.js";
export { AdverbForm } from "./modules/entities/dictionary/form/AdverbForm.entity.js";
export { FiniteVerbForm } from "./modules/entities/dictionary/form/FiniteVerbForm.entity.js";
export { Form } from "./modules/entities/dictionary/form/Form.entity.js";
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
} from "./modules/entities/dictionary/form/Form.entity.js";
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
} from "./modules/entities/dictionary/form/Form.entity.js";
export { GerundForm } from "./modules/entities/dictionary/form/GerundForm.entity.js";
export { InfinitiveForm } from "./modules/entities/dictionary/form/InfinitiveForm.entity.js";
export { NominalForm } from "./modules/entities/dictionary/form/NominalForm.entity.js";
export { ParticipleForm } from "./modules/entities/dictionary/form/ParticipleForm.entity.js";
export { SupineForm } from "./modules/entities/dictionary/form/SupineForm.entity.js";
export {
  adjectiveDeclensionValues,
  adjectiveDegreeValues,
  AdjectiveInflection,
} from "./modules/entities/dictionary/inflection/AdjectiveInflection.entity.js";
export type {
  AdjectiveDeclension,
  AdjectiveDegree,
} from "./modules/entities/dictionary/inflection/AdjectiveInflection.entity.js";
export {
  adverbDegreeValues,
  AdverbInflection,
  adverbTypeValues,
} from "./modules/entities/dictionary/inflection/AdverbInflection.entity.js";
export type {
  AdverbDegree,
  AdverbType,
} from "./modules/entities/dictionary/inflection/AdverbInflection.entity.js";
export { Inflection } from "./modules/entities/dictionary/inflection/Inflection.entity.js";
export {
  declensionEnumValues,
  nounDeclensionValues,
  nounGenderValues,
  NounInflection,
} from "./modules/entities/dictionary/inflection/NounInflection.entity.js";
export type {
  NounDeclension,
  NounGender,
} from "./modules/entities/dictionary/inflection/NounInflection.entity.js";
export {
  prepositionCaseValues,
  PrepositionInflection,
} from "./modules/entities/dictionary/inflection/PrepositionInflection.entity.js";
export type { PrepositionCase } from "./modules/entities/dictionary/inflection/PrepositionInflection.entity.js";
export { Uninflected } from "./modules/entities/dictionary/inflection/Uninflected.entity.js";
export {
  verbConjugationValues,
  VerbInflection,
} from "./modules/entities/dictionary/inflection/VerbInflection.entity.js";
export type { VerbConjugation } from "./modules/entities/dictionary/inflection/VerbInflection.entity.js";
export { Lexeme } from "./modules/entities/dictionary/Lexeme.entity.js";
export type { PartOfSpeech } from "./modules/entities/dictionary/PartOfSpeech.entity.js";
export { partOfSpeechValues } from "./modules/entities/dictionary/PartOfSpeech.entity.js";
export { PrincipalPart } from "./modules/entities/dictionary/PrincipalPart.entity.js";
export {
  Pronunciation,
  pronunciationVariantValues,
} from "./modules/entities/dictionary/Pronunciation.entity.js";
export type { PronunciationVariant } from "./modules/entities/dictionary/Pronunciation.entity.js";
export { Translation } from "./modules/entities/dictionary/Translation.entity.js";
export { Word } from "./modules/entities/dictionary/Word.entity.js";
export { WordForm } from "./modules/entities/dictionary/WordForm.entity.js";
export { WordLexeme } from "./modules/entities/dictionary/WordLexeme.entity.js";
export { IdentifiableEntity } from "./modules/entities/Identifiable.entity.js";
export { Author } from "./modules/entities/literature/Author.entity.js";
export { Line } from "./modules/entities/literature/Line.entity.js";
export { Text } from "./modules/entities/literature/Text.entity.js";
export { Token } from "./modules/entities/literature/Token.entity.js";
export { UpdatableEntity } from "./modules/entities/Updatable.entity.js";
