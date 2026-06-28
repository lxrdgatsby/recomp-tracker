import type { Peptide, TrackerState } from './index'

export type FamiliarityLevel = 'beginner' | 'intermediate' | 'advanced'

export interface Questionnaire {
  familiarity: FamiliarityLevel
  mainGoal: string
  interestedPeptides: string
  currentWeight: number
  goalWeight: number
  additionalInfo: string
}

export interface UserProfile {
  id: string
  email: string | null
  username: string | null
  familiarity: FamiliarityLevel | null
  mainGoal: string | null
  interestedPeptides: string | null
  additionalInfo: string | null
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
  peptideStack?: Peptide[]
}