import { Field, ObjectType } from "@nestjs/graphql";
import { ChildEntity, Column } from "typeorm";

import {
  Form,
  type FormGerundCase,
  formGerundCaseValues,
} from "./Form.entity.js";

/** A verbal noun gerund form (genitive, dative, accusative, or ablative case). */
@ChildEntity("gerund")
@ObjectType({ implements: Form })
export class GerundForm extends Form {
  @Column({
    comment:
      "Grammatical case of the gerund (genitive, dative, accusative, ablative)",
    enum: formGerundCaseValues,
    name: "form_case",
    type: "enum",
  })
  @Field(() => String)
  case!: FormGerundCase;
}
