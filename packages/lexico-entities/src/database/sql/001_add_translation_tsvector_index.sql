-- Add a GIN index on a tsvector of the translations.translation column for
-- efficient full-text English → Latin search. TypeORM's synchronize mode
-- cannot generate GIN/tsvector indexes, so run this once after the schema
-- is synced.
--
-- Usage:
--   psql -d <database> -f 001_add_translation_tsvector_index.sql

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_translations_translation_fts
  ON translations
  USING GIN (to_tsvector('english', translation));
