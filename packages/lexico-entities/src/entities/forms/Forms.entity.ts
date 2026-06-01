import { Field, ID, InterfaceType } from "@nestjs/graphql";
import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  TableInheritance,
} from "typeorm";

@InterfaceType()
@Entity({
  name: "forms",
  comment:
    "Abstract base table for pre-computed inflected forms using single-table inheritance",
})
@TableInheritance({ column: { type: "varchar", name: "type", length: 63 } })
export class Forms extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid", {
    comment:
      "Auto-generated UUID; discriminator column 'type' selects the child entity",
  })
  id!: string;
}
