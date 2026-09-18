-- Admin list comes from auth.users. Safe to re-run.
-- Does not wipe tracker_data / injection history.

-- B) Fix columns + backfill every Auth user into profiles
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists created_at timestamptz default now();
alter table public.profiles add column if not exists last_active_at timestamptz;

insert into public.profiles (id, email, created_at, last_active_at)
select
  u.id,
  u.email,
  u.created_at,
  coalesce(u.last_sign_in_at, u.created_at)
from auth.users u
on conflict (id) do update
set
  email = excluded.email,
  last_active_at = coalesce(excluded.last_active_at, public.profiles.last_active_at);

-- C) Master admin can read all profiles
create or replace function public.is_master_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(lower(auth.jwt() ->> 'email') = lower('itsgatsby@protonmail.com'), false);
$$;

revoke all on function public.is_master_admin() from public;
grant execute on function public.is_master_admin() to authenticated;

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users read own profile" on public.profiles;
drop policy if exists "Only master admin can view all profiles" on public.profiles;
drop policy if exists "Admin read all profiles" on public.profiles;
drop policy if exists "profiles_select_own_or_admin" on public.profiles;

create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (auth.uid() = id or public.is_master_admin());

-- D) Admin list comes from Auth. Drop first: return type may have changed.
drop function if exists public.admin_list_users();

create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_master_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select u.id, u.email::text, u.created_at, u.last_sign_in_at
  from auth.users u
  order by u.created_at desc;
end;
$$;

revoke all on function public.admin_list_users() from public;
grant execute on function public.admin_list_users() to authenticated;
