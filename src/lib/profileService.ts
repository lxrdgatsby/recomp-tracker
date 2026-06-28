import { DEFAULT_PEPTIDES, DEFAULT_PROFILE } from '../constants/defaults'
import { supabase } from './supabase'
import type { Peptide, Profile, TrackerState } from '../types'
import type { Questionnaire, UserProfile } from '../types/auth'

interface DbProfile {
  id: string
  email: string | null
  username: string | null
  familiarity: string | null
  main_goal: string | null
  interested_peptides: string | null
  additional_info: string | null
  current_weight: number | null
  goal_weight: number | null
  height: string | null
  start_date: string | null
  weekly_loss_target: number | null
  peptide_stack: Peptide[] | null
  tracker_data: Partial<TrackerState> | null
  onboarding_completed: boolean
}

function mapDbProfile(row: DbProfile): UserProfile {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    familiarity: row.familiarity as UserProfile['familiarity'],
    mainGoal: row.main_goal,
    interestedPeptides: row.interested_peptides,
    additionalInfo: row.additional_info,
    currentWeight: row.current_weight,
    goalWeight: row.goal_weight,
    height: row.height,
    startDate: row.start_date,
    weeklyLossTarget: row.weekly_loss_target,
    peptideStack: row.peptide_stack ?? [],
    trackerData: row.tracker_data,
    onboardingCompleted: row.onboarding_completed,
  }
}

export function profileToTrackerState(userProfile: UserProfile): TrackerState {
  const saved = userProfile.trackerData
  return {
    profile: {
      currentWeight: userProfile.currentWeight ?? DEFAULT_PROFILE.currentWeight,
      goalWeight: userProfile.goalWeight ?? DEFAULT_PROFILE.goalWeight,
      height: userProfile.height ?? '',
      startDate: userProfile.startDate ?? DEFAULT_PROFILE.startDate,
      weeklyLossTarget:
        userProfile.weeklyLossTarget ?? DEFAULT_PROFILE.weeklyLossTarget,
    },
    peptides:
      userProfile.peptideStack.length > 0
        ? userProfile.peptideStack
        : [...DEFAULT_PEPTIDES],
    weightHistory: saved?.weightHistory ?? [],
    injectionLogs: saved?.injectionLogs ?? [],
    workoutCompletions: saved?.workoutCompletions ?? [],
  }
}

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error || !data) return null
  return mapDbProfile(data as DbProfile)
}

export async function completeOnboarding(
  userId: string,
  username: string,
  questionnaire: Questionnaire
): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase not configured' }

  const defaultStack = [...DEFAULT_PEPTIDES]
  const trackerState: TrackerState = {
    profile: {
      currentWeight: questionnaire.currentWeight,
      goalWeight: questionnaire.goalWeight,
      height: '',
      startDate: new Date().toISOString().slice(0, 10),
      weeklyLossTarget: DEFAULT_PROFILE.weeklyLossTarget,
    },
    peptides: defaultStack,
    weightHistory: [],
    injectionLogs: [],
    workoutCompletions: [],
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      username,
      familiarity: questionnaire.familiarity,
      main_goal: questionnaire.mainGoal,
      interested_peptides: questionnaire.interestedPeptides,
      additional_info: questionnaire.additionalInfo,
      current_weight: questionnaire.currentWeight,
      goal_weight: questionnaire.goalWeight,
      start_date: trackerState.profile.startDate,
      peptide_stack: defaultStack,
      tracker_data: trackerState,
      onboarding_completed: true,
    })
    .eq('id', userId)

  return { error: error?.message ?? null }
}

export async function saveProfileToDb(
  userId: string,
  profile: Profile,
  peptides: Peptide[],
  trackerState: TrackerState,
  extras?: {
    familiarity?: string | null
    mainGoal?: string | null
    interestedPeptides?: string | null
    additionalInfo?: string | null
  }
): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase not configured' }

  const update: Record<string, unknown> = {
    current_weight: profile.currentWeight,
    goal_weight: profile.goalWeight,
    height: profile.height,
    start_date: profile.startDate,
    weekly_loss_target: profile.weeklyLossTarget,
    peptide_stack: peptides,
    tracker_data: trackerState,
  }
  if (extras?.familiarity !== undefined) update.familiarity = extras.familiarity
  if (extras?.mainGoal !== undefined) update.main_goal = extras.mainGoal
  if (extras?.interestedPeptides !== undefined)
    update.interested_peptides = extras.interestedPeptides
  if (extras?.additionalInfo !== undefined)
    update.additional_info = extras.additionalInfo

  const { error } = await supabase.from('profiles').update(update).eq('id', userId)

  return { error: error?.message ?? null }
}

export async function applyProfileUpdates(
  userId: string,
  updates: Partial<{
    currentWeight: number
    goalWeight: number
    height: string
    weeklyLossTarget: number
    mainGoal: string
    interestedPeptides: string
    additionalInfo: string
    peptideStack: Peptide[]
  }>,
  trackerState: TrackerState
): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase not configured' }

  const dbUpdates: Record<string, unknown> = {
    tracker_data: trackerState,
  }
  if (updates.currentWeight !== undefined)
    dbUpdates.current_weight = updates.currentWeight
  if (updates.goalWeight !== undefined)
    dbUpdates.goal_weight = updates.goalWeight
  if (updates.height !== undefined) dbUpdates.height = updates.height
  if (updates.weeklyLossTarget !== undefined)
    dbUpdates.weekly_loss_target = updates.weeklyLossTarget
  if (updates.mainGoal !== undefined) dbUpdates.main_goal = updates.mainGoal
  if (updates.interestedPeptides !== undefined)
    dbUpdates.interested_peptides = updates.interestedPeptides
  if (updates.additionalInfo !== undefined)
    dbUpdates.additional_info = updates.additionalInfo
  if (updates.peptideStack !== undefined) {
    dbUpdates.peptide_stack = updates.peptideStack
  }

  const { error } = await supabase
    .from('profiles')
    .update(dbUpdates)
    .eq('id', userId)

  return { error: error?.message ?? null }
}

export async function fetchChatHistory(
  userId: string
): Promise<{ id: string; role: 'user' | 'assistant'; content: string; createdAt: string }[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from('chat_messages')
    .select('id, role, content, created_at')
    .eq('user_id', userId)
    .neq('role', 'system')
    .order('created_at', { ascending: true })
    .limit(100)

  return (data ?? []).map((m) => ({
    id: m.id,
    role: m.role as 'user' | 'assistant',
    content: m.content,
    createdAt: m.created_at,
  }))
}

export async function saveChatMessage(
  userId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<void> {
  if (!supabase) return
  await supabase.from('chat_messages').insert({ user_id: userId, role, content })
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  if (!supabase) return true
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username.toLowerCase())
    .maybeSingle()
  return !data
}