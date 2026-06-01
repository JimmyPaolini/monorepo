import { Field, ID, InterfaceType } from "@nestjs/graphql";
import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  TableInheritance,
} from "typeorm";

@InterfaceType()
@Entity({
  name: "inflections",
  comment:
    "Abstract base table for grammatical inflection metadata using single-table inheritance",
})
@TableInheritance({ column: { type: "varchar", name: "type", length: 63 } })
export class Inflection extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid", {
    comment:
      "Auto-generated UUID; discriminator column 'type' selects the child entity",
  })
  id!: string;
}
