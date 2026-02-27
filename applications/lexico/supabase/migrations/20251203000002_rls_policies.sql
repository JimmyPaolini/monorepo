-- Add missing RLS policies for bookmarks table
-- Users should be able to insert, update, and delete their own bookmarks

create policy "Users can insert own bookmarks"
  on "public"."bookmarks"
  as permissive
  for insert
  to authenticated
  with check ((auth.uid() = user_id));

create policy "Users can delete own bookmarks"
  on "public"."bookmarks"
  as permissive
  for delete
  to authenticated
  using ((auth.uid() = user_id));

-- Add missing RLS policies for user_texts table
-- The existing policy uses "for all" which should work, but let's make it explicit

-- Drop existing policy and recreate with explicit policies
drop policy if exists "Enable read access for users based on userId" on "public"."user_texts";

create policy "Users can view own texts"
  on "public"."user_texts"
  as permissive
  for select
  to authenticated
  using ((auth.uid() = user_id));

create policy "Users can insert own texts"
  on "public"."user_texts"
  as permissive
  for insert
  to authenticated
  with check ((auth.uid() = user_id));

create policy "Users can update own texts"
  on "public"."user_texts"
  as permissive
  for update
  to authenticated
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

create policy "Users can delete own texts"
  on "public"."user_texts"
  as permissive
  for delete
  to authenticated
  using ((auth.uid() = user_id));
