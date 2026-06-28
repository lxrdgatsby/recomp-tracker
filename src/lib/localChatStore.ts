import type { ChatConversation, ChatMessageRecord } from './chatService'
import { generateId } from './generateId'

type StoredMessage = ChatMessageRecord & { conversationId: string }

interface LocalChatData {
  conversations: ChatConversation[]
  messages: StoredMessage[]
}

function storageKey(userId: string): string {
  return `peptide-tracker-chat:${userId}`
}

function emptyData(): { conversations: ChatConversation[]; messages: StoredMessage[] } {
  return { conversations: [], messages: [] }
}

export function loadLocalChat(userId: string): {
  conversations: ChatConversation[]
  messages: StoredMessage[]
} {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return emptyData()
    const parsed = JSON.parse(raw) as LocalChatData
    return {
      conversations: parsed.conversations ?? [],
      messages: parsed.messages ?? [],
    }
  } catch {
    return emptyData()
  }
}

function persistLocalChat(
  userId: string,
  data: { conversations: ChatConversation[]; messages: StoredMessage[] }
): void {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(data))
  } catch {
    /* ignore quota errors */
  }
}

export function upsertLocalConversation(
  userId: string,
  conversation: ChatConversation
): ChatConversation[] {
  const data = loadLocalChat(userId)
  const exists = data.conversations.some((c) => c.id === conversation.id)
  data.conversations = exists
    ? data.conversations.map((c) =>
        c.id === conversation.id ? { ...c, ...conversation } : c
      )
    : [conversation, ...data.conversations]
  persistLocalChat(userId, data)
  return data.conversations
}

export function appendLocalMessage(
  userId: string,
  conversationId: string,
  message: ChatMessageRecord
): void {
  const data = loadLocalChat(userId)
  data.messages.push({ ...message, conversationId })
  const now = message.createdAt || new Date().toISOString()
  data.conversations = data.conversations.map((c) =>
    c.id === conversationId ? { ...c, updatedAt: now } : c
  )
  persistLocalChat(userId, data)
}

export function getLocalConversations(userId: string): ChatConversation[] {
  return loadLocalChat(userId).conversations.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return b.updatedAt.localeCompare(a.updatedAt)
  })
}

export function getLocalMessages(
  userId: string,
  conversationId: string
): ChatMessageRecord[] {
  return loadLocalChat(userId)
    .messages.filter((m) => m.conversationId === conversationId)
    .map(({ id, role, content, createdAt }) => ({ id, role, content, createdAt }))
}

export function removeLocalConversation(userId: string, conversationId: string): void {
  const data = loadLocalChat(userId)
  data.conversations = data.conversations.filter((c) => c.id !== conversationId)
  data.messages = data.messages.filter((m) => m.conversationId !== conversationId)
  persistLocalChat(userId, data)
}

export function setLocalConversationPin(
  userId: string,
  conversationId: string,
  pinned: boolean
): ChatConversation[] {
  const data = loadLocalChat(userId)
  data.conversations = data.conversations
    .map((c) => (c.id === conversationId ? { ...c, pinned } : c))
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return b.updatedAt.localeCompare(a.updatedAt)
    })
  persistLocalChat(userId, data)
  return data.conversations
}

export function createLocalConversation(
  userId: string,
  title: string
): ChatConversation {
  const now = new Date().toISOString()
  const conversation: ChatConversation = {
    id: generateId(),
    title,
    pinned: false,
    createdAt: now,
    updatedAt: now,
  }
  upsertLocalConversation(userId, conversation)
  return conversation
}

export function replaceLocalMessageId(
  userId: string,
  conversationId: string,
  tempId: string,
  permanentId: string
): void {
  const data = loadLocalChat(userId)
  data.messages = data.messages.map((m) =>
    m.id === tempId && m.conversationId === conversationId
      ? { ...m, id: permanentId }
      : m
  )
  persistLocalChat(userId, data)
}