import { Field, ObjectType } from "@nestjs/graphql";
import { ChildEntity, Column } from "typeorm";

import { Forms } from "./Forms.entity.js";

// ── Indicative ────────────────────────────────────────────────────────────────

@ObjectType()
export class IndicativePerson {
  @Field(() => [String], { nullable: true }) first?: string[];
  @Field(() => [String], { nullable: true }) second?: string[];
  @Field(() => [String], { nullable: true }) third?: string[];
}

@ObjectType()
export class IndicativeNumber {
  @Field(() => IndicativePerson, { nullable: true })
  singular?: IndicativePerson;
  @Field(() => IndicativePerson, { nullable: true }) plural?: IndicativePerson;
}

@ObjectType()
export class IndicativeTense {
  @Field(() => IndicativeNumber, { nullable: true }) present?: IndicativeNumber;
  @Field(() => IndicativeNumber, { nullable: true })
  imperfect?: IndicativeNumber;
  @Field(() => IndicativeNumber, { nullable: true }) future?: IndicativeNumber;
  @Field(() => IndicativeNumber, { nullable: true }) perfect?: IndicativeNumber;
  @Field(() => IndicativeNumber, { nullable: true })
  pluperfect?: IndicativeNumber;
  @Field(() => IndicativeNumber, { nullable: true })
  futurePerfect?: IndicativeNumber;
}

@ObjectType()
export class IndicativeVoice {
  @Field(() => IndicativeTense, { nullable: true }) active?: IndicativeTense;
  @Field(() => IndicativeTense, { nullable: true }) passive?: IndicativeTense;
}

// ── Subjunctive ───────────────────────────────────────────────────────────────

@ObjectType()
export class SubjunctivePerson {
  @Field(() => [String], { nullable: true }) first?: string[];
  @Field(() => [String], { nullable: true }) second?: string[];
  @Field(() => [String], { nullable: true }) third?: string[];
}

@ObjectType()
export class SubjunctiveNumber {
  @Field(() => SubjunctivePerson, { nullable: true })
  singular?: SubjunctivePerson;
  @Field(() => SubjunctivePerson, { nullable: true })
  plural?: SubjunctivePerson;
}

@ObjectType()
export class SubjunctiveTense {
  @Field(() => SubjunctiveNumber, { nullable: true })
  present?: SubjunctiveNumber;
  @Field(() => SubjunctiveNumber, { nullable: true })
  imperfect?: SubjunctiveNumber;
  @Field(() => SubjunctiveNumber, { nullable: true })
  perfect?: SubjunctiveNumber;
  @Field(() => SubjunctiveNumber, { nullable: true })
  pluperfect?: SubjunctiveNumber;
}

@ObjectType()
export class SubjunctiveVoice {
  @Field(() => SubjunctiveTense, { nullable: true }) active?: SubjunctiveTense;
  @Field(() => SubjunctiveTense, { nullable: true }) passive?: SubjunctiveTense;
}

// ── Imperative ────────────────────────────────────────────────────────────────

@ObjectType()
export class ImperativeSecond {
  @Field(() => [String], { nullable: true }) second?: string[];
}

@ObjectType()
export class ImperativeSecondThird {
  @Field(() => [String], { nullable: true }) second?: string[];
  @Field(() => [String], { nullable: true }) third?: string[];
}

@ObjectType()
export class ImperativeThird {
  @Field(() => [String], { nullable: true }) third?: string[];
}

@ObjectType()
export class ImperativePresent {
  @Field(() => ImperativeSecond, { nullable: true })
  singular?: ImperativeSecond;
  @Field(() => ImperativeSecond, { nullable: true }) plural?: ImperativeSecond;
}

@ObjectType()
export class ImperativeActiveFuture {
  @Field(() => ImperativeSecondThird, { nullable: true })
  singular?: ImperativeSecondThird;
  @Field(() => ImperativeSecondThird, { nullable: true })
  plural?: ImperativeSecondThird;
}

@ObjectType()
export class ImperativePassiveFuture {
  @Field(() => ImperativeSecondThird, { nullable: true })
  singular?: ImperativeSecondThird;
  @Field(() => ImperativeThird, { nullable: true }) plural?: ImperativeThird;
}

@ObjectType()
export class ImperativeActiveVoice {
  @Field(() => ImperativePresent, { nullable: true })
  present?: ImperativePresent;
  @Field(() => ImperativeActiveFuture, { nullable: true })
  future?: ImperativeActiveFuture;
}

