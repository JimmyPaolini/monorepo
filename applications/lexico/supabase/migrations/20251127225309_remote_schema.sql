create extension if not exists "btree_gin" with schema "extensions";

create extension if not exists "fuzzystrmatch" with schema "extensions";

create extension if not exists "hypopg" with schema "extensions";

create extension if not exists "index_advisor" with schema "extensions";

create extension if not exists "pgjwt" with schema "extensions";

drop extension if exists "pg_net";

create extension if not exists "pg_trgm" with schema "public";

create type "public"."part_of_speech" as enum ('preposition', 'interjection', 'properNoun', 'noun', 'participle', 'numeral', 'interfix', 'proverb', 'adverb', 'abbreviation', 'circumfix', 'adjective', 'conjunction', 'idiom', 'prefix', 'phrase', 'particle', 'pronoun', 'suffix', 'determiner', 'verb');


  create table "public"."authors" (
    "id" text not null,
    "name" text not null,
    "name_tsvector" tsvector generated always as (to_tsvector('simple'::regconfig, name)) stored
      );


alter table "public"."authors" enable row level security;


  create table "public"."bookmarks" (
    "entry_id" text not null,
    "user_id" uuid not null
      );


alter table "public"."bookmarks" enable row level security;


  create table "public"."books" (
    "id" text not null,
    "title" text not null,
    "author_id" character varying,
    "title_tsvector" tsvector generated always as (to_tsvector('simple'::regconfig, title)) stored
      );


alter table "public"."books" enable row level security;


  create table "public"."entries" (
    "id" text not null,
    "part_of_speech" public.part_of_speech not null,
    "principal_parts" jsonb,
    "inflection" jsonb,
    "forms" jsonb,
    "pronunciation" jsonb,
    "etymology" text
      );


alter table "public"."entries" enable row level security;


  create table "public"."line_words" (
    "word" text not null
      );


alter table "public"."line_words" enable row level security;


  create table "public"."lines" (
    "id" text not null,
    "line" text not null,
    "line_number" integer not null,
    "line_label" text not null,
    "text_id" text,
    "line_tsvector" tsvector generated always as (to_tsvector('simple'::regconfig, line)) stored,
    "analytics" jsonb
      );


alter table "public"."lines" enable row level security;


  create table "public"."texts" (
    "id" text not null,
    "title" text not null,
    "author_id" text,
    "book_id" text,
    "title_tsvector" tsvector generated always as (to_tsvector('simple'::regconfig, title)) stored
      );


alter table "public"."texts" enable row level security;


  create table "public"."translation_words" (
    "translation_id" uuid not null,
    "word" text not null
      );


alter table "public"."translation_words" enable row level security;


  create table "public"."translations" (
    "id" uuid not null default gen_random_uuid(),
    "translation" text,
    "entry_id" text,
    "translation_tsvector" tsvector generated always as (to_tsvector('english'::regconfig, translation)) stored
      );


alter table "public"."translations" enable row level security;


  create table "public"."user_texts" (
    "id" uuid not null,
    "title" text not null,
    "text" text not null,
    "user_id" uuid
      );


alter table "public"."user_texts" enable row level security;


  create table "public"."words" (
    "word" text not null,
    "entry_id" text not null,
    "analytics" jsonb
      );


alter table "public"."words" enable row level security;

CREATE UNIQUE INDEX authors_pkey ON public.authors USING btree (id);

CREATE INDEX bookmarks_entry_id_idx ON public.bookmarks USING btree (entry_id);

CREATE UNIQUE INDEX bookmarks_pkey ON public.bookmarks USING btree (entry_id, user_id);

CREATE INDEX bookmarks_user_id_idx ON public.bookmarks USING btree (user_id);

CREATE INDEX books_author_id_idx ON public.books USING btree (author_id);

CREATE UNIQUE INDEX books_pkey ON public.books USING btree (id);

CREATE UNIQUE INDEX entries_pkey ON public.entries USING btree (id);

CREATE UNIQUE INDEX line_words_pkey ON public.line_words USING btree (word);

CREATE INDEX line_words_word_trgm_idx ON public.line_words USING gin (word public.gin_trgm_ops);

CREATE INDEX lines_line_trgm_idx ON public.lines USING gin (line public.gin_trgm_ops);

CREATE UNIQUE INDEX lines_pkey ON public.lines USING btree (id);

CREATE INDEX lines_text_id_idx ON public.lines USING btree (text_id);

CREATE INDEX texts_author_id_idx ON public.texts USING btree (author_id);

CREATE INDEX texts_book_id_idx ON public.texts USING btree (book_id);

