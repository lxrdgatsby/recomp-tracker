import {
  appendLocalMessage,
  createLocalConversation,
  getLocalConversations,
  getLocalMessages,
  loadLocalChat,
  removeLocalConversation,
  replaceLocalMessageId,
  setLocalConversationPin,
  upsertLocalConversation,
} from './localChatStore'
import { formatSupabaseError } from './supabaseErrors'
import { supabase } from './supabase'

export interface ChatConversation {
  id: string
  title: string
  pinned: boolean
  createdAt: string
  updatedAt: string
}

export interface ChatMessageRecord {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

interface DbCapabilities {
  conversationsTable: boolean
  messageThreadColumn: boolean
}

let cachedDbCaps: DbCapabilities | null = null

function mapConversation(row: {
  id: string
  title: string
  pinned: boolean
  created_at: string
  updated_at: string
}): ChatConversation {
  return {
    id: row.id,
    title: row.title,
    pinned: row.pinned,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function titleFromMessage(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, ' ')
  if (!trimmed) return 'New conversation'
  return trimmed.length > 48 ? `${trimmed.slice(0, 48)}…` : trimmed
}

export async function detectDbCapabilities(): Promise<DbCapabilities> {
  if (cachedDbCaps) return cachedDbCaps
  if (!supabase) {
    cachedDbCaps = { conversationsTable: false, messageThreadColumn: false }
    return cachedDbCaps
  }

  const convProbe = await supabase.from('chat_conversations').select('id').limit(1)
  const conversationsTable = !convProbe.error?.message?.includes('chat_conversations')

  const msgProbe = await supabase.from('chat_messages').select('conversation_id').limit(1)
  const messageThreadColumn = !msgProbe.error?.message?.includes('conversation_id')

  cachedDbCaps = { conversationsTable, messageThreadColumn }
  return cachedDbCaps
}

function mergeConversations(
  ...lists: ChatConversation[][]
): ChatConversation[] {
  const byId = new Map<string, ChatConversation>()
  for (const list of lists) {
    for (const conv of list) {
      const existing = byId.get(conv.id)
      if (!existing || conv.updatedAt > existing.updatedAt) {
        byId.set(conv.id, conv)
      }
    }
  }
  return [...byId.values()].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return b.updatedAt.localeCompare(a.updatedAt)
  })
}

export async function fetchConversations(
  userId: string
): Promise<ChatConversation[]> {
  const local = getLocalConversations(userId)
  const caps = await detectDbCapabilities()
  if (!supabase || !caps.conversationsTable) return local

  const { data, error } = await supabase
    .from('chat_conversations')
    .select('id, title, pinned, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('fetchConversations:', formatSupabaseError(error.message))
    return local
  }

  return mergeConversations(local, (data ?? []).map(mapConversation))
}

export async function fetchConversationMessages(
  userId: string,
  conversationId: string
): Promise<ChatMessageRecord[]> {
  const local = getLocalMessages(userId, conversationId)
  const caps = await detectDbCapabilities()

  if (!supabase || !caps.messageThreadColumn) return local

  const { data, error } = await supabase
    .from('chat_messages')
    .select('id, role, content, created_at')
    .eq('conversation_id', conversationId)
    .neq('role', 'system')
    .order('created_at', { ascending: true })
    .limit(200)

  if (error) {
    console.error('fetchConversationMessages:', formatSupabaseError(error.message))
    return local
  }

  const remote = (data ?? []).map((m) => ({
    id: m.id,
    role: m.role as 'user' | 'assistant',
    content: m.content,
    createdAt: m.created_at,
  }))

  if (local.length === 0) return remote

  const byId = new Map<string, ChatMessageRecord>()
  for (const msg of [...local, ...remote]) byId.set(msg.id, msg)
  return [...byId.values()].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt)
  )
}

export async function createConversation(
  userId: string,
  title = 'New conversation'
): Promise<ChatConversation | null> {
  const caps = await detectDbCapabilities()

  if (supabase && caps.conversationsTable) {
    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({ user_id: userId, title })
      .select('id, title, pinned, created_at, updated_at')
      .single()

    if (!error && data) {
      const conv = mapConversation(data)
      upsertLocalConversation(userId, conv)
      return conv
    }
    console.error('createConversation:', formatSupabaseError(error?.message))
  }

  return createLocalConversation(userId, title)
}

