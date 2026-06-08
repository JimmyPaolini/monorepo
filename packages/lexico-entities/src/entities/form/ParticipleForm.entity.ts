import { Field, ObjectType } from "@nestjs/graphql";
import { ChildEntity, Column } from "typeorm";

import {
  Form,
  type FormNonFiniteTense,
  formNonFiniteTenseValues,
  type FormVoice,
  formVoiceValues,
} from "./Form.entity.js";

/** A non-finite participial form (voice + tense). */
@ChildEntity("participle")
@ObjectType({ implements: Form })
export class ParticipleForm extends Form {
  @Column({
    comment: "Tense of the participle (present, perfect, future)",
    enum: formNonFiniteTenseValues,
    type: "enum",
  })
  @Field(() => String)
  tense!: FormNonFiniteTense;

  @Column({
    comment: "Grammatical voice (active or passive)",
    enum: formVoiceValues,
    type: "enum",
  })
  @Field(() => String)
  voice!: FormVoice;
}
