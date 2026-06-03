import { Field, ObjectType } from "@nestjs/graphql";
import { ChildEntity, Column } from "typeorm";

import {
  Form,
  type FormNonFiniteTense,
  formNonFiniteTenseValues,
  type FormVoice,
  formVoiceValues,
} from "./Form.entity.js";

/** A non-finite infinitive form (voice + tense). */
@ObjectType({ implements: Form })
@ChildEntity("infinitive")
export class InfinitiveForm extends Form {
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
    enum: formNonFiniteTenseValues,
    comment: "Tense of the infinitive (present, perfect, future)",
  })
  tense!: FormNonFiniteTense;
}
