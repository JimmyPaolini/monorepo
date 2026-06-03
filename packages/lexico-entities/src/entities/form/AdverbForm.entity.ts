import { Field, ObjectType } from "@nestjs/graphql";
import { ChildEntity, Column } from "typeorm";

import { Form, type FormDegree, formDegreeValues } from "./Form.entity.js";

/** An adverb form at a specific degree (positive, comparative, superlative). */
@ObjectType({ implements: Form })
@ChildEntity("adverb")
export class AdverbForm extends Form {
  @Field(() => String)
  @Column({
    type: "enum",
    enum: formDegreeValues,
    comment: "Degree of comparison (positive, comparative, superlative)",
  })
  degree!: FormDegree;
}
