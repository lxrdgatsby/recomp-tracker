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
  additional_info text,
  current_weight numeric,
  goal_weight numeric,
  height text,
  start_date date default current_date,
  weekly_loss_target numeric default 0.875,
  peptide_stack jsonb default '[]'::jsonb,
  tracker_data jsonb default '{}'::jsonb,
  onboarding_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Chat history
create table if not exists public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz default now()
);

create index if not exists chat_messages_user_id_idx on public.chat_messages (user_id, created_at);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
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
alter table public.chat_messages enable row level security;

create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users read own messages"
  on public.chat_messages for select
  using (auth.uid() = user_id);

create policy "Users insert own messages"
  on public.chat_messages for insert
  with check (auth.uid() = user_id);

create policy "Users delete own messages"
  on public.chat_messages for delete
  using (auth.uid() = user_id);