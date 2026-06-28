import type { PeptideSelection } from '../constants/peptideCatalog'
import type { Peptide, TrackerState } from './index'

export type FamiliarityLevel = 'beginner' | 'intermediate' | 'advanced'

export type Gender = 'male' | 'female' | 'non_binary' | 'prefer_not_to_say'

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

export const AGE_OPTIONS = Array.from({ length: 33 }, (_, i) => i + 18)

export const TRAINING_OPTIONS = [
  'Weight training',
  'Running',
  'Walking / hiking',
  'Cycling',
  'Yoga / Pilates',
  'HIIT / CrossFit',
  'MMA / combat sports',
  'Swimming',
  'Team sports',
  'Not training right now',
] as const

export type TrainingActivity = (typeof TRAINING_OPTIONS)[number]

export function parseTrainingActivities(value: string | null | undefined): string[] {
  if (!value?.trim()) return []
  return value.split(',').map((s) => s.trim()).filter(Boolean)
}

export function serializeTrainingActivities(activities: string[]): string {
  return activities.join(', ')
}

export interface Questionnaire {
  familiarity: FamiliarityLevel
  mainGoal: string
  peptideSelections: PeptideSelection[]
  interestedPeptides: string
  currentWeight: number
  goalWeight: number
  gender: Gender
  age: number
  trainingActivities: string
  additionalInfo: string
}

export interface UserProfile {
  id: string
  email: string | null
  username: string | null
  familiarity: FamiliarityLevel | null
  mainGoal: string | null
  interestedPeptides: string | null
  peptideSelections: PeptideSelection[]
  additionalInfo: string | null
  gender: Gender | null
  age: number | null
  trainingActivities: string | null
  currentWeight: number | null
  goalWeight: number | null
  height: string | null
  startDate: string | null
  weeklyLossTarget: number | null
  peptideStack: Peptide[]
  trackerData: Partial<TrackerState> | null
  onboardingCompleted: boolean
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
}

export interface ProfileUpdatePayload {
  currentWeight?: number
  goalWeight?: number
  height?: string
  weeklyLossTarget?: number
  mainGoal?: string
  interestedPeptides?: string
  additionalInfo?: string
  gender?: Gender
  age?: number
  trainingActivities?: string
  peptideStack?: Peptide[]
}