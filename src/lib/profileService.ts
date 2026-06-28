import { DEFAULT_PEPTIDES, DEFAULT_PROFILE } from '../constants/defaults'
import {
  formatPeptideSelections,
  type PeptideSelection,
} from '../constants/peptideCatalog'
import { generateRecompPlan, normalizeSelection } from '../utils/recompProtocol'
import type { Questionnaire } from '../types/auth'
import { formatSupabaseError } from './supabaseErrors'
import { supabase } from './supabase'
import type { Peptide, Profile, TrackerState } from '../types'
import type { UserProfile } from '../types/auth'

interface DbProfile {
  id: string
  email: string | null
  username: string | null
  familiarity: string | null
  main_goal: string | null
  interested_peptides: string | null
  peptide_selections: PeptideSelection[] | null
  additional_info: string | null
  gender: string | null
  age: number | null
  training_activities: string | null
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
    peptideSelections: (row.peptide_selections ?? []).map((s) =>
      normalizeSelection(s as PeptideSelection)
    ),
    additionalInfo: row.additional_info,
    gender: row.gender as UserProfile['gender'],
    age: row.age,
    trainingActivities: row.training_activities,
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

function buildTrackerFromProfile(userProfile: UserProfile): TrackerState {
  const saved = userProfile.trackerData
  const profile = {
    currentWeight: userProfile.currentWeight ?? DEFAULT_PROFILE.currentWeight,
    goalWeight: userProfile.goalWeight ?? DEFAULT_PROFILE.goalWeight,
    height: userProfile.height ?? '',
    startDate: userProfile.startDate ?? DEFAULT_PROFILE.startDate,
    weeklyLossTarget:
      userProfile.weeklyLossTarget ?? DEFAULT_PROFILE.weeklyLossTarget,
  }

  const selections = (userProfile.peptideSelections ?? []).map(normalizeSelection)

  if (selections.length > 0) {
    const { peptides, recompPlan } = generateRecompPlan({
      familiarity: userProfile.familiarity ?? 'beginner',
      mainGoal: userProfile.mainGoal ?? '',
      gender: userProfile.gender,
      age: userProfile.age,
      trainingActivities: userProfile.trainingActivities,
      additionalInfo: userProfile.additionalInfo,
      currentWeight: profile.currentWeight,
      goalWeight: profile.goalWeight,
      weeklyLossTarget: profile.weeklyLossTarget,
      peptideSelections: selections,
    })
    return {
      profile,
      peptides,
      recompPlan,
      weightHistory: saved?.weightHistory ?? [],
      injectionLogs: saved?.injectionLogs ?? [],
      workoutCompletions: saved?.workoutCompletions ?? [],
    }
  }

  return {
    profile,
    peptides:
      userProfile.peptideStack.length > 0
        ? userProfile.peptideStack
        : [...DEFAULT_PEPTIDES],
    recompPlan: saved?.recompPlan,
    weightHistory: saved?.weightHistory ?? [],
    injectionLogs: saved?.injectionLogs ?? [],
    workoutCompletions: saved?.workoutCompletions ?? [],
  }
}

export function profileToTrackerState(userProfile: UserProfile): TrackerState {
  return buildTrackerFromProfile(userProfile)
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

  const interestedPeptides =
    questionnaire.interestedPeptides ||
    formatPeptideSelections(questionnaire.peptideSelections)

  const { peptides: peptideStack, recompPlan } = generateRecompPlan({
    familiarity: questionnaire.familiarity,
    mainGoal: questionnaire.mainGoal,
    gender: questionnaire.gender,
    age: questionnaire.age,
    trainingActivities: questionnaire.trainingActivities,
    additionalInfo: questionnaire.additionalInfo,
    currentWeight: questionnaire.currentWeight,
    goalWeight: questionnaire.goalWeight,
    weeklyLossTarget: DEFAULT_PROFILE.weeklyLossTarget,
    peptideSelections: questionnaire.peptideSelections,
  })

  const trackerState: TrackerState = {
    profile: {
      currentWeight: questionnaire.currentWeight,
      goalWeight: questionnaire.goalWeight,
      height: '',
      startDate: new Date().toISOString().slice(0, 10),
      weeklyLossTarget: DEFAULT_PROFILE.weeklyLossTarget,
    },
    peptides: peptideStack,
    recompPlan,
    weightHistory: [],
    injectionLogs: [],
    workoutCompletions: [],
  }

  const { error } = await supabase.from('profiles').upsert(
    {
      id: userId,
      username,
      familiarity: questionnaire.familiarity,
      main_goal: questionnaire.mainGoal,
      interested_peptides: interestedPeptides,
      peptide_selections: questionnaire.peptideSelections,
      additional_info: questionnaire.additionalInfo,
      gender: questionnaire.gender,
      age: questionnaire.age,
      training_activities: questionnaire.trainingActivities,
      current_weight: questionnaire.currentWeight,
      goal_weight: questionnaire.goalWeight,
      start_date: trackerState.profile.startDate,
      peptide_stack: peptideStack,
      tracker_data: trackerState,
      onboarding_completed: true,
    },
    { onConflict: 'id' }
  )

  return { error: error ? formatSupabaseError(error.message) : null }
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
    gender?: string | null
    age?: number | null
    trainingActivities?: string | null
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
  if (extras?.gender !== undefined) update.gender = extras.gender
  if (extras?.age !== undefined) update.age = extras.age
  if (extras?.trainingActivities !== undefined)
    update.training_activities = extras.trainingActivities

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
    gender: string
    age: number
    trainingActivities: string
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
  if (updates.gender !== undefined) dbUpdates.gender = updates.gender
  if (updates.age !== undefined) dbUpdates.age = updates.age
  if (updates.trainingActivities !== undefined)
    dbUpdates.training_activities = updates.trainingActivities
  if (updates.peptideStack !== undefined) {
    dbUpdates.peptide_stack = updates.peptideStack
  }

  const { error } = await supabase
    .from('profiles')
    .update(dbUpdates)
    .eq('id', userId)

  return { error: error?.message ?? null }
}

export async function saveReconstitutionPlan(
  userId: string,
  selections: PeptideSelection[],
  trackerState: TrackerState
): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase not configured' }

  const { error } = await supabase
    .from('profiles')
    .update({
      peptide_selections: selections.map(normalizeSelection),
      peptide_stack: trackerState.peptides,
      tracker_data: trackerState,
    })
    .eq('id', userId)

  return { error: error ? formatSupabaseError(error.message) : null }
}

export async function isUsernameAvailable(
  username: string
): Promise<{ available: boolean; error: string | null }> {
  if (!supabase) return { available: true, error: null }
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username.toLowerCase())
    .maybeSingle()
  if (error) {
    return { available: false, error: formatSupabaseError(error.message) }
  }
  return { available: !data, error: null }
}