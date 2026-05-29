import { ChildEntity, Column } from "typeorm";

import { Forms } from "./Forms.entity.js";

// ── Indicative ────────────────────────────────────────────────────────────────

interface IndicativePerson {
  first?: string[];
  second?: string[];
  third?: string[];
}

interface IndicativeNumber {
  singular?: IndicativePerson;
  plural?: IndicativePerson;
}

interface IndicativeTense {
  present?: IndicativeNumber;
  imperfect?: IndicativeNumber;
  future?: IndicativeNumber;
  perfect?: IndicativeNumber;
  pluperfect?: IndicativeNumber;
  futurePerfect?: IndicativeNumber;
}

interface IndicativeVoice {
  active?: IndicativeTense;
  passive?: IndicativeTense;
}

// ── Subjunctive ───────────────────────────────────────────────────────────────

interface SubjunctivePerson {
  first?: string[];
  second?: string[];
  third?: string[];
}

interface SubjunctiveNumber {
  singular?: SubjunctivePerson;
  plural?: SubjunctivePerson;
}

interface SubjunctiveTense {
  present?: SubjunctiveNumber;
  imperfect?: SubjunctiveNumber;
  perfect?: SubjunctiveNumber;
  pluperfect?: SubjunctiveNumber;
}

interface SubjunctiveVoice {
  active?: SubjunctiveTense;
  passive?: SubjunctiveTense;
}

// ── Imperative ────────────────────────────────────────────────────────────────

interface ImperativeSecond {
  second?: string[];
}

interface ImperativeSecondThird {
  second?: string[];
  third?: string[];
}

interface ImperativeThird {
  third?: string[];
}

interface ImperativePresent {
  singular?: ImperativeSecond;
  plural?: ImperativeSecond;
}

interface ImperativeActiveFuture {
  singular?: ImperativeSecondThird;
  plural?: ImperativeSecondThird;
}

interface ImperativePassiveFuture {
  singular?: ImperativeSecondThird;
  plural?: ImperativeThird;
}

interface ImperativeVoice {
  active?: { present?: ImperativePresent; future?: ImperativeActiveFuture };
  passive?: { present?: ImperativePresent; future?: ImperativePassiveFuture };
}

// ── Non-Finite ────────────────────────────────────────────────────────────────

interface NonFinitePresentPerfectFuture {
  present?: string[];
  perfect?: string[];
  future?: string[];
}

interface NonFinitePresentFuture {
  present?: string[];
  future?: string[];
}

interface NonFinitePerfectFuture {
  perfect?: string[];
  future?: string[];
}

interface NonFiniteVoice {
  infinitive?: {
    active?: NonFinitePresentPerfectFuture;
    passive?: NonFinitePresentPerfectFuture;
  };
  participle?: {
    active?: NonFinitePresentFuture;
    passive?: NonFinitePerfectFuture;
  };
}

// ── Verbal Noun ───────────────────────────────────────────────────────────────

interface GerundForms {
  genitive?: string[];
  dative?: string[];
  accusative?: string[];
  ablative?: string[];
}

interface SupineForms {
  accusative?: string[];
  ablative?: string[];
}

interface VerbalNounForms {
  gerund?: GerundForms;
  supine?: SupineForms;
}

// ── Entity ────────────────────────────────────────────────────────────────────

/** Verb forms stored as typed JSON columns per mood/voice grouping. */
@ChildEntity("verb")
export class VerbForms extends Forms {
  @Column("json", { nullable: true })
  imperative?: ImperativeVoice | null;

  @Column("json", { nullable: true })
  indicative?: IndicativeVoice | null;

  @Column("json", { nullable: true })
  nonFinite?: NonFiniteVoice | null;

  @Column("json", { nullable: true })
  subjunctive?: SubjunctiveVoice | null;

  @Column("json", { nullable: true })
  verbalNoun?: VerbalNounForms | null;
}