CREATE UNIQUE INDEX texts_pkey ON public.texts USING btree (id);

CREATE UNIQUE INDEX translation_pkey ON public.translations USING btree (id);

CREATE INDEX translation_words_translation_id_idx ON public.translation_words USING btree (translation_id);

CREATE INDEX translation_words_word_trgm_idx ON public.translation_words USING gin (word public.gin_trgm_ops);

CREATE UNIQUE INDEX translation_words_words_pkey ON public.translation_words USING btree (translation_id, word);

CREATE INDEX translations_entry_id_idx ON public.translations USING btree (entry_id);

CREATE INDEX translations_translation_trgm_idx ON public.translations USING gin (translation public.gin_trgm_ops);

CREATE INDEX translations_translation_tsvector_idx ON public.translations USING gin (translation_tsvector);

CREATE UNIQUE INDEX user_texts_pkey ON public.user_texts USING btree (id);

CREATE INDEX user_texts_user_id_idx ON public.user_texts USING btree (user_id);

CREATE INDEX words_entry_id_idx ON public.words USING btree (entry_id);

CREATE UNIQUE INDEX words_pkey ON public.words USING btree (word, entry_id);

CREATE INDEX words_word_trgm_idx ON public.words USING gin (word public.gin_trgm_ops);

alter table "public"."authors" add constraint "authors_pkey" PRIMARY KEY using index "authors_pkey";

alter table "public"."bookmarks" add constraint "bookmarks_pkey" PRIMARY KEY using index "bookmarks_pkey";

alter table "public"."books" add constraint "books_pkey" PRIMARY KEY using index "books_pkey";

alter table "public"."entries" add constraint "entries_pkey" PRIMARY KEY using index "entries_pkey";

alter table "public"."line_words" add constraint "line_words_pkey" PRIMARY KEY using index "line_words_pkey";

alter table "public"."lines" add constraint "lines_pkey" PRIMARY KEY using index "lines_pkey";

alter table "public"."texts" add constraint "texts_pkey" PRIMARY KEY using index "texts_pkey";

alter table "public"."translation_words" add constraint "translation_words_words_pkey" PRIMARY KEY using index "translation_words_words_pkey";

alter table "public"."translations" add constraint "translation_pkey" PRIMARY KEY using index "translation_pkey";

alter table "public"."user_texts" add constraint "user_texts_pkey" PRIMARY KEY using index "user_texts_pkey";

alter table "public"."words" add constraint "words_pkey" PRIMARY KEY using index "words_pkey";

alter table "public"."bookmarks" add constraint "bookmarks_entryId_fkey" FOREIGN KEY (entry_id) REFERENCES public.entries(id) not valid;

alter table "public"."bookmarks" validate constraint "bookmarks_entryId_fkey";

alter table "public"."bookmarks" add constraint "bookmarks_userId_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."bookmarks" validate constraint "bookmarks_userId_fkey";

alter table "public"."books" add constraint "books_authorId_fkey" FOREIGN KEY (author_id) REFERENCES public.authors(id) not valid;

alter table "public"."books" validate constraint "books_authorId_fkey";

alter table "public"."lines" add constraint "lines_textId_fkey" FOREIGN KEY (text_id) REFERENCES public.texts(id) not valid;

alter table "public"."lines" validate constraint "lines_textId_fkey";

alter table "public"."texts" add constraint "texts_authorId_fkey" FOREIGN KEY (author_id) REFERENCES public.authors(id) not valid;

alter table "public"."texts" validate constraint "texts_authorId_fkey";

alter table "public"."texts" add constraint "texts_bookId_fkey" FOREIGN KEY (book_id) REFERENCES public.books(id) not valid;

alter table "public"."texts" validate constraint "texts_bookId_fkey";

alter table "public"."translation_words" add constraint "translation_words_words_translation_id_fkey" FOREIGN KEY (translation_id) REFERENCES public.translations(id) not valid;

alter table "public"."translation_words" validate constraint "translation_words_words_translation_id_fkey";

alter table "public"."translations" add constraint "translations_entryId_fkey" FOREIGN KEY (entry_id) REFERENCES public.entries(id) not valid;

alter table "public"."translations" validate constraint "translations_entryId_fkey";

alter table "public"."user_texts" add constraint "userTexts_userId_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."user_texts" validate constraint "userTexts_userId_fkey";

alter table "public"."words" add constraint "words_entryId_fkey" FOREIGN KEY (entry_id) REFERENCES public.entries(id) not valid;

