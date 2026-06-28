import { useCallback, useEffect, useRef, useState } from 'react'
import { buildUserContextForChat } from '../utils/buildUserContext'
import { useAuth } from '../contexts/AuthContext'
import {
  deleteConversation,
  fetchConversationMessages,
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
import { parseChatApiResponse } from '../lib/parseChatApiResponse'
import { applyProfileUpdates } from '../lib/profileService'
import type { Peptide } from '../types'

export interface ChatMsg {
  id: string
  role: 'user' | 'assistant'
  content: string
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
  const [isDraft, setIsDraft] = useState(true)
  const sendingRef = useRef(false)

  const loadMessagesForConversation = useCallback(
    async (conversationId: string) => {
      if (!user) return
      const history = await fetchConversationMessages(user.id, conversationId)
      setMessages(
        history.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        }))
      )
    },
    [user]
  )

  useEffect(() => {
    if (!user) {
      setConversations([])
      setActiveConversationId(null)
      setMessages([])
      setIsDraft(true)
      return
    }

    let cancelled = false

    const init = async () => {
      try {
        const convs = await syncConversationsForUser(user.id)
        if (cancelled) return
        setConversations(convs)
        setActiveConversationId(null)
        setIsDraft(true)
        setMessages([])
        storeActiveConversationId(user.id, null)
      } catch (err) {
        console.error('chat init:', err)
        if (cancelled) return
        setIsDraft(true)
        setMessages([])
      }
    }

    void init()
    return () => {
      cancelled = true
    }
  }, [user?.id])

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
    setMessages([])
    storeActiveConversationId(user.id, null)
  }, [user])

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
        messages.filter((m) => m.role === 'user').length === 0

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

      const apiMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }))

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

        const data = await parseChatApiResponse(res)

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

