-- Admin Dashboard: list ALL auth users, not only the logged-in admin.
-- Safe to re-run. Does not drop user logs or 90-day tracker_data.

alter table public.profiles
  add column if not exists last_active_at timestamptz;

-- Lookup admin by auth.users.email so it works even if JWT has no email claim.
create or replace function public.is_master_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from auth.users u
    where u.id = auth.uid()
      and lower(coalesce(u.email, '')) = lower('itsgatsby@protonmail.com')
  );
$$;

revoke all on function public.is_master_admin() from public;
grant execute on function public.is_master_admin() to authenticated;

-- Keep the older helper in sync.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_master_admin();
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.profiles enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_master_admin());

drop policy if exists "Only master admin can view all profiles" on public.profiles;
drop policy if exists "Admin read all profiles" on public.profiles;
create policy "Only master admin can view all profiles"
  on public.profiles for select
  using (public.is_master_admin());

drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Only master admin can delete profiles" on public.profiles;
create policy "Only master admin can delete profiles"
  on public.profiles for delete
  using (
    public.is_master_admin()
    and id <> auth.uid()
  );

-- Every Auth signup gets a profiles row.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, created_at, last_active_at)
  values (new.id, new.email, new.created_at, new.last_sign_in_at)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Backfill Auth users that never got a profiles row.
insert into public.profiles (id, email, created_at, last_active_at)
select
  u.id,
  u.email,
  u.created_at,
  u.last_sign_in_at
from auth.users u
on conflict (id) do update
set email = coalesce(public.profiles.email, excluded.email);

-- Master-admin-only list: Auth users left-joined to profiles (includes last_sign_in_at).
create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  last_active_at timestamptz,
  username text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_master_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  return query
  select
    u.id,
    coalesce(p.email, u.email) as email,
    coalesce(p.created_at, u.created_at) as created_at,
    u.last_sign_in_at,
    coalesce(p.last_active_at, u.last_sign_in_at) as last_active_at,
    p.username
  from auth.users u
  left join public.profiles p on p.id = u.id
  order by coalesce(p.created_at, u.created_at) desc;
end;
$$;

revoke all on function public.admin_list_users() from public;
grant execute on function public.admin_list_users() to authenticated;
