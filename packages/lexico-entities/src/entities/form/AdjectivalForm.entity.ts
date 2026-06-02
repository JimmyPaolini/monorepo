import { Field, ObjectType } from "@nestjs/graphql";
import { ChildEntity, Column } from "typeorm";

import {
  Form,
  type FormCase,
  formCaseValues,
  type FormGender,
  formGenderValues,
  type FormNumber,
  formNumberValues,
} from "./Form.entity.js";

/** A declined form for an adjective (gender + case + number). */
@ObjectType({ implements: Form })
@ChildEntity("adjectival")
export class AdjectivalForm extends Form {
  @Field(() => String)
  @Column({
    type: "enum",
    enum: formGenderValues,
    comment: "Grammatical gender of this adjectival form",
  })
  gender!: FormGender;

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
