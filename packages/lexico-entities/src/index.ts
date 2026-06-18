export { lexicoDataSource } from "./modules/database/data-source";
export {
  adjectiveDegreeValues,
  adverbDegrees as adverbDegreeValues,
  adverbTypes as adverbFunctionTypeValues,
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
  LexicoNamingStrategy,
  nounGenders,
  prepositionCases,
  verbConjugationValues,
} from "./modules/database/database.constants";
export type {
  AdjectiveDegree,
  AdverbDegree,
  AdverbType as AdverbFunctionType,
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
  NounGender,
  PrepositionCase,
  VerbConjugation,
} from "./modules/database/database.constants";
export { DatabaseModule } from "./modules/database/database.module";
export { AuditableEntity } from "./modules/entities/base/Auditable.entity";
export { CreatableEntity } from "./modules/entities/base/Creatable.entity";
export { DeletableEntity } from "./modules/entities/base/Deletable.entity";
export { IdentifiableEntity } from "./modules/entities/base/Identifiable.entity";
export { UpdatableEntity } from "./modules/entities/base/Updatable.entity";
export { AdjectivalForm } from "./modules/entities/dictionary/form/AdjectivalForm.entity";
export { AdverbForm } from "./modules/entities/dictionary/form/AdverbForm.entity";
export { FiniteVerbForm } from "./modules/entities/dictionary/form/FiniteVerbForm.entity";
export { Form } from "./modules/entities/dictionary/form/Form.entity";
export { GerundForm } from "./modules/entities/dictionary/form/GerundForm.entity";
export { InfinitiveForm } from "./modules/entities/dictionary/form/InfinitiveForm.entity";
export { NominalForm } from "./modules/entities/dictionary/form/NominalForm.entity";
export { ParticipleForm } from "./modules/entities/dictionary/form/ParticipleForm.entity";
export { SupineForm } from "./modules/entities/dictionary/form/SupineForm.entity";
export { AdjectiveInflection } from "./modules/entities/dictionary/inflection/AdjectiveInflection.entity";
export { AdverbInflection } from "./modules/entities/dictionary/inflection/AdverbInflection.entity";
export { Inflection } from "./modules/entities/dictionary/inflection/Inflection.entity";
export {
  adjectiveDeclensionValues,
  inflectionDeclensionValues,
  nounDeclensionValues,
} from "./modules/entities/dictionary/inflection/InflectionDeclension";
export type {
  AdjectiveDeclension,
  NounDeclension,
} from "./modules/entities/dictionary/inflection/InflectionDeclension";
export { NounInflection } from "./modules/entities/dictionary/inflection/NounInflection.entity";
export { PrepositionInflection } from "./modules/entities/dictionary/inflection/PrepositionInflection.entity";
export { UninflectedInflection } from "./modules/entities/dictionary/inflection/Uninflected.entity";
export { VerbInflection } from "./modules/entities/dictionary/inflection/VerbInflection.entity";
export { Lexeme } from "./modules/entities/dictionary/Lexeme.entity";
export type { PartOfSpeech } from "./modules/entities/dictionary/PartOfSpeech.entity";
export { partsOfSpeech as partOfSpeechEnumValues } from "./modules/entities/dictionary/PartOfSpeech.entity";
export { PrincipalPart } from "./modules/entities/dictionary/PrincipalPart.entity";
export {
  Pronunciation,
  pronunciationVariants as pronunciationVariantValues,
} from "./modules/entities/dictionary/Pronunciation.entity";
export type { PronunciationVariant } from "./modules/entities/dictionary/Pronunciation.entity";
export { Translation } from "./modules/entities/dictionary/Translation.entity";
export { Word } from "./modules/entities/dictionary/Word.entity";
export { WordForm } from "./modules/entities/dictionary/WordForm.entity";
export { WordLexeme } from "./modules/entities/dictionary/WordLexeme.entity";
export { Author } from "./modules/entities/literature/Author.entity";
export { Line } from "./modules/entities/literature/Line.entity";
export { Text } from "./modules/entities/literature/Text.entity";
export { Token } from "./modules/entities/literature/Token.entity";
