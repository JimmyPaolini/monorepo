import { Field, ID, InterfaceType } from "@nestjs/graphql";
import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  TableInheritance,
} from "typeorm";

@InterfaceType()
@Entity()
@TableInheritance({ column: { type: "varchar", name: "type", length: 63 } })
export class Forms extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id!: string;
}