export async function linkOrphanMessages(
  userId: string,
  conversationId: string
): Promise<void> {
  const caps = await detectDbCapabilities()
  if (!supabase || !caps.messageThreadColumn) return

  const { error } = await supabase
    .from('chat_messages')
    .update({ conversation_id: conversationId })
    .eq('user_id', userId)
    .is('conversation_id', null)

  if (error) {
    console.error('linkOrphanMessages:', formatSupabaseError(error.message))
  }
}

export async function createConversationAndLinkOrphans(
  userId: string,
  title: string
): Promise<ChatConversation | null> {
  const conv = await createConversation(userId, title)
  if (!conv) return null
  await linkOrphanMessages(userId, conv.id)
  return conv
}

export async function buildConversationsFromOrphanMessages(
  userId: string
): Promise<ChatConversation[]> {
  if (!supabase) return []
  const caps = await detectDbCapabilities()
  if (caps.messageThreadColumn) return []

  const { data, error } = await supabase
    .from('chat_messages')
    .select('id, role, content, created_at')
    .eq('user_id', userId)
    .neq('role', 'system')
    .order('created_at', { ascending: true })

  if (error || !data?.length) return []

  const local = loadLocalChat(userId)
  if (local.conversations.length > 0) return local.conversations

  const firstUser = data.find((m) => m.role === 'user')
  const title = firstUser
    ? titleFromMessage(firstUser.content)
    : 'Chat history'
  const conv = createLocalConversation(userId, title)

  for (const m of data) {
    appendLocalMessage(userId, conv.id, {
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: m.content,
      createdAt: m.created_at,
    })
  }

  return getLocalConversations(userId)
}

export async function syncConversationsForUser(
  userId: string
): Promise<ChatConversation[]> {
  let convs = await fetchConversations(userId)

  if (convs.length === 0) {
    const migrated = await migrateLegacyMessages(userId)
    if (migrated) {
      upsertLocalConversation(userId, migrated)
      convs = await fetchConversations(userId)
    }
  }

  if (convs.length === 0) {
    const fromMessages = await buildConversationsFromOrphanMessages(userId)
    if (fromMessages.length > 0) convs = fromMessages
  }

  return convs
}

export async function resolveConversationForSend(
  userId: string,
  title: string,
  activeConversationId: string | null,
  isDraft: boolean
): Promise<ChatConversation | null> {
  if (activeConversationId && !isDraft) {
    const local = getLocalConversations(userId)
    const existing = local.find((c) => c.id === activeConversationId)
    if (existing) return existing

    const caps = await detectDbCapabilities()
    if (supabase && caps.conversationsTable) {
      const { data } = await supabase
        .from('chat_conversations')
        .select('id, title, pinned, created_at, updated_at')
        .eq('id', activeConversationId)
        .eq('user_id', userId)
        .maybeSingle()
      if (data) return mapConversation(data)
    }
  }

  return createConversationAndLinkOrphans(userId, title)
}

export async function saveChatMessage(
  userId: string,
  conversationId: string | null,
  role: 'user' | 'assistant',
  content: string
): Promise<string | null> {
  const now = new Date().toISOString()
  const localId = `local-${role}-${Date.now()}`

  if (conversationId) {
    appendLocalMessage(userId, conversationId, {
      id: localId,
      role,
      content,
      createdAt: now,
    })
  }

  if (!supabase) return localId

  const caps = await detectDbCapabilities()
  const insertPayload: Record<string, unknown> = {
    user_id: userId,
    role,
    content,
  }
  if (conversationId && caps.messageThreadColumn) {
    insertPayload.conversation_id = conversationId
  }

  let { data, error } = await supabase
    .from('chat_messages')
    .insert(insertPayload)
    .select('id')
    .single()

  if (error && conversationId && caps.messageThreadColumn) {
    const retry = await supabase
      .from('chat_messages')
      .insert({ user_id: userId, role, content })
      .select('id')
      .single()
    data = retry.data
    error = retry.error
  }

  if (error) {
    console.error('saveChatMessage:', formatSupabaseError(error.message))
    return conversationId ? localId : null
  }

  const savedId = data?.id ?? localId

  if (conversationId && savedId !== localId) {
    replaceLocalMessageId(userId, conversationId, localId, savedId)
  }

  if (conversationId && caps.conversationsTable) {
    await supabase
      .from('chat_conversations')
      .update({ updated_at: now })
      .eq('id', conversationId)
  }

  return savedId
}

