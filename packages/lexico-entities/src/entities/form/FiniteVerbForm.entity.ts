import { Field, ObjectType } from "@nestjs/graphql";
import { ChildEntity, Column } from "typeorm";

import {
  Form,
  type FormMood,
  formMoodValues,
  type FormNumber,
  formNumberValues,
  type FormPerson,
  formPersonValues,
  type FormTense,
  formTenseValues,
  type FormVoice,
  formVoiceValues,
} from "./Form.entity.js";

/** A finite verb form (indicative, subjunctive, or imperative). */
@ObjectType({ implements: Form })
@ChildEntity("finite-verb")
export class FiniteVerbForm extends Form {
  @Field(() => String)
  @Column({
    type: "enum",
    enum: formMoodValues,
    comment: "Grammatical mood (indicative, subjunctive, imperative)",
  })
  mood!: FormMood;

  @Field(() => String)
  @Column({
    type: "enum",
    enum: formVoiceValues,
    comment: "Grammatical voice (active or passive)",
  })
  voice!: FormVoice;

  @Field(() => String)
  @Column({
    type: "enum",
    enum: formTenseValues,
    comment: "Grammatical tense",
  })
  tense!: FormTense;

  @Field(() => String)
  @Column({
    type: "enum",
    enum: formNumberValues,
    comment: "Grammatical number (singular or plural)",
  })
  number!: FormNumber;

  @Field(() => String)
  @Column({
    type: "enum",
    enum: formPersonValues,
    comment: "Grammatical person (first, second, third)",
  })
  person!: FormPerson;
}
