export type AdjectiveDeclension = "first/second" | "third" | "";
export type AdjectiveDegree = "positive" | "comparative" | "superlative";

export class AdjectiveInflection {
  declension: AdjectiveDeclension = "";
  degree: AdjectiveDegree = "positive";
  other?: string = "";

  constructor(
    declension: AdjectiveDeclension = "",
    degree: AdjectiveDegree = "positive",
    other = "",
  ) {
    this.declension = declension;
    this.degree = degree;
    this.other = other;
  }
}
