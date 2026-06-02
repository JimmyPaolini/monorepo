import { Field, ID, InterfaceType } from "@nestjs/graphql";
import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  TableInheritance,
} from "typeorm";

/**
 *
 */
@InterfaceType()
@Entity({
  name: "inflections",
  schema: "public",
  comment:
    "Abstract base table for grammatical inflection metadata using single-table inheritance",
})
@TableInheritance({ column: { type: "text", name: "type" } })
export class Inflection extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid", {
    comment:
      "Auto-generated UUID; discriminator column 'type' selects the child entity",
  })
  id!: string;
}
