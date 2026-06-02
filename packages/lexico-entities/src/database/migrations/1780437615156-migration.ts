import type { MigrationInterface, QueryRunner } from "typeorm";

/**
 *
 */
export class Migration1780437615156 implements MigrationInterface {
  name = "Migration1780437615156";

  /**
   *
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."forms_gender_enum" AS ENUM('masculine', 'feminine', 'neuter')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."forms_form_case_enum" AS ENUM('nominative', 'genitive', 'dative', 'accusative', 'ablative', 'vocative', 'locative')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."forms_number_enum" AS ENUM('singular', 'plural')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."forms_degree_enum" AS ENUM('positive', 'comparative', 'superlative')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."forms_mood_enum" AS ENUM('indicative', 'subjunctive', 'imperative')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."forms_voice_enum" AS ENUM('active', 'passive')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."forms_tense_enum" AS ENUM('present', 'imperfect', 'future', 'perfect', 'pluperfect', 'futurePerfect')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."forms_person_enum" AS ENUM('first', 'second', 'third')`,
    );
    await queryRunner.query(
      `CREATE TABLE "forms" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_by" uuid, "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, "gender" "public"."forms_gender_enum", "form_case" "public"."forms_form_case_enum", "number" "public"."forms_number_enum", "degree" "public"."forms_degree_enum", "mood" "public"."forms_mood_enum", "voice" "public"."forms_voice_enum", "tense" "public"."forms_tense_enum", "person" "public"."forms_person_enum", "type" text NOT NULL, "lexeme_id" uuid NOT NULL, CONSTRAINT "PK_ba062fd30b06814a60756f233da" PRIMARY KEY ("id")); COMMENT ON COLUMN "forms"."id" IS 'Auto-generated UUID primary key'; COMMENT ON COLUMN "forms"."created_at" IS 'Timestamp when the record was created'; COMMENT ON COLUMN "forms"."created_by" IS 'UUID of the user or process that created the record'; COMMENT ON COLUMN "forms"."updated_at" IS 'Timestamp when the record was last updated'; COMMENT ON COLUMN "forms"."updated_by" IS 'UUID of the user or process that last updated the record'; COMMENT ON COLUMN "forms"."deleted_at" IS 'Timestamp when the record was soft-deleted'; COMMENT ON COLUMN "forms"."deleted_by" IS 'UUID of the user or process that soft-deleted the record'; COMMENT ON COLUMN "forms"."gender" IS 'Grammatical gender of this adjectival form'; COMMENT ON COLUMN "forms"."form_case" IS 'Grammatical case of this form'; COMMENT ON COLUMN "forms"."number" IS 'Grammatical number (singular or plural)'; COMMENT ON COLUMN "forms"."degree" IS 'Degree of comparison (positive, comparative, superlative)'; COMMENT ON COLUMN "forms"."mood" IS 'Grammatical mood (indicative, subjunctive, imperative)'; COMMENT ON COLUMN "forms"."voice" IS 'Grammatical voice (active or passive)'; COMMENT ON COLUMN "forms"."tense" IS 'Grammatical tense'; COMMENT ON COLUMN "forms"."person" IS 'Grammatical person (first, second, third)'; COMMENT ON COLUMN "forms"."lexeme_id" IS 'Auto-generated UUID primary key'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_52ebb86789cf513c7fb44ab9a9" ON "forms"  ("lexeme_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2bc463838022e5cc652df63c4a" ON "forms"  ("type") `,
    );
    await queryRunner.query(
      `COMMENT ON TABLE "forms" IS 'Abstract base table for normalized inflected forms using single-table inheritance'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."inflections_declension_enum" AS ENUM('first', 'second', 'third', 'fourth', 'fifth', 'first/second', '')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."inflections_gender_enum" AS ENUM('masculine', 'feminine', 'masc/fem', 'neuter', '')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."inflections_degree_enum" AS ENUM('positive', 'comparative', 'superlative')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."inflections_adverb_type_enum" AS ENUM('descriptive', 'conjunctional', '')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."inflections_case_enum" AS ENUM('accusative', 'ablative', '')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."inflections_conjugation_enum" AS ENUM('first', 'second', 'third', 'third-io', 'fourth', '')`,
    );
    await queryRunner.query(
      `CREATE TABLE "inflections" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "declension" "public"."inflections_declension_enum" DEFAULT '', "gender" "public"."inflections_gender_enum" DEFAULT '', "other" text, "degree" "public"."inflections_degree_enum" DEFAULT 'positive', "adverb_type" "public"."inflections_adverb_type_enum" DEFAULT '', "case" "public"."inflections_case_enum" DEFAULT '', "conjugation" "public"."inflections_conjugation_enum" DEFAULT '', "type" text NOT NULL, CONSTRAINT "PK_a70d36c564be34be3f08a08bc0b" PRIMARY KEY ("id")); COMMENT ON COLUMN "inflections"."id" IS 'Auto-generated UUID; discriminator column ''type'' selects the child entity'; COMMENT ON COLUMN "inflections"."declension" IS 'Noun declension class (first through fifth)'; COMMENT ON COLUMN "inflections"."gender" IS 'Grammatical gender (masculine, feminine, neuter)'; COMMENT ON COLUMN "inflections"."other" IS 'Additional inflection notes'; COMMENT ON COLUMN "inflections"."degree" IS 'Degree of comparison (positive, comparative, superlative)'; COMMENT ON COLUMN "inflections"."adverb_type" IS 'Functional type of the adverb (descriptive or conjunctional)'; COMMENT ON COLUMN "inflections"."case" IS 'Grammatical case governed by the preposition (accusative or ablative)'; COMMENT ON COLUMN "inflections"."conjugation" IS 'Verb conjugation class (first through fourth)'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2f191c1029749f9f01b877e7f8" ON "inflections"  ("type") `,
    );
    await queryRunner.query(
      `COMMENT ON TABLE "inflections" IS 'Abstract base table for grammatical inflection metadata using single-table inheritance'`,
    );
    await queryRunner.query(
      `CREATE TABLE "principal_parts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_by" uuid, "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, "name" text NOT NULL, "text" jsonb NOT NULL, "lexeme_id" uuid, CONSTRAINT "PK_a7efc0b33c62679b3302fe95f8d" PRIMARY KEY ("id")); COMMENT ON COLUMN "principal_parts"."id" IS 'Auto-generated UUID primary key'; COMMENT ON COLUMN "principal_parts"."created_at" IS 'Timestamp when the record was created'; COMMENT ON COLUMN "principal_parts"."created_by" IS 'UUID of the user or process that created the record'; COMMENT ON COLUMN "principal_parts"."updated_at" IS 'Timestamp when the record was last updated'; COMMENT ON COLUMN "principal_parts"."updated_by" IS 'UUID of the user or process that last updated the record'; COMMENT ON COLUMN "principal_parts"."deleted_at" IS 'Timestamp when the record was soft-deleted'; COMMENT ON COLUMN "principal_parts"."deleted_by" IS 'UUID of the user or process that soft-deleted the record'; COMMENT ON COLUMN "principal_parts"."name" IS 'Label for the principal part (e.g. first, infinitive)'; COMMENT ON COLUMN "principal_parts"."text" IS 'One or more textual forms for this principal part'; COMMENT ON COLUMN "principal_parts"."lexeme_id" IS 'Auto-generated UUID primary key'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_95d23e3a9561dea102f7bf9325" ON "principal_parts"  ("lexeme_id") `,
    );
    await queryRunner.query(
      `COMMENT ON TABLE "principal_parts" IS 'A named principal part (e.g. first, infinitive) of a Latin dictionary entry'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."pronunciations_variant_enum" AS ENUM('classical', 'ecclesiastical', 'vulgar')`,
    );
    await queryRunner.query(
      `CREATE TABLE "pronunciations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_by" uuid, "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, "variant" "public"."pronunciations_variant_enum" NOT NULL, "phonemes" text, "phonemic" text, "phonetic" text, "lexeme_id" uuid, CONSTRAINT "UQ_a90eaf47f480c0d14365fdd34b1" UNIQUE ("lexeme_id", "variant"), CONSTRAINT "PK_fb90cb28dd8dcce6ee8d677d067" PRIMARY KEY ("id")); COMMENT ON COLUMN "pronunciations"."id" IS 'Auto-generated UUID primary key'; COMMENT ON COLUMN "pronunciations"."created_at" IS 'Timestamp when the record was created'; COMMENT ON COLUMN "pronunciations"."created_by" IS 'UUID of the user or process that created the record'; COMMENT ON COLUMN "pronunciations"."updated_at" IS 'Timestamp when the record was last updated'; COMMENT ON COLUMN "pronunciations"."updated_by" IS 'UUID of the user or process that last updated the record'; COMMENT ON COLUMN "pronunciations"."deleted_at" IS 'Timestamp when the record was soft-deleted'; COMMENT ON COLUMN "pronunciations"."deleted_by" IS 'UUID of the user or process that soft-deleted the record'; COMMENT ON COLUMN "pronunciations"."variant" IS 'Pronunciation tradition (classical, ecclesiastical, or vulgar)'; COMMENT ON COLUMN "pronunciations"."phonemes" IS 'Phonemic segmentation (e.g. a.moː)'; COMMENT ON COLUMN "pronunciations"."phonemic" IS 'Phonemic IPA transcription (e.g. /ˈaː.moː/)'; COMMENT ON COLUMN "pronunciations"."phonetic" IS 'Phonetic IPA transcription (e.g. [ˈäː.moː])'; COMMENT ON COLUMN "pronunciations"."lexeme_id" IS 'Auto-generated UUID primary key'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ccf78e53911b7c121a65192c89" ON "pronunciations"  ("lexeme_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_81c176364b794cdcdf309a7a60" ON "pronunciations"  ("variant") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8de57efb4c40b209b2883c3d8c" ON "pronunciations"  ("phonemes") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8fc53b1cbb6c5683b37f65a328" ON "pronunciations"  ("phonemic") `,
    );
    await queryRunner.query(
      `COMMENT ON TABLE "pronunciations" IS 'A pronunciation variant (classical, ecclesiastical, or vulgar) for a Latin lexeme'`,
    );
    await queryRunner.query(
      `INSERT INTO "public"."typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        "postgres",
        "public",
        "translations",
        "GENERATED_COLUMN",
        "translation_full_text_search",
        "to_tsvector('english', translation)",
      ],
    );
    await queryRunner.query(
      `CREATE TABLE "translations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_by" uuid, "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, "translation" text NOT NULL, "translation_full_text_search" tsvector GENERATED ALWAYS AS (to_tsvector('english', translation)) STORED, "lexeme_id" uuid, CONSTRAINT "PK_aca248c72ae1fb2390f1bf4cd87" PRIMARY KEY ("id")); COMMENT ON COLUMN "translations"."id" IS 'Auto-generated UUID primary key'; COMMENT ON COLUMN "translations"."created_at" IS 'Timestamp when the record was created'; COMMENT ON COLUMN "translations"."created_by" IS 'UUID of the user or process that created the record'; COMMENT ON COLUMN "translations"."updated_at" IS 'Timestamp when the record was last updated'; COMMENT ON COLUMN "translations"."updated_by" IS 'UUID of the user or process that last updated the record'; COMMENT ON COLUMN "translations"."deleted_at" IS 'Timestamp when the record was soft-deleted'; COMMENT ON COLUMN "translations"."deleted_by" IS 'UUID of the user or process that soft-deleted the record'; COMMENT ON COLUMN "translations"."translation" IS 'English translation text'; COMMENT ON COLUMN "translations"."lexeme_id" IS 'Auto-generated UUID primary key'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_03033925e968b7c9430896d55f" ON "translations"  ("lexeme_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6dba6d45fe6d365d0373220f0f" ON "translations"  ("translation") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9bc0b8d1aa44faf6ebfde865a2" ON "translations" USING gin ("translation_full_text_search") `,
    );
    await queryRunner.query(
      `COMMENT ON TABLE "translations" IS 'An English translation of a Latin dictionary entry'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."lexemes_part_of_speech_enum" AS ENUM('noun', 'properNoun', 'verb', 'adjective', 'participle', 'adverb', 'pronoun', 'determiner', 'preposition', 'conjunction', 'numeral', 'abbreviation', 'particle', 'interjection', 'prefix', 'suffix', 'interfix', 'circumfix', 'inflection', 'phrase', 'proverb', 'idiom')`,
    );
    await queryRunner.query(
      `CREATE TABLE "lexemes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_by" uuid, "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, "lemma" text NOT NULL, "disambiguator" bigint NOT NULL DEFAULT '0', "etymology" text, "part_of_speech" "public"."lexemes_part_of_speech_enum" NOT NULL, "inflection_id" uuid, CONSTRAINT "UQ_7e69b70876dfb25936d3eb7f0fa" UNIQUE ("lemma", "disambiguator"), CONSTRAINT "REL_3a03721bc1b266578e9afad966" UNIQUE ("inflection_id"), CONSTRAINT "PK_dc81283a4e701643a1e4e9b8633" PRIMARY KEY ("id")); COMMENT ON COLUMN "lexemes"."id" IS 'Auto-generated UUID primary key'; COMMENT ON COLUMN "lexemes"."created_at" IS 'Timestamp when the record was created'; COMMENT ON COLUMN "lexemes"."created_by" IS 'UUID of the user or process that created the record'; COMMENT ON COLUMN "lexemes"."updated_at" IS 'Timestamp when the record was last updated'; COMMENT ON COLUMN "lexemes"."updated_by" IS 'UUID of the user or process that last updated the record'; COMMENT ON COLUMN "lexemes"."deleted_at" IS 'Timestamp when the record was soft-deleted'; COMMENT ON COLUMN "lexemes"."deleted_by" IS 'UUID of the user or process that soft-deleted the record'; COMMENT ON COLUMN "lexemes"."lemma" IS 'Dictionary headword (lemma), e.g. ''amō'''; COMMENT ON COLUMN "lexemes"."disambiguator" IS 'Disambiguation index when multiple entries share the same lemma (0-based)'; COMMENT ON COLUMN "lexemes"."etymology" IS 'Etymology of the word (Latin or Greek origin)'; COMMENT ON COLUMN "lexemes"."part_of_speech" IS 'Grammatical part of speech'; COMMENT ON COLUMN "lexemes"."inflection_id" IS 'Auto-generated UUID; discriminator column ''type'' selects the child entity'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9204890678d644ba216ae116e3" ON "lexemes"  ("lemma") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3a03721bc1b266578e9afad966" ON "lexemes"  ("inflection_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f6fa0a0a5e197c157882f29c22" ON "lexemes"  ("part_of_speech") `,
    );
    await queryRunner.query(
      `COMMENT ON TABLE "lexemes" IS 'A dictionary entry representing a Latin word form with its translations, principal parts, pronunciation, and inflection data'`,
    );
    await queryRunner.query(
      `CREATE TABLE "word_forms" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_by" uuid, "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, "word_id" uuid NOT NULL, "form_id" uuid NOT NULL, CONSTRAINT "PK_63a955b077bd9a1209a6286a8de" PRIMARY KEY ("id")); COMMENT ON COLUMN "word_forms"."id" IS 'Auto-generated UUID primary key'; COMMENT ON COLUMN "word_forms"."created_at" IS 'Timestamp when the record was created'; COMMENT ON COLUMN "word_forms"."created_by" IS 'UUID of the user or process that created the record'; COMMENT ON COLUMN "word_forms"."updated_at" IS 'Timestamp when the record was last updated'; COMMENT ON COLUMN "word_forms"."updated_by" IS 'UUID of the user or process that last updated the record'; COMMENT ON COLUMN "word_forms"."deleted_at" IS 'Timestamp when the record was soft-deleted'; COMMENT ON COLUMN "word_forms"."deleted_by" IS 'UUID of the user or process that soft-deleted the record'; COMMENT ON COLUMN "word_forms"."word_id" IS 'Auto-generated UUID primary key'; COMMENT ON COLUMN "word_forms"."form_id" IS 'Auto-generated UUID primary key'`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_a3450e22c3c4ab78e8f3f817c8" ON "word_forms"  ("word_id", "form_id") `,
    );
    await queryRunner.query(
      `COMMENT ON TABLE "word_forms" IS 'Junction table linking a normalized Latin word string to the morphological forms it can surface as'`,
    );
    await queryRunner.query(
      `CREATE TABLE "word_lexemes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_by" uuid, "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, "word_id" uuid NOT NULL, "lexeme_id" uuid NOT NULL, CONSTRAINT "PK_3f773610b2d1c455b70d72915c9" PRIMARY KEY ("id")); COMMENT ON COLUMN "word_lexemes"."id" IS 'Auto-generated UUID primary key'; COMMENT ON COLUMN "word_lexemes"."created_at" IS 'Timestamp when the record was created'; COMMENT ON COLUMN "word_lexemes"."created_by" IS 'UUID of the user or process that created the record'; COMMENT ON COLUMN "word_lexemes"."updated_at" IS 'Timestamp when the record was last updated'; COMMENT ON COLUMN "word_lexemes"."updated_by" IS 'UUID of the user or process that last updated the record'; COMMENT ON COLUMN "word_lexemes"."deleted_at" IS 'Timestamp when the record was soft-deleted'; COMMENT ON COLUMN "word_lexemes"."deleted_by" IS 'UUID of the user or process that soft-deleted the record'; COMMENT ON COLUMN "word_lexemes"."word_id" IS 'Auto-generated UUID primary key'; COMMENT ON COLUMN "word_lexemes"."lexeme_id" IS 'Auto-generated UUID primary key'`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_3bfcf800c79bf43fa516db099d" ON "word_lexemes"  ("word_id", "lexeme_id") `,
    );
    await queryRunner.query(
      `COMMENT ON TABLE "word_lexemes" IS 'Junction table linking a normalized Latin word string to the lexemes (dictionary entries) it can represent'`,
    );
    await queryRunner.query(
      `CREATE TABLE "words" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_by" uuid, "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, "word" character varying NOT NULL, CONSTRAINT "UQ_38a98e41b6be0f379166dc2b58d" UNIQUE ("word"), CONSTRAINT "PK_feaf97accb69a7f355fa6f58a3d" PRIMARY KEY ("id")); COMMENT ON COLUMN "words"."id" IS 'Auto-generated UUID primary key'; COMMENT ON COLUMN "words"."created_at" IS 'Timestamp when the record was created'; COMMENT ON COLUMN "words"."created_by" IS 'UUID of the user or process that created the record'; COMMENT ON COLUMN "words"."updated_at" IS 'Timestamp when the record was last updated'; COMMENT ON COLUMN "words"."updated_by" IS 'UUID of the user or process that last updated the record'; COMMENT ON COLUMN "words"."deleted_at" IS 'Timestamp when the record was soft-deleted'; COMMENT ON COLUMN "words"."deleted_by" IS 'UUID of the user or process that soft-deleted the record'; COMMENT ON COLUMN "words"."word" IS 'The Latin word as written'`,
    );
    await queryRunner.query(
      `COMMENT ON TABLE "words" IS 'A Latin word string that maps to one or more dictionary entries'`,
    );
    await queryRunner.query(
      `ALTER TABLE "forms" ADD CONSTRAINT "FK_52ebb86789cf513c7fb44ab9a95" FOREIGN KEY ("lexeme_id") REFERENCES "lexemes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "principal_parts" ADD CONSTRAINT "FK_95d23e3a9561dea102f7bf9325e" FOREIGN KEY ("lexeme_id") REFERENCES "lexemes"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "pronunciations" ADD CONSTRAINT "FK_ccf78e53911b7c121a65192c89d" FOREIGN KEY ("lexeme_id") REFERENCES "lexemes"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "translations" ADD CONSTRAINT "FK_03033925e968b7c9430896d55f8" FOREIGN KEY ("lexeme_id") REFERENCES "lexemes"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "lexemes" ADD CONSTRAINT "FK_3a03721bc1b266578e9afad9665" FOREIGN KEY ("inflection_id") REFERENCES "inflections"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "word_forms" ADD CONSTRAINT "FK_54256ad366638dd2243dcd88b25" FOREIGN KEY ("word_id") REFERENCES "words"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "word_forms" ADD CONSTRAINT "FK_f19edc2c148cc8536b7bba7afa9" FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "word_lexemes" ADD CONSTRAINT "FK_579999929ed6b899e769cd234ba" FOREIGN KEY ("word_id") REFERENCES "words"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "word_lexemes" ADD CONSTRAINT "FK_643892e2709e1d49641fb965b82" FOREIGN KEY ("lexeme_id") REFERENCES "lexemes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  /**
   *
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "word_lexemes" DROP CONSTRAINT "FK_643892e2709e1d49641fb965b82"`,
    );
    await queryRunner.query(
      `ALTER TABLE "word_lexemes" DROP CONSTRAINT "FK_579999929ed6b899e769cd234ba"`,
    );
    await queryRunner.query(
      `ALTER TABLE "word_forms" DROP CONSTRAINT "FK_f19edc2c148cc8536b7bba7afa9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "word_forms" DROP CONSTRAINT "FK_54256ad366638dd2243dcd88b25"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lexemes" DROP CONSTRAINT "FK_3a03721bc1b266578e9afad9665"`,
    );
    await queryRunner.query(
      `ALTER TABLE "translations" DROP CONSTRAINT "FK_03033925e968b7c9430896d55f8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pronunciations" DROP CONSTRAINT "FK_ccf78e53911b7c121a65192c89d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "principal_parts" DROP CONSTRAINT "FK_95d23e3a9561dea102f7bf9325e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "forms" DROP CONSTRAINT "FK_52ebb86789cf513c7fb44ab9a95"`,
    );
    await queryRunner.query(`COMMENT ON TABLE "words" IS NULL`);
    await queryRunner.query(`DROP TABLE "words"`);
    await queryRunner.query(`COMMENT ON TABLE "word_lexemes" IS NULL`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3bfcf800c79bf43fa516db099d"`,
    );
    await queryRunner.query(`DROP TABLE "word_lexemes"`);
    await queryRunner.query(`COMMENT ON TABLE "word_forms" IS NULL`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a3450e22c3c4ab78e8f3f817c8"`,
    );
    await queryRunner.query(`DROP TABLE "word_forms"`);
    await queryRunner.query(`COMMENT ON TABLE "lexemes" IS NULL`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f6fa0a0a5e197c157882f29c22"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3a03721bc1b266578e9afad966"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9204890678d644ba216ae116e3"`,
    );
    await queryRunner.query(`DROP TABLE "lexemes"`);
    await queryRunner.query(`DROP TYPE "public"."lexemes_part_of_speech_enum"`);
    await queryRunner.query(`COMMENT ON TABLE "translations" IS NULL`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9bc0b8d1aa44faf6ebfde865a2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6dba6d45fe6d365d0373220f0f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_03033925e968b7c9430896d55f"`,
    );
    await queryRunner.query(`DROP TABLE "translations"`);
    await queryRunner.query(
      `DELETE FROM "public"."typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "database" = $3 AND "schema" = $4 AND "table" = $5`,
      [
        "GENERATED_COLUMN",
        "translation_full_text_search",
        "postgres",
        "public",
        "translations",
      ],
    );
    await queryRunner.query(`COMMENT ON TABLE "pronunciations" IS NULL`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8fc53b1cbb6c5683b37f65a328"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8de57efb4c40b209b2883c3d8c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_81c176364b794cdcdf309a7a60"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ccf78e53911b7c121a65192c89"`,
    );
    await queryRunner.query(`DROP TABLE "pronunciations"`);
    await queryRunner.query(`DROP TYPE "public"."pronunciations_variant_enum"`);
    await queryRunner.query(`COMMENT ON TABLE "principal_parts" IS NULL`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_95d23e3a9561dea102f7bf9325"`,
    );
    await queryRunner.query(`DROP TABLE "principal_parts"`);
    await queryRunner.query(`COMMENT ON TABLE "inflections" IS NULL`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2f191c1029749f9f01b877e7f8"`,
    );
    await queryRunner.query(`DROP TABLE "inflections"`);
    await queryRunner.query(
      `DROP TYPE "public"."inflections_conjugation_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."inflections_case_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."inflections_adverb_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."inflections_degree_enum"`);
    await queryRunner.query(`DROP TYPE "public"."inflections_gender_enum"`);
    await queryRunner.query(`DROP TYPE "public"."inflections_declension_enum"`);
    await queryRunner.query(`COMMENT ON TABLE "forms" IS NULL`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2bc463838022e5cc652df63c4a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_52ebb86789cf513c7fb44ab9a9"`,
    );
    await queryRunner.query(`DROP TABLE "forms"`);
    await queryRunner.query(`DROP TYPE "public"."forms_person_enum"`);
    await queryRunner.query(`DROP TYPE "public"."forms_tense_enum"`);
    await queryRunner.query(`DROP TYPE "public"."forms_voice_enum"`);
    await queryRunner.query(`DROP TYPE "public"."forms_mood_enum"`);
    await queryRunner.query(`DROP TYPE "public"."forms_degree_enum"`);
    await queryRunner.query(`DROP TYPE "public"."forms_number_enum"`);
    await queryRunner.query(`DROP TYPE "public"."forms_form_case_enum"`);
    await queryRunner.query(`DROP TYPE "public"."forms_gender_enum"`);
  }
}
