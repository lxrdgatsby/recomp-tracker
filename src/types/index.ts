export type PeptideFrequency = 'daily' | 'weekly'

export interface Peptide {
  id: string
  name: string
  dose: string
  frequency: PeptideFrequency
  timing?: string
  notes?: string
}

export interface Profile {
  currentWeight: number
  goalWeight: number
  height?: string
  startDate: string
  weeklyLossTarget: number
}

export interface WeightEntry {
  date: string
  weight: number
}

export interface InjectionLog {
  date: string
  peptideId: string
}

export interface WorkoutCompletion {
  date: string
  week: number
  dayIndex: number
}

export interface TrackerState {
  profile: Profile
  peptides: Peptide[]
  weightHistory: WeightEntry[]
  injectionLogs: InjectionLog[]
  workoutCompletions: WorkoutCompletion[]
}

export type ViewId =
  | 'dashboard'
  | 'profile'
  | 'peptides'
  | 'plan'
  | 'workouts'
  | 'progress'

export interface WorkoutDay {
  dayIndex: number
  label: string
  focus: string
  exercises: string[]
  stepsGoal: number
  pushupsGoal: number
  notes?: string
}

export interface WorkoutWeek {
  week: number
  days: WorkoutDay[]
  progressionNote: string
}