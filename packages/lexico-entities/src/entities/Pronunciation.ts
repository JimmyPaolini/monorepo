import { Field, ObjectType } from "@nestjs/graphql";
import { Column } from "typeorm";

@ObjectType()
export class PronunciationParts {
  @Field({ nullable: true })
  @Column("varchar", { length: 255, nullable: true })
  phonemes!: string;

  @Field({ nullable: true })
  @Column("varchar", { length: 255, nullable: true })
  phonemic!: string;

  @Field({ nullable: true })
  @Column("varchar", { length: 255, nullable: true })
  phonetic!: string;
}

@ObjectType()
export class Pronunciation {
  @Field(() => PronunciationParts, { nullable: true })
  @Column(() => PronunciationParts, { prefix: "classical" })
  classical!: PronunciationParts;

  @Field(() => PronunciationParts, { nullable: true })
  @Column(() => PronunciationParts, { prefix: "ecclesiastical" })
  ecclesiastical!: PronunciationParts;

  @Field(() => PronunciationParts, { nullable: true })
  @Column(() => PronunciationParts, { prefix: "vulgar" })
  vulgar!: PronunciationParts;
}
