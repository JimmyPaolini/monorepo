import {
  AdverbForms,
  AdverbInflection,
  type AdverbType,
  type Forms,
  type Inflection,
  type PrincipalPart,
} from "@monorepo/lexico-entities";

export const ADVERB_FIRST_PP = "positive";

/** Infer an adverb's type and degree from its principal parts. */
export function ingestAdverbInflection(
  principalParts: PrincipalPart[],
): Inflection {
  const type: AdverbType =
    principalParts.length > 1 ? "descriptive" : "conjunctional";
  const adv = new AdverbInflection();
  adv.type = type;
  adv.degree = "positive";
  return adv;
}

/** Build adverb forms from its principal parts. */
export function ingestAdverbForms(principalParts: PrincipalPart[]): Forms {
  const forms = new AdverbForms();
  forms.positive = principalParts[0]?.text ?? [];
  if (principalParts.length >= 2)
    forms.comparative = principalParts[1]?.text ?? [];
  if (principalParts.length >= 3)
    forms.superlative = principalParts[2]?.text ?? [];
  return forms;
}
