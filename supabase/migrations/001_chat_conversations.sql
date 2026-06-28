-- Run this in Supabase Dashboard → SQL Editor → New query
-- Adds conversation threads + links existing chat messages

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

drop policy if exists "Users update own messages" on public.chat_messages;
create policy "Users update own messages"
  on public.chat_messages for update
  using (auth.uid() = user_id);

drop trigger if exists chat_conversations_updated_at on public.chat_conversations;
create trigger chat_conversations_updated_at
  before update on public.chat_conversations
  for each row execute procedure public.set_updated_at();

create index if not exists chat_conversations_user_id_idx
  on public.chat_conversations (user_id, updated_at desc);

create index if not exists chat_messages_conversation_id_idx
  on public.chat_messages (conversation_id, created_at);

-- Backfill existing messages into one conversation per user
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