export async function updateConversationTitle(
  userId: string,
  conversationId: string,
  title: string
): Promise<void> {
  const local = loadLocalChat(userId)
  const conv = local.conversations.find((c) => c.id === conversationId)
  if (conv) {
    upsertLocalConversation(userId, { ...conv, title, updatedAt: new Date().toISOString() })
  }

  const caps = await detectDbCapabilities()
  if (!supabase || !caps.conversationsTable) return

  await supabase
    .from('chat_conversations')
    .update({ title })
    .eq('id', conversationId)
}

export async function toggleConversationPin(
  userId: string,
  conversationId: string,
  pinned: boolean
): Promise<void> {
  setLocalConversationPin(userId, conversationId, pinned)

  const caps = await detectDbCapabilities()
  if (!supabase || !caps.conversationsTable) return

  await supabase
    .from('chat_conversations')
    .update({ pinned })
    .eq('id', conversationId)
}

export async function deleteConversation(
  userId: string,
  conversationId: string
): Promise<void> {
  removeLocalConversation(userId, conversationId)

  const caps = await detectDbCapabilities()
  if (!supabase || !caps.conversationsTable) return

  await supabase.from('chat_conversations').delete().eq('id', conversationId)
}

export async function migrateLegacyMessages(
  userId: string
): Promise<ChatConversation | null> {
  const caps = await detectDbCapabilities()
  if (!supabase || !caps.conversationsTable || !caps.messageThreadColumn) {
    return null
  }

  const { data: orphanMessages, error } = await supabase
    .from('chat_messages')
    .select('id, role, content, created_at')
    .eq('user_id', userId)
    .is('conversation_id', null)
    .neq('role', 'system')
    .order('created_at', { ascending: true })
    .limit(1)

  if (error || !orphanMessages?.length) return null

  const { data: allOrphan } = await supabase
    .from('chat_messages')
    .select('role, content, created_at')
    .eq('user_id', userId)
    .is('conversation_id', null)
    .order('created_at', { ascending: true })

  const firstUser = (allOrphan ?? []).find((m) => m.role === 'user')
  const title = firstUser
    ? titleFromMessage(firstUser.content)
    : 'Chat history'

  const timestamps = (allOrphan ?? []).map((m) => m.created_at)
  const createdAt = timestamps[0] ?? new Date().toISOString()
  const updatedAt = timestamps[timestamps.length - 1] ?? createdAt

  const { data: conv, error: convError } = await supabase
    .from('chat_conversations')
    .insert({
      user_id: userId,
      title,
      created_at: createdAt,
      updated_at: updatedAt,
    })
    .select('id, title, pinned, created_at, updated_at')
    .single()

  if (convError || !conv) return null

  await supabase
    .from('chat_messages')
    .update({ conversation_id: conv.id })
    .eq('user_id', userId)
    .is('conversation_id', null)

  const mapped = mapConversation(conv)
  upsertLocalConversation(userId, mapped)
  return mapped
}

const ACTIVE_CONV_KEY = 'peptide-tracker-active-conversation'

export function getStoredActiveConversationId(userId: string): string | null {
  try {
    return localStorage.getItem(`${ACTIVE_CONV_KEY}:${userId}`)
  } catch {
    return null
  }
}

export function storeActiveConversationId(
  userId: string,
  conversationId: string | null
): void {
  try {
    const key = `${ACTIVE_CONV_KEY}:${userId}`
    if (conversationId) localStorage.setItem(key, conversationId)
    else localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}