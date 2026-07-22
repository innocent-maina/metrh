begin;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_full_name text;
begin
  next_full_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.email,
    split_part(coalesce(new.email, ''), '@', 1)
  );

  insert into public.profiles (
    id,
    full_name,
    email,
    avatar_url,
    phone,
    job_title,
    roles,
    is_active
  )
  values (
    new.id,
    next_full_name,
    coalesce(new.email, new.raw_user_meta_data->>'email'),
    nullif(new.raw_user_meta_data->>'avatar_url', ''),
    nullif(new.raw_user_meta_data->>'phone', ''),
    nullif(new.raw_user_meta_data->>'job_title', ''),
    '{}'::app_role[],
    true
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    email = excluded.email,
    avatar_url = excluded.avatar_url,
    phone = excluded.phone,
    job_title = excluded.job_title,
    updated_at = now();

  return new;
end;
$$;

do $$
declare
  trigger_record record;
begin
  for trigger_record in
    select
      t.tgname,
      pg_get_functiondef(t.tgfoid) as function_def
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'auth'
      and c.relname = 'users'
      and not t.tgisinternal
  loop
    if position('public.profiles' in trigger_record.function_def) > 0 then
      execute format('drop trigger if exists %I on auth.users;', trigger_record.tgname);
    end if;
  end loop;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'auth'
      and c.relname = 'users'
      and t.tgname = 'on_auth_user_created'
  ) then
    create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function public.handle_new_user();
  end if;
end;
$$;

commit;
