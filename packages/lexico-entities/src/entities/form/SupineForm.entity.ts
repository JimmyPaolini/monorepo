import { Field, ObjectType } from "@nestjs/graphql";
import { ChildEntity, Column } from "typeorm";

import {
  Form,
  type FormSupineCase,
  formSupineCaseValues,
} from "./Form.entity.js";

/** A verbal noun supine form (accusative or ablative case). */
@ObjectType({ implements: Form })
@ChildEntity("supine")
export class SupineForm extends Form {
  @Field(() => String)
  @Column({
    type: "enum",
    enum: formSupineCaseValues,
    name: "form_case",
    comment: "Grammatical case of the supine (accusative or ablative)",
  })
  case!: FormSupineCase;
}
