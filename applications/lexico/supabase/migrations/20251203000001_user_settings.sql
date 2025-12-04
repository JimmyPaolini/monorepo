-- Create user_settings table for storing user preferences
create table "public"."user_settings" (
  "id" uuid not null default gen_random_uuid(),
  "user_id" uuid not null,
  "font_size" integer not null default 16,
  "theme" text not null default 'dark',
  "translations_expanded_default" boolean not null default true,
  "forms_expanded_default" boolean not null default false,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now()
);

alter table "public"."user_settings" enable row level security;

-- Create primary key
CREATE UNIQUE INDEX user_settings_pkey ON public.user_settings USING btree (id);
alter table "public"."user_settings" add constraint "user_settings_pkey" PRIMARY KEY using index "user_settings_pkey";

-- Create unique index on user_id (one settings row per user)
CREATE UNIQUE INDEX user_settings_user_id_idx ON public.user_settings USING btree (user_id);

-- Add foreign key constraint to auth.users
alter table "public"."user_settings" add constraint "user_settings_user_id_fkey"
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;
alter table "public"."user_settings" validate constraint "user_settings_user_id_fkey";

-- Grant permissions
grant delete on table "public"."user_settings" to "anon";
grant insert on table "public"."user_settings" to "anon";
grant references on table "public"."user_settings" to "anon";
grant select on table "public"."user_settings" to "anon";
grant trigger on table "public"."user_settings" to "anon";
grant truncate on table "public"."user_settings" to "anon";
grant update on table "public"."user_settings" to "anon";

grant delete on table "public"."user_settings" to "authenticated";
grant insert on table "public"."user_settings" to "authenticated";
grant references on table "public"."user_settings" to "authenticated";
grant select on table "public"."user_settings" to "authenticated";
grant trigger on table "public"."user_settings" to "authenticated";
grant truncate on table "public"."user_settings" to "authenticated";
grant update on table "public"."user_settings" to "authenticated";

grant delete on table "public"."user_settings" to "service_role";
grant insert on table "public"."user_settings" to "service_role";
grant references on table "public"."user_settings" to "service_role";
grant select on table "public"."user_settings" to "service_role";
grant trigger on table "public"."user_settings" to "service_role";
grant truncate on table "public"."user_settings" to "service_role";
grant update on table "public"."user_settings" to "service_role";

-- RLS policies: users can only access their own settings
create policy "Users can view own settings"
  on "public"."user_settings"
  as permissive
  for select
  to authenticated
  using ((auth.uid() = user_id));

create policy "Users can insert own settings"
  on "public"."user_settings"
  as permissive
  for insert
  to authenticated
  with check ((auth.uid() = user_id));

create policy "Users can update own settings"
  on "public"."user_settings"
  as permissive
  for update
  to authenticated
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

create policy "Users can delete own settings"
  on "public"."user_settings"
  as permissive
  for delete
  to authenticated
  using ((auth.uid() = user_id));

-- Function to automatically update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to update updated_at on changes
create trigger on_user_settings_updated
  before update on public.user_settings
  for each row
  execute function public.handle_updated_at();

-- Function to automatically create settings for new users
create or replace function public.handle_new_user_settings()
returns trigger as $$
begin
  insert into public.user_settings (user_id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create settings when a new user is created
create trigger on_auth_user_created_settings
  after insert on auth.users
  for each row
  execute function public.handle_new_user_settings();
