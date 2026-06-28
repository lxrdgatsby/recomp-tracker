import { useCallback, useEffect, useRef, useState } from 'react'
import { buildUserContextForChat } from '../utils/buildUserContext'
import { useAuth } from '../contexts/AuthContext'
import {
  deleteConversation,
  fetchConversationMessages,
  getStoredActiveConversationId,
  linkOrphanMessages,
  saveChatMessage,
  storeActiveConversationId,
  syncConversationsForUser,
  titleFromMessage,
  toggleConversationPin,
  updateConversationTitle,
  type ChatConversation,
} from '../lib/chatService'
import { createLocalConversation } from '../lib/localChatStore'
import { applyProfileUpdates } from '../lib/profileService'
import type { Peptide } from '../types'

export interface ChatMsg {
  id: string
  role: 'user' | 'assistant'
  content: string
}

function welcomeMessage(username?: string | null): ChatMsg {
  return {
    id: 'welcome',
    role: 'assistant',
    content: `Hey${username ? ` @${username}` : ''}! I'm your peptide protocol assistant. Ask me about dosing, stacking, your 90-day plan, or tell me what you're currently running — I can update your profile automatically.`,
  }
}

export function useChat() {
  const { user, userProfile, trackerState, setTrackerState, refreshProfile } =
    useAuth()
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    null
  )
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [loading, setLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [isDraft, setIsDraft] = useState(true)
  const sendingRef = useRef(false)

  const loadMessagesForConversation = useCallback(
    async (conversationId: string) => {
      if (!user) return
      const history = await fetchConversationMessages(user.id, conversationId)
      if (history.length > 0) {
        setMessages(
          history.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
          }))
        )
      } else {
        setMessages([welcomeMessage(userProfile?.username)])
      }
    },
    [user, userProfile?.username]
  )

  useEffect(() => {
    if (!user || historyLoaded) return

    setHistoryLoaded(true)

    const init = async () => {
      try {
        const convs = await syncConversationsForUser(user.id)
        setConversations(convs)

        if (convs.length === 0) {
          setIsDraft(true)
          setMessages([welcomeMessage(userProfile?.username)])
          return
        }

        const storedId = getStoredActiveConversationId(user.id)
        const active = convs.find((c) => c.id === storedId) ?? convs[0]

        setActiveConversationId(active.id)
        setIsDraft(false)
        storeActiveConversationId(user.id, active.id)
        await loadMessagesForConversation(active.id)
      } catch (err) {
        console.error('chat init:', err)
        setIsDraft(true)
        setMessages([welcomeMessage(userProfile?.username)])
      }
    }

    void init()
  }, [user, historyLoaded, userProfile?.username, loadMessagesForConversation])

  const getUserContext = useCallback(
    () => buildUserContextForChat(userProfile, trackerState),
    [userProfile, trackerState]
  )

  const applyUpdates = useCallback(
    async (updates: Record<string, unknown>) => {
      if (!user) return

      const newState = { ...trackerState }
      const dbUpdates: Parameters<typeof applyProfileUpdates>[1] = {}

      if (typeof updates.current_weight === 'number') {
        newState.profile.currentWeight = updates.current_weight
        dbUpdates.currentWeight = updates.current_weight
      }
      if (typeof updates.goal_weight === 'number') {
        newState.profile.goalWeight = updates.goal_weight
        dbUpdates.goalWeight = updates.goal_weight
      }
      if (typeof updates.weekly_loss_target === 'number') {
        newState.profile.weeklyLossTarget = updates.weekly_loss_target
        dbUpdates.weeklyLossTarget = updates.weekly_loss_target
      }
      if (typeof updates.main_goal === 'string') dbUpdates.mainGoal = updates.main_goal
      if (typeof updates.interested_peptides === 'string')
        dbUpdates.interestedPeptides = updates.interested_peptides
      if (typeof updates.additional_info === 'string')
        dbUpdates.additionalInfo = updates.additional_info
      if (typeof updates.gender === 'string') dbUpdates.gender = updates.gender
      if (typeof updates.age === 'number') dbUpdates.age = updates.age
      if (typeof updates.training_activities === 'string')
        dbUpdates.trainingActivities = updates.training_activities

      if (Array.isArray(updates.peptide_stack)) {
        const stack = (updates.peptide_stack as Record<string, string>[]).map(
          (p, i) => ({
            id: `ai-${i}-${Date.now()}`,
            name: p.name ?? '',
            dose: p.dose ?? '',
            frequency: (p.frequency === 'weekly' ? 'weekly' : 'daily') as Peptide['frequency'],
            timing: p.timing,
            notes: p.notes,
          })
        )
        newState.peptides = stack
        dbUpdates.peptideStack = stack
      }

      setTrackerState(newState)
      await applyProfileUpdates(user.id, dbUpdates, newState)
      await refreshProfile()
    },
    [user, trackerState, setTrackerState, refreshProfile]
  )

  const applyResolvedConversation = useCallback(
    (conv: ChatConversation) => {
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === conv.id)
        if (exists) {
          return prev.map((c) => (c.id === conv.id ? conv : c))
        }
        return [conv, ...prev]
      })
      setActiveConversationId(conv.id)
      setIsDraft(false)
      storeActiveConversationId(user!.id, conv.id)
      return conv.id
    },
    [user]
  )

  const refreshConversations = useCallback(async () => {
    if (!user) return
    const convs = await syncConversationsForUser(user.id)
    setConversations(convs)
  }, [user])

  const selectConversation = useCallback(
    async (conversationId: string) => {
      if (!user || conversationId === activeConversationId) return
      setActiveConversationId(conversationId)
      setIsDraft(false)
      storeActiveConversationId(user.id, conversationId)
      await loadMessagesForConversation(conversationId)
    },
    [user, activeConversationId, loadMessagesForConversation]
  )

  const startNewConversation = useCallback(() => {
    if (!user) return
    setActiveConversationId(null)
    setIsDraft(true)
    setMessages([welcomeMessage(userProfile?.username)])
    storeActiveConversationId(user.id, null)
  }, [user, userProfile?.username])

  const pinConversation = useCallback(
    async (conversationId: string, pinned: boolean) => {
      if (!user) return
      await toggleConversationPin(user.id, conversationId, pinned)
      setConversations((prev) =>
        prev
          .map((c) => (c.id === conversationId ? { ...c, pinned } : c))
          .sort((a, b) => {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
            return b.updatedAt.localeCompare(a.updatedAt)
          })
      )
    },
    [user]
  )

  const removeConversation = useCallback(
    async (conversationId: string) => {
      if (!user) return
      await deleteConversation(user.id, conversationId)
      const remaining = conversations.filter((c) => c.id !== conversationId)
      setConversations(remaining)

      if (activeConversationId === conversationId) {
        if (remaining.length > 0) {
          const next = remaining[0]
          setActiveConversationId(next.id)
          setIsDraft(false)
          storeActiveConversationId(user.id, next.id)
          await loadMessagesForConversation(next.id)
        } else {
          startNewConversation()
        }
      }
    },
    [
      user,
      conversations,
      activeConversationId,
      loadMessagesForConversation,
      startNewConversation,
    ]
  )

  const sendMessage = useCallback(
    async (text: string) => {
      if (!user || !text.trim() || sendingRef.current) return

      const trimmed = text.trim()
      sendingRef.current = true

      let conversationId = activeConversationId
      const needsNewConversation = isDraft || !conversationId
      const isFirstUserMessage =
        needsNewConversation ||
        messages.filter((m) => m.role === 'user' && m.id !== 'welcome').length === 0

      if (needsNewConversation) {
        const title = titleFromMessage(trimmed)
        const conv = createLocalConversation(user.id, title)
        conversationId = applyResolvedConversation(conv)
      }

      if (!conversationId) {
        sendingRef.current = false
        return
      }

      const userMsg: ChatMsg = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: trimmed,
      }

      const apiMessages = [...messages, userMsg]
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }))

      setMessages((prev) => [...prev, userMsg])
      setLoading(true)

      try {
        const savedUserId = await saveChatMessage(
          user.id,
          conversationId,
          'user',
          userMsg.content
        )
        if (savedUserId) userMsg.id = savedUserId

        if (isFirstUserMessage) {
          const title = titleFromMessage(trimmed)
          await updateConversationTitle(user.id, conversationId, title)
          setConversations((prev) =>
            prev.map((c) =>
              c.id === conversationId
                ? { ...c, title, updatedAt: new Date().toISOString() }
                : c
            )
          )
        } else {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === conversationId
                ? { ...c, updatedAt: new Date().toISOString() }
                : c
            )
          )
        }

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: apiMessages,
            userContext: getUserContext(),
          }),
        })

        const data = await parseChatResponse(res)

        if (!res.ok) {
          throw new Error(data.error ?? 'AI request failed')
        }

        if (data.profileUpdates && typeof data.profileUpdates === 'object') {
          await applyUpdates(data.profileUpdates as Record<string, unknown>)
        }

        const assistantMsg: ChatMsg = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: data.content ?? 'No response from assistant.',
        }
        setMessages((prev) => [...prev, assistantMsg])

        await saveChatMessage(
          user.id,
          conversationId,
          'assistant',
          assistantMsg.content
        )
      } catch (err) {
        const errMsg: ChatMsg = {
          id: `e-${Date.now()}`,
          role: 'assistant',
          content:
            err instanceof Error
              ? err.message
              : 'Something went wrong. Please try again.',
        }
        setMessages((prev) => [...prev, errMsg])
      } finally {
        sendingRef.current = false
        setLoading(false)
        void (async () => {
          if (conversationId) {
            await linkOrphanMessages(user.id, conversationId)
          }
          await refreshConversations()
        })()
      }
    },
    [
      user,
      messages,
      isDraft,
      activeConversationId,
      getUserContext,
      applyUpdates,
      applyResolvedConversation,
      refreshConversations,
    ]
  )

  return {
    messages,
    loading,
    historyLoaded,
    sendMessage,
    conversations,
    activeConversationId,
    isDraft,
    selectConversation,
    startNewConversation,
    pinConversation,
    removeConversation,
    refreshConversations,
  }
}

async function parseChatResponse(
  res: Response
): Promise<{ content?: string; error?: string; profileUpdates?: unknown }> {
  const text = await res.text()
  if (!text.trim()) {
    throw new Error(
      'AI assistant is unavailable. Add OPENAI_API_KEY to .env.local (local) or Vercel → Settings → Environment Variables (production), then restart and try again.'
    )
  }
  try {
    return JSON.parse(text) as {
      content?: string
      error?: string
      profileUpdates?: unknown
    }
  } catch {
    throw new Error(
      'AI assistant returned an invalid response. Refresh the page and try again.'
    )
  }
}