alter table "public"."words" validate constraint "words_entryId_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.search_english(query text)
 RETURNS TABLE(id text, principal_parts jsonb, part_of_speech public.part_of_speech, inflection jsonb, pronunciation jsonb, forms jsonb, translations text[], words text[], similarities integer[])
 LANGUAGE sql
AS $function$
select
  entries.id,
  entries.principal_parts,
  entries.part_of_speech,
  entries.inflection,
  entries.pronunciation,
  entries.forms,
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
 RETURNS TABLE(id text, principal_parts jsonb, part_of_speech public.part_of_speech, inflection jsonb, pronunciation jsonb, forms jsonb, translations text[], words text[], similarities integer[])
 LANGUAGE sql
AS $function$
select
  entries.id,
  entries.principal_parts,
  entries.part_of_speech,
  entries.inflection,
  entries.pronunciation,
  entries.forms,
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

grant delete on table "public"."authors" to "anon";

grant insert on table "public"."authors" to "anon";

grant references on table "public"."authors" to "anon";

grant select on table "public"."authors" to "anon";

grant trigger on table "public"."authors" to "anon";

grant truncate on table "public"."authors" to "anon";

grant update on table "public"."authors" to "anon";

grant delete on table "public"."authors" to "authenticated";

grant insert on table "public"."authors" to "authenticated";

grant references on table "public"."authors" to "authenticated";

grant select on table "public"."authors" to "authenticated";

grant trigger on table "public"."authors" to "authenticated";

grant truncate on table "public"."authors" to "authenticated";

grant update on table "public"."authors" to "authenticated";

grant delete on table "public"."authors" to "service_role";

grant insert on table "public"."authors" to "service_role";

grant references on table "public"."authors" to "service_role";

grant select on table "public"."authors" to "service_role";

grant trigger on table "public"."authors" to "service_role";

grant truncate on table "public"."authors" to "service_role";

grant update on table "public"."authors" to "service_role";

grant delete on table "public"."bookmarks" to "anon";

grant insert on table "public"."bookmarks" to "anon";

grant references on table "public"."bookmarks" to "anon";

grant select on table "public"."bookmarks" to "anon";

grant trigger on table "public"."bookmarks" to "anon";

grant truncate on table "public"."bookmarks" to "anon";

grant update on table "public"."bookmarks" to "anon";

grant delete on table "public"."bookmarks" to "authenticated";

grant insert on table "public"."bookmarks" to "authenticated";

grant references on table "public"."bookmarks" to "authenticated";

grant select on table "public"."bookmarks" to "authenticated";

grant trigger on table "public"."bookmarks" to "authenticated";

grant truncate on table "public"."bookmarks" to "authenticated";

grant update on table "public"."bookmarks" to "authenticated";

grant delete on table "public"."bookmarks" to "service_role";

grant insert on table "public"."bookmarks" to "service_role";

grant references on table "public"."bookmarks" to "service_role";

grant select on table "public"."bookmarks" to "service_role";

grant trigger on table "public"."bookmarks" to "service_role";

grant truncate on table "public"."bookmarks" to "service_role";

grant update on table "public"."bookmarks" to "service_role";

grant delete on table "public"."books" to "anon";

grant insert on table "public"."books" to "anon";

grant references on table "public"."books" to "anon";

grant select on table "public"."books" to "anon";

grant trigger on table "public"."books" to "anon";

grant truncate on table "public"."books" to "anon";

grant update on table "public"."books" to "anon";

grant delete on table "public"."books" to "authenticated";

grant insert on table "public"."books" to "authenticated";

grant references on table "public"."books" to "authenticated";

grant select on table "public"."books" to "authenticated";

grant trigger on table "public"."books" to "authenticated";

grant truncate on table "public"."books" to "authenticated";

grant update on table "public"."books" to "authenticated";

grant delete on table "public"."books" to "service_role";

grant insert on table "public"."books" to "service_role";

grant references on table "public"."books" to "service_role";

grant select on table "public"."books" to "service_role";

grant trigger on table "public"."books" to "service_role";

grant truncate on table "public"."books" to "service_role";

grant update on table "public"."books" to "service_role";

grant delete on table "public"."entries" to "anon";

grant insert on table "public"."entries" to "anon";

grant references on table "public"."entries" to "anon";

grant select on table "public"."entries" to "anon";

grant trigger on table "public"."entries" to "anon";

grant truncate on table "public"."entries" to "anon";

grant update on table "public"."entries" to "anon";

grant delete on table "public"."entries" to "authenticated";

grant insert on table "public"."entries" to "authenticated";

grant references on table "public"."entries" to "authenticated";

grant select on table "public"."entries" to "authenticated";

