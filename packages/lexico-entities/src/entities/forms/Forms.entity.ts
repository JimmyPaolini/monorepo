import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  TableInheritance,
} from "typeorm";

@Entity()
@TableInheritance({ column: { type: "varchar", name: "type", length: 63 } })
export class Forms extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;
}
