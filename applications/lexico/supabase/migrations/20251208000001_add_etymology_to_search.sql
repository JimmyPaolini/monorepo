-- Add etymology to search functions
-- Drop existing functions first
DROP FUNCTION IF EXISTS public.search_english(text);
DROP FUNCTION IF EXISTS public.search_latin(text);

-- Recreate with etymology field
CREATE OR REPLACE FUNCTION public.search_english(query text)
 RETURNS TABLE(id text, principal_parts jsonb, part_of_speech public.part_of_speech, inflection jsonb, pronunciation jsonb, forms jsonb, etymology text, translations text[], words text[], similarities integer[])
 LANGUAGE sql
AS $function$
select
  entries.id,
  entries.principal_parts,
  entries.part_of_speech,
  entries.inflection,
  entries.pronunciation,
  entries.forms,
  entries.etymology,
  array_agg(translations.translation) as translations,
  array_agg(word) as words,
  array_agg(strict_word_similarity(word, query)) as similarities
from
  translation_words
  inner join translations on translations.id = translation_words.translation_id
  inner join entries on entries.id = translations.entry_id
where
  query <<% translation_words.word
group by entries.id
order by similarities desc
$function$
;

CREATE OR REPLACE FUNCTION public.search_latin(query text)
 RETURNS TABLE(id text, principal_parts jsonb, part_of_speech public.part_of_speech, inflection jsonb, pronunciation jsonb, forms jsonb, etymology text, translations text[], words text[], similarities integer[])
 LANGUAGE sql
AS $function$
select
  entries.id,
  entries.principal_parts,
  entries.part_of_speech,
  entries.inflection,
  entries.pronunciation,
  entries.forms,
  entries.etymology,
  array_agg(translations.translation) as translations,
  array_agg(word) as words,
  array_agg(strict_word_similarity(word, query)) as similarities
from
  entries
  join words on words.entry_id = entries.id
  join translations on translations.entry_id = entries.id
where
  query <<% word
group by entries.id
order by similarities desc
$function$
;
