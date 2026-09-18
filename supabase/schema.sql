-- Peptide Tracker — Supabase schema
-- Run this in Supabase SQL Editor (Dashboard → SQL → New query)

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  username text unique,
  familiarity text check (familiarity in ('beginner', 'intermediate', 'advanced')),
  main_goal text,
  interested_peptides text,
  peptide_selections jsonb default '[]'::jsonb,
  additional_info text,
  gender text check (gender in ('male', 'female', 'non_binary', 'prefer_not_to_say')),
  age smallint check (age >= 18 and age <= 50),
  training_activities text,
  current_weight numeric,
  goal_weight numeric,
  height text,
  start_date date default current_date,
  weekly_loss_target numeric default 0.875,
  peptide_stack jsonb default '[]'::jsonb,
  tracker_data jsonb default '{}'::jsonb,
  protocol_profile jsonb default '{}'::jsonb,
  onboarding_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles
  add column if not exists protocol_profile jsonb default '{}'::jsonb;

alter table public.profiles
  add column if not exists last_active_at timestamptz;

-- Chat conversations (threads)
create table if not exists public.chat_conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null default 'New conversation',
  pinned boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists chat_conversations_user_id_idx
  on public.chat_conversations (user_id, updated_at desc);

-- Chat history
create table if not exists public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  conversation_id uuid references public.chat_conversations on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz default now()
);

-- Existing databases may have chat_messages without conversation_id
alter table public.chat_messages
  add column if not exists conversation_id uuid references public.chat_conversations on delete cascade;

create index if not exists chat_messages_user_id_idx on public.chat_messages (user_id, created_at);
create index if not exists chat_messages_conversation_id_idx
  on public.chat_messages (conversation_id, created_at);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
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

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Users read own messages" on public.chat_messages;
create policy "Users read own messages"
  on public.chat_messages for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own messages" on public.chat_messages;
create policy "Users insert own messages"
  on public.chat_messages for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own messages" on public.chat_messages;
create policy "Users delete own messages"
  on public.chat_messages for delete
  using (auth.uid() = user_id);

drop policy if exists "Users update own messages" on public.chat_messages;
create policy "Users update own messages"
  on public.chat_messages for update
  using (auth.uid() = user_id);

drop policy if exists "Users read own conversations" on public.chat_conversations;
create policy "Users read own conversations"
  on public.chat_conversations for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own conversations" on public.chat_conversations;
create policy "Users insert own conversations"
  on public.chat_conversations for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own conversations" on public.chat_conversations;
create policy "Users update own conversations"
  on public.chat_conversations for update
  using (auth.uid() = user_id);

drop policy if exists "Users delete own conversations" on public.chat_conversations;
create policy "Users delete own conversations"
  on public.chat_conversations for delete
  using (auth.uid() = user_id);

drop trigger if exists chat_conversations_updated_at on public.chat_conversations;
create trigger chat_conversations_updated_at
  before update on public.chat_conversations
  for each row execute procedure public.set_updated_at();

-- Migration: add gender to existing profiles table
alter table public.profiles
  add column if not exists gender text
  check (gender in ('male', 'female', 'non_binary', 'prefer_not_to_say'));

alter table public.profiles
  add column if not exists age smallint
  check (age >= 18 and age <= 50);

alter table public.profiles
  add column if not exists training_activities text;

alter table public.profiles
  add column if not exists peptide_selections jsonb default '[]'::jsonb;

-- Migration: chat conversations (run on existing databases)
create table if not exists public.chat_conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null default 'New conversation',
  pinned boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.chat_messages
  add column if not exists conversation_id uuid references public.chat_conversations on delete cascade;

alter table public.chat_conversations enable row level security;

drop policy if exists "Users read own conversations" on public.chat_conversations;
create policy "Users read own conversations"
  on public.chat_conversations for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own conversations" on public.chat_conversations;
create policy "Users insert own conversations"
  on public.chat_conversations for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own conversations" on public.chat_conversations;
create policy "Users update own conversations"
  on public.chat_conversations for update
  using (auth.uid() = user_id);

drop policy if exists "Users delete own conversations" on public.chat_conversations;
create policy "Users delete own conversations"
  on public.chat_conversations for delete
  using (auth.uid() = user_id);

drop trigger if exists chat_conversations_updated_at on public.chat_conversations;
create trigger chat_conversations_updated_at
  before update on public.chat_conversations
  for each row execute procedure public.set_updated_at();

create index if not exists chat_conversations_user_id_idx
  on public.chat_conversations (user_id, updated_at desc);

create index if not exists chat_messages_conversation_id_idx
  on public.chat_messages (conversation_id, created_at);

-- Backfill: one conversation per user for legacy messages without conversation_id
do $$
declare
  r record;
  conv_id uuid;
  first_title text;
begin
  for r in
    select distinct user_id
    from public.chat_messages
    where conversation_id is null
  loop
    select left(content, 48) into first_title
    from public.chat_messages
    where user_id = r.user_id
      and role = 'user'
      and conversation_id is null
    order by created_at asc
    limit 1;

    insert into public.chat_conversations (user_id, title, created_at, updated_at)
    select
      r.user_id,
      coalesce(first_title, 'Chat history'),
      min(created_at),
      max(created_at)
    from public.chat_messages
    where user_id = r.user_id
      and conversation_id is null
    returning id into conv_id;

    update public.chat_messages
    set conversation_id = conv_id
    where user_id = r.user_id
      and conversation_id is null;
  end loop;
end $$;

-- Admin: master account can read all profiles (Admin Dashboard)
-- Uses JWT email claim (same idea as: auth.jwt() ->> 'email' = admin).
-- Keep "Users read own profile" above — both SELECT policies apply (OR).
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

drop policy if exists "Only master admin can view all profiles" on public.profiles;
drop policy if exists "Admin read all profiles" on public.profiles;
create policy "Only master admin can view all profiles"
  on public.profiles for select
  using (public.is_master_admin());

drop policy if exists "Only master admin can delete profiles" on public.profiles;
create policy "Only master admin can delete profiles"
  on public.profiles for delete
  using (public.is_master_admin() and id <> auth.uid());

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
    coalesce(p.email, u.email),
    coalesce(p.created_at, u.created_at),
    u.last_sign_in_at,
    coalesce(p.last_active_at, u.last_sign_in_at),
    p.username
  from auth.users u
  left join public.profiles p on p.id = u.id
  order by coalesce(p.created_at, u.created_at) desc;
end;
$$;

revoke all on function public.admin_list_users() from public;
grant execute on function public.admin_list_users() to authenticated;