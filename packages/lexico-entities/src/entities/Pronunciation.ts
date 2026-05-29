import { Column } from "typeorm";

export class PronunciationParts {
  @Column("varchar", { length: 255, nullable: true })
  phonemes!: string;

  @Column("varchar", { length: 255, nullable: true })
  phonemic!: string;

  @Column("varchar", { length: 255, nullable: true })
  phonetic!: string;
}

export class Pronunciation {
  @Column(() => PronunciationParts, { prefix: "classical" })
  classical!: PronunciationParts;

  @Column(() => PronunciationParts, { prefix: "ecclesiastical" })
  ecclesiastical!: PronunciationParts;

  @Column(() => PronunciationParts, { prefix: "vulgar" })
  vulgar!: PronunciationParts;
}
