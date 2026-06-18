export const nounDeclension = {
  fifth: "fifth",
  first: "first",
  fourth: "fourth",
  none: "",
  second: "second",
  third: "third",
} as const;

/**
 * Union of noun declension values.
 */
export type NounDeclension =
  (typeof nounDeclension)[keyof typeof nounDeclension];

export const nounDeclensionValues = Object.values(
  nounDeclension,
) as NounDeclension[];

export const adjectiveDeclension = {
  firstSecond: "first/second",
  none: "",
  third: "third",
} as const;

/**
 * Union of adjective declension values.
 */
export type AdjectiveDeclension =
  (typeof adjectiveDeclension)[keyof typeof adjectiveDeclension];

export const adjectiveDeclensionValues = Object.values(
  adjectiveDeclension,
) as AdjectiveDeclension[];

// Unified DB enum: union of all child-entity declension values (noun + adjective)
export const inflectionDeclension = {
  ...nounDeclension,
  ...adjectiveDeclension,
} as const;

export const inflectionDeclensionValues = Object.values(inflectionDeclension);