@ObjectType()
export class ImperativePassiveVoice {
  @Field(() => ImperativePresent, { nullable: true })
  present?: ImperativePresent;
  @Field(() => ImperativePassiveFuture, { nullable: true })
  future?: ImperativePassiveFuture;
}

@ObjectType()
export class ImperativeVoice {
  @Field(() => ImperativeActiveVoice, { nullable: true })
  active?: ImperativeActiveVoice;
  @Field(() => ImperativePassiveVoice, { nullable: true })
  passive?: ImperativePassiveVoice;
}

// ── Non-Finite ────────────────────────────────────────────────────────────────

@ObjectType()
export class NonFinitePresentPerfectFuture {
  @Field(() => [String], { nullable: true }) present?: string[];
  @Field(() => [String], { nullable: true }) perfect?: string[];
  @Field(() => [String], { nullable: true }) future?: string[];
}

@ObjectType()
export class NonFinitePresentFuture {
  @Field(() => [String], { nullable: true }) present?: string[];
  @Field(() => [String], { nullable: true }) future?: string[];
}

@ObjectType()
export class NonFinitePerfectFuture {
  @Field(() => [String], { nullable: true }) perfect?: string[];
  @Field(() => [String], { nullable: true }) future?: string[];
}

@ObjectType()
export class NonFiniteInfinitive {
  @Field(() => NonFinitePresentPerfectFuture, { nullable: true })
  active?: NonFinitePresentPerfectFuture;
  @Field(() => NonFinitePresentPerfectFuture, { nullable: true })
  passive?: NonFinitePresentPerfectFuture;
}

@ObjectType()
export class NonFiniteParticiple {
  @Field(() => NonFinitePresentFuture, { nullable: true })
  active?: NonFinitePresentFuture;
  @Field(() => NonFinitePerfectFuture, { nullable: true })
  passive?: NonFinitePerfectFuture;
}

@ObjectType()
export class NonFiniteVoice {
  @Field(() => NonFiniteInfinitive, { nullable: true })
  infinitive?: NonFiniteInfinitive;
  @Field(() => NonFiniteParticiple, { nullable: true })
  participle?: NonFiniteParticiple;
}

// ── Verbal Noun ───────────────────────────────────────────────────────────────

@ObjectType()
export class GerundForms {
  @Field(() => [String], { nullable: true }) genitive?: string[];
  @Field(() => [String], { nullable: true }) dative?: string[];
  @Field(() => [String], { nullable: true }) accusative?: string[];
  @Field(() => [String], { nullable: true }) ablative?: string[];
}

@ObjectType()
export class SupineForms {
  @Field(() => [String], { nullable: true }) accusative?: string[];
  @Field(() => [String], { nullable: true }) ablative?: string[];
}

@ObjectType()
export class VerbalNounForms {
  @Field(() => GerundForms, { nullable: true }) gerund?: GerundForms;
  @Field(() => SupineForms, { nullable: true }) supine?: SupineForms;
}

// ── Entity ────────────────────────────────────────────────────────────────────

/** Verb forms stored as typed JSON columns per mood/voice grouping. */
@ObjectType({ implements: Forms })
@ChildEntity("verb")
export class VerbForms extends Forms {
  @Field(() => ImperativeVoice, { nullable: true })
  @Column("json", {
    nullable: true,
    comment: "Imperative mood forms (active and passive voice)",
  })
  imperative?: ImperativeVoice | null;

  @Field(() => IndicativeVoice, { nullable: true })
  @Column("json", {
    nullable: true,
    comment: "Indicative mood forms (active and passive voice, all tenses)",
  })
  indicative?: IndicativeVoice | null;

  @Field(() => NonFiniteVoice, { nullable: true })
  @Column("json", {
    nullable: true,
    comment: "Non-finite forms (infinitives and participles)",
  })
  nonFinite?: NonFiniteVoice | null;

  @Field(() => SubjunctiveVoice, { nullable: true })
  @Column("json", {
    nullable: true,
    comment: "Subjunctive mood forms (active and passive voice)",
  })
  subjunctive?: SubjunctiveVoice | null;

  @Field(() => VerbalNounForms, { nullable: true })
  @Column("json", {
    nullable: true,
    comment: "Verbal noun forms (gerund and supine)",
  })
  verbalNoun?: VerbalNounForms | null;
}