grant trigger on table "public"."entries" to "authenticated";

grant truncate on table "public"."entries" to "authenticated";

grant update on table "public"."entries" to "authenticated";

grant delete on table "public"."entries" to "service_role";

grant insert on table "public"."entries" to "service_role";

grant references on table "public"."entries" to "service_role";

grant select on table "public"."entries" to "service_role";

grant trigger on table "public"."entries" to "service_role";

grant truncate on table "public"."entries" to "service_role";

grant update on table "public"."entries" to "service_role";

grant delete on table "public"."line_words" to "anon";

grant insert on table "public"."line_words" to "anon";

grant references on table "public"."line_words" to "anon";

grant select on table "public"."line_words" to "anon";

grant trigger on table "public"."line_words" to "anon";

grant truncate on table "public"."line_words" to "anon";

grant update on table "public"."line_words" to "anon";

grant delete on table "public"."line_words" to "authenticated";

grant insert on table "public"."line_words" to "authenticated";

grant references on table "public"."line_words" to "authenticated";

grant select on table "public"."line_words" to "authenticated";

grant trigger on table "public"."line_words" to "authenticated";

grant truncate on table "public"."line_words" to "authenticated";

grant update on table "public"."line_words" to "authenticated";

grant delete on table "public"."line_words" to "service_role";

grant insert on table "public"."line_words" to "service_role";

grant references on table "public"."line_words" to "service_role";

grant select on table "public"."line_words" to "service_role";

grant trigger on table "public"."line_words" to "service_role";

grant truncate on table "public"."line_words" to "service_role";

grant update on table "public"."line_words" to "service_role";

grant delete on table "public"."lines" to "anon";

grant insert on table "public"."lines" to "anon";

grant references on table "public"."lines" to "anon";

grant select on table "public"."lines" to "anon";

grant trigger on table "public"."lines" to "anon";

grant truncate on table "public"."lines" to "anon";

grant update on table "public"."lines" to "anon";

grant delete on table "public"."lines" to "authenticated";

grant insert on table "public"."lines" to "authenticated";

grant references on table "public"."lines" to "authenticated";

grant select on table "public"."lines" to "authenticated";

grant trigger on table "public"."lines" to "authenticated";

grant truncate on table "public"."lines" to "authenticated";

grant update on table "public"."lines" to "authenticated";

grant delete on table "public"."lines" to "service_role";

grant insert on table "public"."lines" to "service_role";

grant references on table "public"."lines" to "service_role";

grant select on table "public"."lines" to "service_role";

grant trigger on table "public"."lines" to "service_role";

grant truncate on table "public"."lines" to "service_role";

grant update on table "public"."lines" to "service_role";

grant delete on table "public"."texts" to "anon";

grant insert on table "public"."texts" to "anon";

grant references on table "public"."texts" to "anon";

grant select on table "public"."texts" to "anon";

grant trigger on table "public"."texts" to "anon";

grant truncate on table "public"."texts" to "anon";

grant update on table "public"."texts" to "anon";

grant delete on table "public"."texts" to "authenticated";

grant insert on table "public"."texts" to "authenticated";

grant references on table "public"."texts" to "authenticated";

grant select on table "public"."texts" to "authenticated";

grant trigger on table "public"."texts" to "authenticated";

grant truncate on table "public"."texts" to "authenticated";

grant update on table "public"."texts" to "authenticated";

grant delete on table "public"."texts" to "service_role";

grant insert on table "public"."texts" to "service_role";

grant references on table "public"."texts" to "service_role";

grant select on table "public"."texts" to "service_role";

grant trigger on table "public"."texts" to "service_role";

grant truncate on table "public"."texts" to "service_role";

grant update on table "public"."texts" to "service_role";

grant delete on table "public"."translation_words" to "anon";

grant insert on table "public"."translation_words" to "anon";

grant references on table "public"."translation_words" to "anon";

grant select on table "public"."translation_words" to "anon";

grant trigger on table "public"."translation_words" to "anon";

grant truncate on table "public"."translation_words" to "anon";

grant update on table "public"."translation_words" to "anon";

grant delete on table "public"."translation_words" to "authenticated";

grant insert on table "public"."translation_words" to "authenticated";

grant references on table "public"."translation_words" to "authenticated";

grant select on table "public"."translation_words" to "authenticated";

grant trigger on table "public"."translation_words" to "authenticated";

grant truncate on table "public"."translation_words" to "authenticated";

grant update on table "public"."translation_words" to "authenticated";

grant delete on table "public"."translation_words" to "service_role";

grant insert on table "public"."translation_words" to "service_role";

