export type PeptideFrequency = 'daily' | 'weekly'
export type BacWaterUnits = 100 | 200 | 300

export interface TitrationWeek {
  weeks: string
  doseMg: number
  doseLabel: string
  syringeUnits: number
  notes?: string
}

export interface PeptideProtocol {
  vialMg: number
  bacWaterUnits: BacWaterUnits
  bacWaterMl: number
  concentrationMgPerMl: number
  concentrationLabel: string
  startingDoseMg: number
  startingDoseLabel: string
  startingSyringeUnits: number
  reconstituted: boolean
  calculationSummary: string
  reconstitutionSteps: string[]
  titration: TitrationWeek[]
}

export interface Peptide {
  id: string
  name: string
  dose: string
  frequency: PeptideFrequency
  timing?: string
  notes?: string
  vialSize?: string
  protocol?: PeptideProtocol
}

export interface RecompPlan {
  generatedAt: string
  summary: string[]
  nutritionNotes: string[]
  trainingNotes: string[]
  checkInCadence: string
  reconstitutionReminder?: string
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
  recompPlan?: RecompPlan
  weightHistory: WeightEntry[]
  injectionLogs: InjectionLog[]
  workoutCompletions: WorkoutCompletion[]
}

export type ViewId =
  | 'dashboard'
  | 'assistant'
  | 'faqs'
  | 'profile'
  | 'settings'
  | 'company'
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