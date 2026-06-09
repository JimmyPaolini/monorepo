import type { MigrationInterface, QueryRunner } from "typeorm";

/**
 *
 */
export class Migration1780972049979 implements MigrationInterface {
  name = "Migration1780972049979";

  /**
   *
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tokens" DROP CONSTRAINT "FK_4a94e9093c0191e7f01e0a2d02e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" DROP CONSTRAINT "FK_784a19cd725470a3068fc62db39"`,
    );
    await queryRunner.query(
      `ALTER TABLE "texts" DROP CONSTRAINT "FK_c3172aa0d3cd4c678d44dae85cd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "texts" DROP CONSTRAINT "FK_275807c423ad9d0b569c2b9ca81"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lines" DROP CONSTRAINT "FK_8ba479aa45ba1795a3f7e5c8d22"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lines" DROP CONSTRAINT "FK_90ccb87cbd0fd6952e1aee42482"`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "tokens"."is_punctuation" IS NULL`,
    );
    await queryRunner.query(`COMMENT ON COLUMN "tokens"."index" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "texts"."type" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "texts"."title" IS NULL`);
    await queryRunner.query(
      `COMMENT ON COLUMN "texts"."slug" IS 'Unique slug identifier'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "lines"."slug" IS 'Unique slug identifier (e.g. text_id_lineNumber)'`,
    );
    await queryRunner.query(`COMMENT ON COLUMN "lines"."line_number" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "lines"."line_label" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "lines"."line" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "authors"."name" IS NULL`);
    await queryRunner.query(
      `COMMENT ON COLUMN "tokens"."text_id" IS 'Auto-generated UUID primary key'`,
    );
    await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "text_id"`);
    await queryRunner.query(
      `COMMENT ON COLUMN "tokens"."author_id" IS 'Auto-generated UUID primary key'`,
    );
    await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "author_id"`);
    await queryRunner.query(
      `COMMENT ON COLUMN "tokens"."text_value" IS 'The raw string value of the token'`,
    );
    await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "text_value"`);
    await queryRunner.query(
      `COMMENT ON COLUMN "lines"."author_id" IS 'Auto-generated UUID primary key'`,
    );
    await queryRunner.query(`ALTER TABLE "lines" DROP COLUMN "author_id"`);
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD "text" character varying NOT NULL`,
    );
    await queryRunner.query(`COMMENT ON TABLE "tokens" IS NULL`);
    await queryRunner.query(`COMMENT ON TABLE "texts" IS NULL`);
    await queryRunner.query(`COMMENT ON TABLE "lines" IS NULL`);
    await queryRunner.query(`COMMENT ON TABLE "authors" IS NULL`);
    await queryRunner.query(
      `ALTER TABLE "texts" ADD CONSTRAINT "FK_c3172aa0d3cd4c678d44dae85cd" FOREIGN KEY ("parent_text_id") REFERENCES "texts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "texts" ADD CONSTRAINT "FK_275807c423ad9d0b569c2b9ca81" FOREIGN KEY ("author_id") REFERENCES "authors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lines" ADD CONSTRAINT "FK_8ba479aa45ba1795a3f7e5c8d22" FOREIGN KEY ("text_id") REFERENCES "texts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  /**
   *
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lines" DROP CONSTRAINT "FK_8ba479aa45ba1795a3f7e5c8d22"`,
    );
    await queryRunner.query(
      `ALTER TABLE "texts" DROP CONSTRAINT "FK_275807c423ad9d0b569c2b9ca81"`,
    );
    await queryRunner.query(
      `ALTER TABLE "texts" DROP CONSTRAINT "FK_c3172aa0d3cd4c678d44dae85cd"`,
    );
    await queryRunner.query(
      `COMMENT ON TABLE "authors" IS 'An author of Latin literature'`,
    );
    await queryRunner.query(
      `COMMENT ON TABLE "lines" IS 'A single line of classical Latin literature'`,
    );
    await queryRunner.query(
      `COMMENT ON TABLE "texts" IS 'A hierarchical literary work (corpus, book, text, poem, etc.)'`,
    );
    await queryRunner.query(
      `COMMENT ON TABLE "tokens" IS 'A single parsed token (word or punctuation) from a line of literature'`,
    );
    await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "text"`);
    await queryRunner.query(`ALTER TABLE "lines" ADD "author_id" uuid`);
    await queryRunner.query(
      `COMMENT ON COLUMN "lines"."author_id" IS 'Auto-generated UUID primary key'`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD "text_value" character varying NOT NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "tokens"."text_value" IS 'The raw string value of the token'`,
    );
    await queryRunner.query(`ALTER TABLE "tokens" ADD "author_id" uuid`);
    await queryRunner.query(
      `COMMENT ON COLUMN "tokens"."author_id" IS 'Auto-generated UUID primary key'`,
    );
    await queryRunner.query(`ALTER TABLE "tokens" ADD "text_id" uuid`);
    await queryRunner.query(
      `COMMENT ON COLUMN "tokens"."text_id" IS 'Auto-generated UUID primary key'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "authors"."name" IS 'The display name of the author'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "lines"."line" IS 'The raw text content of the line'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "lines"."line_label" IS 'The display label for the line (e.g. section number or roman numeral)'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "lines"."line_number" IS 'The sequential 0-based index of the line within its text'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "lines"."slug" IS 'Unique slug identifier (e.g. ''caesar/de bello gallico_12'')'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "texts"."slug" IS 'Unique slug identifier (e.g. ''caesar/de bello gallico'')'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "texts"."title" IS 'The title of the text'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "texts"."type" IS 'The structural type of the text (e.g. ''book'', ''text'', ''collection'')'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "tokens"."index" IS 'The 0-based index of this token within its parent line'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "tokens"."is_punctuation" IS 'True if the token represents punctuation or whitespace, false if it is a word'`,
    );
    await queryRunner.query(
      `ALTER TABLE "lines" ADD CONSTRAINT "FK_90ccb87cbd0fd6952e1aee42482" FOREIGN KEY ("author_id") REFERENCES "authors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lines" ADD CONSTRAINT "FK_8ba479aa45ba1795a3f7e5c8d22" FOREIGN KEY ("text_id") REFERENCES "texts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "texts" ADD CONSTRAINT "FK_275807c423ad9d0b569c2b9ca81" FOREIGN KEY ("author_id") REFERENCES "authors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "texts" ADD CONSTRAINT "FK_c3172aa0d3cd4c678d44dae85cd" FOREIGN KEY ("parent_text_id") REFERENCES "texts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD CONSTRAINT "FK_784a19cd725470a3068fc62db39" FOREIGN KEY ("author_id") REFERENCES "authors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD CONSTRAINT "FK_4a94e9093c0191e7f01e0a2d02e" FOREIGN KEY ("text_id") REFERENCES "texts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