grant references on table "public"."translation_words" to "service_role";

grant select on table "public"."translation_words" to "service_role";

grant trigger on table "public"."translation_words" to "service_role";

grant truncate on table "public"."translation_words" to "service_role";

grant update on table "public"."translation_words" to "service_role";

grant delete on table "public"."translations" to "anon";

grant insert on table "public"."translations" to "anon";

grant references on table "public"."translations" to "anon";

grant select on table "public"."translations" to "anon";

grant trigger on table "public"."translations" to "anon";

grant truncate on table "public"."translations" to "anon";

grant update on table "public"."translations" to "anon";

grant delete on table "public"."translations" to "authenticated";

grant insert on table "public"."translations" to "authenticated";

grant references on table "public"."translations" to "authenticated";

grant select on table "public"."translations" to "authenticated";

grant trigger on table "public"."translations" to "authenticated";

grant truncate on table "public"."translations" to "authenticated";

grant update on table "public"."translations" to "authenticated";

grant delete on table "public"."translations" to "service_role";

grant insert on table "public"."translations" to "service_role";

grant references on table "public"."translations" to "service_role";

grant select on table "public"."translations" to "service_role";

grant trigger on table "public"."translations" to "service_role";

grant truncate on table "public"."translations" to "service_role";

grant update on table "public"."translations" to "service_role";

grant delete on table "public"."user_texts" to "anon";

grant insert on table "public"."user_texts" to "anon";

grant references on table "public"."user_texts" to "anon";

grant select on table "public"."user_texts" to "anon";

grant trigger on table "public"."user_texts" to "anon";

grant truncate on table "public"."user_texts" to "anon";

grant update on table "public"."user_texts" to "anon";

grant delete on table "public"."user_texts" to "authenticated";

grant insert on table "public"."user_texts" to "authenticated";

grant references on table "public"."user_texts" to "authenticated";

grant select on table "public"."user_texts" to "authenticated";

grant trigger on table "public"."user_texts" to "authenticated";

grant truncate on table "public"."user_texts" to "authenticated";

grant update on table "public"."user_texts" to "authenticated";

grant delete on table "public"."user_texts" to "service_role";

grant insert on table "public"."user_texts" to "service_role";

grant references on table "public"."user_texts" to "service_role";

grant select on table "public"."user_texts" to "service_role";

grant trigger on table "public"."user_texts" to "service_role";

grant truncate on table "public"."user_texts" to "service_role";

grant update on table "public"."user_texts" to "service_role";

grant delete on table "public"."words" to "anon";

grant insert on table "public"."words" to "anon";

grant references on table "public"."words" to "anon";

grant select on table "public"."words" to "anon";

grant trigger on table "public"."words" to "anon";

grant truncate on table "public"."words" to "anon";

grant update on table "public"."words" to "anon";

grant delete on table "public"."words" to "authenticated";

grant insert on table "public"."words" to "authenticated";

grant references on table "public"."words" to "authenticated";

grant select on table "public"."words" to "authenticated";

grant trigger on table "public"."words" to "authenticated";

grant truncate on table "public"."words" to "authenticated";

grant update on table "public"."words" to "authenticated";

grant delete on table "public"."words" to "service_role";

grant insert on table "public"."words" to "service_role";

grant references on table "public"."words" to "service_role";

grant select on table "public"."words" to "service_role";

grant trigger on table "public"."words" to "service_role";

grant truncate on table "public"."words" to "service_role";

grant update on table "public"."words" to "service_role";


  create policy "Enable read access for all users"
  on "public"."authors"
  as permissive
  for select
  to public
using (true);



  create policy "Enable read access for users based on userId"
  on "public"."bookmarks"
  as permissive
  for select
  to public
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Enable read access for all users"
  on "public"."books"
  as permissive
  for select
  to public
using (true);



  create policy "Enable read access for all users"
  on "public"."entries"
  as permissive
  for select
  to public
using (true);



  create policy "Enable read access for all users"
  on "public"."lines"
  as permissive
  for select
  to public
using (true);



  create policy "Enable read access for all users"
  on "public"."texts"
  as permissive
  for select
  to public
using (true);



  create policy "Enable read access for all users"
  on "public"."translation_words"
  as permissive
  for select
  to public
using (true);



  create policy "Enable read access for all users"
  on "public"."translations"
  as permissive
  for select
  to public
using (true);



  create policy "Enable read access for users based on userId"
  on "public"."user_texts"
  as permissive
  for all
  to public
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Enable read access for all users"
  on "public"."words"
  as permissive
  for select
  to public
using (true);



