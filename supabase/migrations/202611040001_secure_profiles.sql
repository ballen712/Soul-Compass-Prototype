-- Apply only to the user's Supabase project, never the unrelated Replit DB.
begin;
create schema if not exists app_private;
revoke all on schema app_private from public;
grant usage on schema app_private to authenticated;

create or replace function app_private.valid_location(j jsonb)
returns boolean language plpgsql stable set search_path = '' as $$
begin
  if jsonb_typeof(j) <> 'object' or j is null then return false; end if;
  if (select count(*) from jsonb_object_keys(j)) <> 5 then return false; end if;
  return coalesce(
    jsonb_typeof(j->'city') = 'string' and length(btrim(j->>'city')) between 1 and 120
    and jsonb_typeof(j->'country') = 'string' and length(btrim(j->>'country')) between 1 and 120
    and jsonb_typeof(j->'latitude') = 'number' and (j->>'latitude')::numeric between -90 and 90
    and jsonb_typeof(j->'longitude') = 'number' and (j->>'longitude')::numeric between -180 and 180
    and jsonb_typeof(j->'timeZone') = 'string' and length(j->>'timeZone') <= 100
    and exists(select 1 from pg_catalog.pg_timezone_names where name = j->>'timeZone'), false);
exception when others then return false;
end $$;

create or replace function app_private.valid_profile(j jsonb)
returns boolean language plpgsql stable set search_path = '' as $$
declare bt jsonb;
begin
  if j is null or jsonb_typeof(j) <> 'object' or pg_column_size(j) > 8192 then return false; end if;
  if (select count(*) from jsonb_object_keys(j)) <> 4 then return false; end if;
  if jsonb_typeof(j->'birthDate') is distinct from 'string' or (j->>'birthDate') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
     or to_char((j->>'birthDate')::date, 'YYYY-MM-DD') <> j->>'birthDate' then return false; end if;
  bt := j->'birthTime';
  if jsonb_typeof(bt) <> 'object' then return false; end if;
  if bt->>'status' = 'unknown' then
    if (select count(*) from jsonb_object_keys(bt)) <> 1 then return false; end if;
  elsif bt->>'status' = 'known' then
    if (select count(*) from jsonb_object_keys(bt)) <> 2 or jsonb_typeof(bt->'localTime') is distinct from 'string'
      or (bt->>'localTime') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then return false; end if;
  else return false;
  end if;
  return coalesce(app_private.valid_location(j->'birthPlace')
    and (j->'currentResidence' = 'null'::jsonb or app_private.valid_location(j->'currentResidence')), false);
exception when others then return false;
end $$;

create or replace function app_private.valid_crystals(j jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
begin
  if j is null or jsonb_typeof(j) <> 'array' or jsonb_array_length(j) > 128 then return false; end if;
  return not exists(select 1 from jsonb_array_elements(j) e where jsonb_typeof(e) <> 'string' or (e #>> '{}') !~ '^[a-z0-9-]{1,64}$')
    and (select count(*) from jsonb_array_elements(j)) = (select count(distinct value) from jsonb_array_elements(j));
exception when others then return false;
end $$;

create or replace function app_private.valid_preferences(j jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare p jsonb;
begin
  if j is null or jsonb_typeof(j) <> 'object' or pg_column_size(j) > 8192 then return false; end if;
  if (select count(*) from jsonb_object_keys(j)) <> 3 then return false; end if;
  p := j->'crystalPreferences';
  return coalesce(jsonb_typeof(j->'language') = 'string' and length(j->>'language') <= 35
    and (j->>'language') ~ '^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$'
    and app_private.valid_crystals(j->'crystalCollection')
    and jsonb_typeof(p) = 'object' and (select count(*) from jsonb_object_keys(p)) = 2
    and app_private.valid_crystals(p->'hiddenCrystals')
    and jsonb_typeof(p->'intentions') = 'array' and jsonb_array_length(p->'intentions') <= 20
    and not exists(select 1 from jsonb_array_elements(p->'intentions') e
      where jsonb_typeof(e) <> 'string' or length(btrim(e #>> '{}')) not between 1 and 40), false);
exception when others then return false;
end $$;

create table public.profiles (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  profile jsonb not null check (app_private.valid_profile(profile)),
  preferences jsonb not null check (app_private.valid_preferences(preferences)),
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create or replace function app_private.profile_version()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.user_id := old.user_id;
  new.created_at := old.created_at;
  new.updated_at := pg_catalog.now();
  new.version := old.version + 1;
  return new;
end $$;
create trigger profile_version before update on public.profiles
for each row execute function app_private.profile_version();

alter table public.profiles enable row level security;
alter table public.profiles force row level security;
create policy profiles_read_own on public.profiles for select to authenticated
  using ((select auth.uid()) = user_id);
create policy profiles_insert_own on public.profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy profiles_update_own on public.profiles for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy profiles_delete_own on public.profiles for delete to authenticated
  using ((select auth.uid()) = user_id);
revoke all on public.profiles from public, anon, authenticated;
grant select, delete on public.profiles to authenticated;
-- Ownership/version/timestamps can never be supplied or changed by client roles.
grant insert (profile, preferences), update (profile, preferences) on public.profiles to authenticated;
revoke all on all functions in schema app_private from public;
grant execute on all functions in schema app_private to authenticated;
commit;
