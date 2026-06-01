import type { AdjectiveForms } from "./AdjectiveForms.entity.js";
import type { AdverbForms } from "./AdverbForms.entity.js";
import type { NounForms } from "./NounForms.entity.js";
import type { VerbForms } from "./VerbForms.entity.js";

/**
 *
 */
export type Forms = NounForms | AdjectiveForms | AdverbForms | VerbForms;
