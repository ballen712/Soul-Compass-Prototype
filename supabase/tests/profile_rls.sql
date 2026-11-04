-- Run manually in Supabase SQL Editor AFTER the migration, preferably on a
-- development project. All fixtures and changes are rolled back. Not yet run.
begin;
insert into auth.users (id, aud, role, email, created_at, updated_at)
values
 ('f302c056-c8aa-4303-87f1-f26b5f58c101', 'authenticated', 'authenticated', 'soul-test-a@example.invalid', now(), now()),
 ('f302c056-c8aa-4303-87f1-f26b5f58c102', 'authenticated', 'authenticated', 'soul-test-b@example.invalid', now(), now());

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"f302c056-c8aa-4303-87f1-f26b5f58c101","role":"authenticated"}', true);
insert into public.profiles (profile, preferences) values (
 '{"birthDate":"1991-06-20","birthTime":{"status":"unknown"},"birthPlace":{"city":"Test","country":"Test","latitude":48,"longitude":32,"timeZone":"Europe/Kyiv"},"currentResidence":null}',
 '{"language":"en","crystalCollection":[],"crystalPreferences":{"intentions":[],"hiddenCrystals":[]}}'
);
do $$ begin
  assert (select user_id = auth.uid() from public.profiles), 'Ownership default failed';
  assert (select version = 1 from public.profiles), 'Initial version failed';
end $$;

select set_config('request.jwt.claims', '{"sub":"f302c056-c8aa-4303-87f1-f26b5f58c102","role":"authenticated"}', true);
do $$ declare affected integer; begin
  assert (select count(*) from public.profiles) = 0, 'B can read A';
  update public.profiles set preferences = '{"language":"hu","crystalCollection":[],"crystalPreferences":{"intentions":[],"hiddenCrystals":[]}}'
    where user_id = 'f302c056-c8aa-4303-87f1-f26b5f58c101';
  get diagnostics affected = row_count; assert affected = 0, 'B can update A';
  delete from public.profiles where user_id = 'f302c056-c8aa-4303-87f1-f26b5f58c101';
  get diagnostics affected = row_count; assert affected = 0, 'B can delete A';
  begin
    insert into public.profiles (user_id, profile, preferences) values
      ('f302c056-c8aa-4303-87f1-f26b5f58c101','{}','{}');
    raise exception 'Client supplied ownership was accepted';
  exception when insufficient_privilege then null;
  end;
end $$;
insert into public.profiles (profile, preferences) values (
 '{"birthDate":"2000-01-01","birthTime":{"status":"known","localTime":"10:30"},"birthPlace":{"city":"Test B","country":"Test","latitude":0,"longitude":0,"timeZone":"UTC"},"currentResidence":null}',
 '{"language":"en","crystalCollection":["amethyst"],"crystalPreferences":{"intentions":[],"hiddenCrystals":[]}}'
);
do $$ begin
  assert (select count(*) from public.profiles) = 1, 'B visibility failed';
  begin
    update public.profiles set user_id = 'f302c056-c8aa-4303-87f1-f26b5f58c101';
    raise exception 'Ownership reassignment allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.profiles set profile = profile - 'birthDate' || '{"unexpected":"1991-06-20"}'::jsonb;
    raise exception 'Missing date accepted by DB';
  exception when check_violation then null;
  end;
  begin
    update public.profiles set profile = jsonb_set(profile, '{birthPlace,latitude}', '91');
    raise exception 'Out-of-range latitude accepted by DB';
  exception when check_violation then null;
  end;
end $$;
update public.profiles set preferences = jsonb_set(preferences, '{language}', '"hu"') where user_id = auth.uid();
do $$ begin assert (select version = 2 from public.profiles), 'Version increment failed'; end $$;
delete from public.profiles where user_id = auth.uid();
do $$ begin assert (select count(*) from public.profiles) = 0, 'Own deletion failed'; end $$;

set local role anon;
do $$ begin
  begin
    perform 1 from public.profiles;
    raise exception 'Anonymous read allowed';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;
delete from auth.users where id = 'f302c056-c8aa-4303-87f1-f26b5f58c101';
do $$ begin
  assert not exists(select 1 from public.profiles where user_id = 'f302c056-c8aa-4303-87f1-f26b5f58c101'), 'Account cascade failed';
end $$;
rollback;
