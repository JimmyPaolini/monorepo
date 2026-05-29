import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

/** Represents an ingested learning material record persisted in PostgreSQL. */
@Entity({ name: "learning_materials" })
export class LearningMaterialEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "text" })
  title!: string;

  @Column({ type: "text", name: "source_type" })
  sourceType!: string;

  @Column({ type: "text", name: "source_id", unique: true })
  sourceId!: string;

  @Column({ type: "text", name: "source_url" })
  sourceUrl!: string;

  @Column({ type: "text", name: "language_code" })
  languageCode!: string;

  @Column({ type: "text", array: true, default: "{}" })
  tags!: string[];

  @Column({ type: "text" })
  content!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
