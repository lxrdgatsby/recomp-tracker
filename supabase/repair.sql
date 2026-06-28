-- Run this FIRST if schema.sql failed with: column "conversation_id" does not exist
-- Supabase Dashboard → SQL Editor → New query → paste all → Run

-- 1. Conversations table (needed before conversation_id FK)
create table if not exists public.chat_conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null default 'New conversation',
  pinned boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Add missing column on existing chat_messages tables
alter table public.chat_messages
  add column if not exists conversation_id uuid references public.chat_conversations on delete cascade;

-- 3. Indexes (safe now that column exists)
create index if not exists chat_messages_conversation_id_idx
  on public.chat_messages (conversation_id, created_at);

create index if not exists chat_conversations_user_id_idx
  on public.chat_conversations (user_id, updated_at desc);

-- 4. RLS + policies for conversations
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

drop policy if exists "Users update own messages" on public.chat_messages;
create policy "Users update own messages"
  on public.chat_messages for update
  using (auth.uid() = user_id);

-- 5. Updated_at trigger (requires set_updated_at from schema.sql — skip if you get "function does not exist")
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists chat_conversations_updated_at on public.chat_conversations;
create trigger chat_conversations_updated_at
  before update on public.chat_conversations
  for each row execute procedure public.set_updated_at();