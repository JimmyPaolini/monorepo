import { Field, ID, ObjectType } from "@nestjs/graphql";
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryColumn,
} from "typeorm";

import { type PartOfSpeech, partOfSpeechValues } from "./PartOfSpeech.js";
import { PrincipalPart } from "./PrincipalPart.entity.js";
import { Pronunciation } from "./Pronunciation.js";
import { Translation } from "./Translation.entity.js";
import { type Word } from "./Word.entity.js";
import { Forms } from "./forms/Forms.entity.js";
import { Inflection } from "./inflection/Inflection.entity.js";

@ObjectType()
@Entity()
export class Entry extends BaseEntity {
  @Field(() => ID)
  @PrimaryColumn("varchar", { length: 127, unique: true })
  id!: string;

  @Field({ nullable: true })
  @Column("varchar", { length: 1027, nullable: true })
  etymology?: string;

  @Field(() => Forms, { nullable: true })
  @OneToOne(() => Forms, {
    nullable: true,
    eager: true,
    cascade: true,
    onDelete: "SET NULL",
  })
  @JoinColumn()
  forms?: Forms | null;

  @Field(() => Inflection, { nullable: true })
  @OneToOne(() => Inflection, {
    nullable: true,
    eager: true,
    cascade: true,
    onDelete: "SET NULL",
  })
  @JoinColumn()
  inflection?: Inflection | null;

  @Field(() => String)
  @Column({ type: "enum", enum: partOfSpeechValues })
  partOfSpeech!: PartOfSpeech;

  @Field(() => [PrincipalPart])
  @OneToMany(() => PrincipalPart, "entry", {
    eager: true,
    cascade: true,
  })
  principalParts!: PrincipalPart[];

  @Field(() => Pronunciation, { nullable: true })
  @Column(() => Pronunciation)
  pronunciation?: Pronunciation;

  @Field(() => [Translation], { nullable: true })
  @OneToMany(() => Translation, (translation) => translation.entry, {
    nullable: true,
    eager: true,
    cascade: true,
    onDelete: "CASCADE",
  })
  translations?: Translation[] | null;

  @Field(() => [Object], { nullable: true })
  @ManyToMany("Word", "entries")
  words?: Word[];
}
