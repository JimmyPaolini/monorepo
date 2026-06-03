import { Field, ObjectType } from "@nestjs/graphql";
import { ChildEntity, Column } from "typeorm";

import {
  Form,
  type FormCase,
  formCaseValues,
  type FormNumber,
  formNumberValues,
} from "./Form.entity.js";

/** A declined form for a noun, pronoun, or determiner (case + number). */
@ObjectType({ implements: Form })
@ChildEntity("nominal")
export class NominalForm extends Form {
  @Field(() => String)
  @Column({
    type: "enum",
    enum: formCaseValues,
    name: "form_case",
    comment: "Grammatical case of this form",
  })
  case!: FormCase;

  @Field(() => String)
  @Column({
    type: "enum",
    enum: formNumberValues,
    comment: "Grammatical number (singular or plural)",
  })
  number!: FormNumber;
}
