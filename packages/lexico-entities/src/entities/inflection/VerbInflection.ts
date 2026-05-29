export type VerbConjugation =
  | "first"
  | "second"
  | "third"
  | "third-io"
  | "fourth"
  | "";

export class VerbInflection {
  conjugation: VerbConjugation = "";
  other?: string = "";

  constructor(conjugation: VerbConjugation = "", other = "") {
    this.conjugation = conjugation;
    this.other = other;
  }
}
