SET lock_timeout = '10s';
SET statement_timeout = '5m';

ALTER TABLE "word_lexemes" DROP CONSTRAINT "FK_643892e2709e1d49641fb965b82";

ALTER TABLE "word_lexemes" DROP CONSTRAINT "FK_579999929ed6b899e769cd234ba";

ALTER TABLE "word_forms" DROP CONSTRAINT "FK_f19edc2c148cc8536b7bba7afa9";

ALTER TABLE "word_forms" DROP CONSTRAINT "FK_54256ad366638dd2243dcd88b25";

ALTER TABLE "lexemes" DROP CONSTRAINT "FK_3a03721bc1b266578e9afad9665";

ALTER TABLE "translations" DROP CONSTRAINT "FK_03033925e968b7c9430896d55f8";

ALTER TABLE "pronunciations" DROP CONSTRAINT "FK_ccf78e53911b7c121a65192c89d";

ALTER TABLE "principal_parts" DROP CONSTRAINT "FK_95d23e3a9561dea102f7bf9325e";

ALTER TABLE "forms" DROP CONSTRAINT "FK_52ebb86789cf513c7fb44ab9a95";

COMMENT ON TABLE "words" IS NULL;

DROP TABLE "words";

COMMENT ON TABLE "word_lexemes" IS NULL;

DROP INDEX "public"."IDX_3bfcf800c79bf43fa516db099d";

DROP INDEX "public"."IDX_643892e2709e1d49641fb965b8";

DROP INDEX "public"."IDX_579999929ed6b899e769cd234b";

DROP TABLE "word_lexemes";

COMMENT ON TABLE "word_forms" IS NULL;

DROP INDEX "public"."IDX_a3450e22c3c4ab78e8f3f817c8";

DROP INDEX "public"."IDX_f19edc2c148cc8536b7bba7afa";

DROP INDEX "public"."IDX_54256ad366638dd2243dcd88b2";

DROP TABLE "word_forms";

COMMENT ON TABLE "lexemes" IS NULL;

DROP INDEX "public"."IDX_f6fa0a0a5e197c157882f29c22";

DROP INDEX "public"."IDX_3a03721bc1b266578e9afad966";

DROP INDEX "public"."IDX_9204890678d644ba216ae116e3";

DROP TABLE "lexemes";

DROP TYPE "public"."lexemes_part_of_speech_enum";

COMMENT ON TABLE "translations" IS NULL;

DROP INDEX "public"."IDX_9bc0b8d1aa44faf6ebfde865a2";

DROP INDEX "public"."IDX_6dba6d45fe6d365d0373220f0f";

DROP INDEX "public"."IDX_03033925e968b7c9430896d55f";

DROP TABLE "translations";

DELETE FROM "public"."typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "database" = $3 AND "schema" = $4 AND "table" = $5;

COMMENT ON TABLE "pronunciations" IS NULL;

DROP INDEX "public"."IDX_8fc53b1cbb6c5683b37f65a328";

DROP INDEX "public"."IDX_8de57efb4c40b209b2883c3d8c";

DROP INDEX "public"."IDX_81c176364b794cdcdf309a7a60";

DROP INDEX "public"."IDX_ccf78e53911b7c121a65192c89";

DROP TABLE "pronunciations";

DROP TYPE "public"."pronunciations_variant_enum";

COMMENT ON TABLE "principal_parts" IS NULL;

DROP INDEX "public"."IDX_95d23e3a9561dea102f7bf9325";

DROP TABLE "principal_parts";

COMMENT ON TABLE "inflections" IS NULL;

DROP INDEX "public"."IDX_2f191c1029749f9f01b877e7f8";

DROP TABLE "inflections";

DROP TYPE "public"."inflections_conjugation_enum";

DROP TYPE "public"."inflections_case_enum";

DROP TYPE "public"."inflections_adverb_type_enum";

DROP TYPE "public"."inflections_degree_enum";

DROP TYPE "public"."inflections_gender_enum";

DROP TYPE "public"."inflections_declension_enum";

COMMENT ON TABLE "forms" IS NULL;

DROP INDEX "public"."IDX_2bc463838022e5cc652df63c4a";

DROP INDEX "public"."IDX_52ebb86789cf513c7fb44ab9a9";

DROP TABLE "forms";

DROP TYPE "public"."forms_person_enum";

DROP TYPE "public"."forms_tense_enum";

DROP TYPE "public"."forms_voice_enum";

DROP TYPE "public"."forms_mood_enum";

DROP TYPE "public"."forms_degree_enum";

DROP TYPE "public"."forms_number_enum";

DROP TYPE "public"."forms_form_case_enum";

DROP TYPE "public"."forms_gender_enum";
