import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity()
export class PrincipalPart extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne("Entry", "principalParts", {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  entry!: unknown;

  @Column("varchar", { length: 63 })
  name!: string;

  @Column("simple-array")
  text!: string[];
}
