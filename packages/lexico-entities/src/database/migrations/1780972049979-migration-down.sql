SET lock_timeout = '10s';
SET statement_timeout = '5m';

ALTER TABLE "tokens" DROP CONSTRAINT "FK_4a94e9093c0191e7f01e0a2d02e";

ALTER TABLE "tokens" DROP CONSTRAINT "FK_784a19cd725470a3068fc62db39";

ALTER TABLE "texts" DROP CONSTRAINT "FK_c3172aa0d3cd4c678d44dae85cd";

ALTER TABLE "texts" DROP CONSTRAINT "FK_275807c423ad9d0b569c2b9ca81";

ALTER TABLE "lines" DROP CONSTRAINT "FK_8ba479aa45ba1795a3f7e5c8d22";

ALTER TABLE "lines" DROP CONSTRAINT "FK_90ccb87cbd0fd6952e1aee42482";

COMMENT ON COLUMN "tokens"."is_punctuation" IS NULL;

COMMENT ON COLUMN "tokens"."index" IS NULL;

COMMENT ON COLUMN "texts"."type" IS NULL;

COMMENT ON COLUMN "texts"."title" IS NULL;

COMMENT ON COLUMN "texts"."slug" IS 'Unique slug identifier';

COMMENT ON COLUMN "lines"."slug" IS 'Unique slug identifier (e.g. text_id_lineNumber)';

COMMENT ON COLUMN "lines"."line_number" IS NULL;

COMMENT ON COLUMN "lines"."line_label" IS NULL;

COMMENT ON COLUMN "lines"."line" IS NULL;

COMMENT ON COLUMN "authors"."name" IS NULL;

COMMENT ON COLUMN "tokens"."text_id" IS 'Auto-generated UUID primary key';

ALTER TABLE "tokens" DROP COLUMN "text_id";

COMMENT ON COLUMN "tokens"."author_id" IS 'Auto-generated UUID primary key';

ALTER TABLE "tokens" DROP COLUMN "author_id";

COMMENT ON COLUMN "tokens"."text_value" IS 'The raw string value of the token';

ALTER TABLE "tokens" DROP COLUMN "text_value";

COMMENT ON COLUMN "lines"."author_id" IS 'Auto-generated UUID primary key';

ALTER TABLE "lines" DROP COLUMN "author_id";

ALTER TABLE "tokens" ADD "text" character varying NOT NULL;

COMMENT ON TABLE "tokens" IS NULL;

COMMENT ON TABLE "texts" IS NULL;

COMMENT ON TABLE "lines" IS NULL;

COMMENT ON TABLE "authors" IS NULL;

ALTER TABLE "texts" ADD CONSTRAINT "FK_c3172aa0d3cd4c678d44dae85cd" FOREIGN KEY ("parent_text_id") REFERENCES "texts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "texts" ADD CONSTRAINT "FK_275807c423ad9d0b569c2b9ca81" FOREIGN KEY ("author_id") REFERENCES "authors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "lines" ADD CONSTRAINT "FK_8ba479aa45ba1795a3f7e5c8d22" FOREIGN KEY ("text_id") REFERENCES "texts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
