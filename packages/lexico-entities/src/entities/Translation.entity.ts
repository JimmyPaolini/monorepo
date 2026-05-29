import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity()
export class Translation extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne("Entry", "translations", {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn()
  entry!: unknown;

  @Column("varchar", { length: 2047 })
  translation!: string;

  constructor(translation: string, entry: unknown) {
    super();
    this.translation = translation;
    this.entry = entry;
  }
}
