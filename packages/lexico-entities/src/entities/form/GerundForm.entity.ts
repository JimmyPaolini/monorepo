import { Field, ObjectType } from "@nestjs/graphql";
import { ChildEntity, Column } from "typeorm";

import {
  Form,
  type FormGerundCase,
  formGerundCaseValues,
} from "./Form.entity.js";

/** A verbal noun gerund form (genitive, dative, accusative, or ablative case). */
@ObjectType({ implements: Form })
@ChildEntity("gerund")
export class GerundForm extends Form {
  @Field(() => String)
  @Column({
    type: "enum",
    enum: formGerundCaseValues,
    name: "form_case",
    comment:
      "Grammatical case of the gerund (genitive, dative, accusative, ablative)",
  })
  case!: FormGerundCase;
}
