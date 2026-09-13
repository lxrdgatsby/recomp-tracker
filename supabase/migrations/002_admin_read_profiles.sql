-- Admin Dashboard: master admin can SELECT all profiles.
-- Safe to re-run on an existing PeptideTracker database.
--
-- IMPORTANT: Do NOT drop "Users read own profile".
-- The app needs every user to read their own row. Admin is an extra policy
-- (Postgres ORs multiple permissive SELECT policies).

alter table public.profiles enable row level security;

-- Ensure own-profile access (no-op if already present)
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Master admin can view ALL profiles (JWT email claim)
drop policy if exists "Only master admin can view all profiles" on public.profiles;
drop policy if exists "Admin read all profiles" on public.profiles;
create policy "Only master admin can view all profiles"
  on public.profiles for select
  using (
    lower(coalesce(auth.jwt() ->> 'email', ''))
    = lower('itsgatsby@protonmail.com')
  );

-- Master admin can delete profile rows (Admin Dashboard Delete button).
-- Note: this does NOT remove auth.users — only public.profiles.
drop policy if exists "Only master admin can delete profiles" on public.profiles;
create policy "Only master admin can delete profiles"
  on public.profiles for delete
  using (
    lower(coalesce(auth.jwt() ->> 'email', ''))
    = lower('itsgatsby@protonmail.com')
  );

-- Optional helper (kept for other policies / debugging)
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''))
    = lower('itsgatsby@protonmail.com');
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
