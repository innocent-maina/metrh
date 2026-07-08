begin;

-- Merge the old `user_roles` table into `profiles.roles`, and add the staff
-- email field to profiles so the dashboard only manipulates one row per user.

alter table if exists public.profiles
  add column if not exists email text,
  add column if not exists roles app_role[] not null default '{}'::app_role[];

-- Keep profiles.email aligned with auth.users.email for existing staff.
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id;

-- Preserve the old role assignments before dropping the legacy table.
do $$
begin
  if to_regclass('public.user_roles') is not null then
    update public.profiles p
    set roles = coalesce((
      select array_agg(distinct ur.role order by ur.role)
      from public.user_roles ur
      where ur.user_id = p.id
    ), '{}'::app_role[])
    where exists (
      select 1
      from public.user_roles ur
      where ur.user_id = p.id
    );
  end if;
end
$$;

update public.profiles
set roles = coalesce(roles, '{}'::app_role[])
where roles is null;

create unique index if not exists idx_profiles_email on public.profiles (email);
create index if not exists idx_profiles_roles on public.profiles using gin (roles);

alter table public.profiles alter column email set not null;
alter table public.profiles alter column roles set not null;
alter table public.profiles alter column roles set default '{}'::app_role[];

create or replace function public.has_role(_role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and (
        _role = any(coalesce(roles, '{}'::app_role[]))
        or 'super_admin' = any(coalesce(roles, '{}'::app_role[]))
      )
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and coalesce(array_length(roles, 1), 0) > 0
  );
$$;

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_staff" on public.profiles;
drop policy if exists "profiles_update_self" on public.profiles;
drop policy if exists "profiles_all_super_admin" on public.profiles;

create policy "profiles_select_staff" on public.profiles
  for select using (id = auth.uid() or public.is_staff());

create policy "profiles_update_self" on public.profiles
  for update using (id = auth.uid());

create policy "profiles_all_super_admin" on public.profiles
  for all using (public.has_role('super_admin'));

drop policy if exists "user_roles_select_self_or_admin" on public.user_roles;
drop policy if exists "user_roles_write_super_admin" on public.user_roles;
drop policy if exists "user_roles_update_super_admin" on public.user_roles;
drop policy if exists "user_roles_delete_super_admin" on public.user_roles;

drop table if exists public.user_roles;

commit;
