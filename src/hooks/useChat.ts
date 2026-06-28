import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  applyProfileUpdates,
  fetchChatHistory,
  saveChatMessage,
} from '../lib/profileService'
import type { Peptide } from '../types'

export interface ChatMsg {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export function useChat() {
  const { user, userProfile, trackerState, setTrackerState, refreshProfile } =
    useAuth()
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [loading, setLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)

  useEffect(() => {
    if (!user || historyLoaded) return
    fetchChatHistory(user.id).then((history) => {
      if (history.length > 0) {
        setMessages(
          history.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
          }))
        )
      } else {
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: `Hey${userProfile?.username ? ` @${userProfile.username}` : ''}! I'm your peptide protocol assistant. Ask me about dosing, stacking, your 90-day plan, or tell me what you're currently running — I can update your profile automatically.`,
          },
        ])
      }
      setHistoryLoaded(true)
    })
  }, [user, historyLoaded, userProfile?.username])

  const getUserContext = useCallback(() => {
    const p = userProfile
    const t = trackerState
    if (!p) return ''
    return [
      `Username: ${p.username ?? 'unknown'}`,
      `Familiarity: ${p.familiarity ?? 'unknown'}`,
      `Main goal: ${p.mainGoal ?? 'unknown'}`,
      `Interested peptides: ${p.interestedPeptides ?? 'none'}`,
      `Current weight: ${t.profile.currentWeight} lbs`,
      `Goal weight: ${t.profile.goalWeight} lbs`,
      `Weekly loss target: ${t.profile.weeklyLossTarget} lbs`,
      `Start date: ${t.profile.startDate}`,
      `Additional info: ${p.additionalInfo ?? 'none'}`,
      `Current stack: ${t.peptides.map((pep) => `${pep.name} ${pep.dose} (${pep.frequency})`).join(', ')}`,
      `Weight entries logged: ${t.weightHistory.length}`,
      `Workouts completed: ${t.workoutCompletions.length}`,
    ].join('\n')
  }, [userProfile, trackerState])

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

  const sendMessage = useCallback(
    async (text: string) => {
      if (!user || !text.trim() || loading) return

      const userMsg: ChatMsg = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: text.trim(),
      }
      setMessages((prev) => [...prev, userMsg])
      setLoading(true)
      await saveChatMessage(user.id, 'user', userMsg.content)

      try {
        const apiMessages = [...messages, userMsg]
          .filter((m) => m.id !== 'welcome')
          .map((m) => ({ role: m.role, content: m.content }))

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: apiMessages,
            userContext: getUserContext(),
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error ?? 'AI request failed')
        }

        if (data.profileUpdates) {
          await applyUpdates(data.profileUpdates)
        }

        const assistantMsg: ChatMsg = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: data.content,
        }
        setMessages((prev) => [...prev, assistantMsg])
        await saveChatMessage(user.id, 'assistant', assistantMsg.content)
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
        setLoading(false)
      }
    },
    [user, loading, messages, getUserContext, applyUpdates]
  )

  return { messages, loading, sendMessage }
}