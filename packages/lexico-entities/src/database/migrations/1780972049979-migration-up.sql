SET lock_timeout = '10s';
SET statement_timeout = '5m';

ALTER TABLE "lines" DROP CONSTRAINT "FK_8ba479aa45ba1795a3f7e5c8d22";

ALTER TABLE "texts" DROP CONSTRAINT "FK_275807c423ad9d0b569c2b9ca81";

ALTER TABLE "texts" DROP CONSTRAINT "FK_c3172aa0d3cd4c678d44dae85cd";

COMMENT ON TABLE "authors" IS 'An author of Latin literature';

COMMENT ON TABLE "lines" IS 'A single line of classical Latin literature';

COMMENT ON TABLE "texts" IS 'A hierarchical literary work (corpus, book, text, poem, etc.)';

COMMENT ON TABLE "tokens" IS 'A single parsed token (word or punctuation) from a line of literature';

ALTER TABLE "tokens" DROP COLUMN "text";

ALTER TABLE "lines" ADD "author_id" uuid;

COMMENT ON COLUMN "lines"."author_id" IS 'Auto-generated UUID primary key';

ALTER TABLE "tokens" ADD "text_value" character varying NOT NULL;

COMMENT ON COLUMN "tokens"."text_value" IS 'The raw string value of the token';

ALTER TABLE "tokens" ADD "author_id" uuid;

COMMENT ON COLUMN "tokens"."author_id" IS 'Auto-generated UUID primary key';

ALTER TABLE "tokens" ADD "text_id" uuid;

COMMENT ON COLUMN "tokens"."text_id" IS 'Auto-generated UUID primary key';

COMMENT ON COLUMN "authors"."name" IS 'The display name of the author';

COMMENT ON COLUMN "lines"."line" IS 'The raw text content of the line';

COMMENT ON COLUMN "lines"."line_label" IS 'The display label for the line (e.g. section number or roman numeral)';

COMMENT ON COLUMN "lines"."line_number" IS 'The sequential 0-based index of the line within its text';

COMMENT ON COLUMN "lines"."slug" IS 'Unique slug identifier (e.g. ''caesar/de bello gallico_12'')';

COMMENT ON COLUMN "texts"."slug" IS 'Unique slug identifier (e.g. ''caesar/de bello gallico'')';

COMMENT ON COLUMN "texts"."title" IS 'The title of the text';

COMMENT ON COLUMN "texts"."type" IS 'The structural type of the text (e.g. ''book'', ''text'', ''collection'')';

COMMENT ON COLUMN "tokens"."index" IS 'The 0-based index of this token within its parent line';

COMMENT ON COLUMN "tokens"."is_punctuation" IS 'True if the token represents punctuation or whitespace, false if it is a word';

ALTER TABLE "lines" ADD CONSTRAINT "FK_90ccb87cbd0fd6952e1aee42482" FOREIGN KEY ("author_id") REFERENCES "authors"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "lines" ADD CONSTRAINT "FK_8ba479aa45ba1795a3f7e5c8d22" FOREIGN KEY ("text_id") REFERENCES "texts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "texts" ADD CONSTRAINT "FK_275807c423ad9d0b569c2b9ca81" FOREIGN KEY ("author_id") REFERENCES "authors"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "texts" ADD CONSTRAINT "FK_c3172aa0d3cd4c678d44dae85cd" FOREIGN KEY ("parent_text_id") REFERENCES "texts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "tokens" ADD CONSTRAINT "FK_784a19cd725470a3068fc62db39" FOREIGN KEY ("author_id") REFERENCES "authors"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "tokens" ADD CONSTRAINT "FK_4a94e9093c0191e7f01e0a2d02e" FOREIGN KEY ("text_id") REFERENCES "texts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
