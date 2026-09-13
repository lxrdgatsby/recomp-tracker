-- Assistant-readable protocol snapshot (does not reset 90-day logs or start_date).
alter table public.profiles
  add column if not exists protocol_profile jsonb default '{}'::jsonb;

-- Chat tables already exist in 001; keep policies intact.
create table if not exists public.chat_conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null default 'New conversation',
  pinned boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  conversation_id uuid references public.chat_conversations on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz default now()
);

alter table public.chat_messages
  add column if not exists conversation_id uuid references public.chat_conversations on delete cascade;

alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;
