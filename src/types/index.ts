export type PeptideFrequency = 'daily' | 'weekly' | 'mwf'
export type BacWaterUnits = 100 | 200 | 300 | 500

export interface TitrationWeek {
  weeks: string
  doseMg: number
  doseLabel: string
  syringeUnits: number
  notes?: string
  /** Inclusive YYYY-MM-DD. Used for mid-week inserts (e.g. 5-Amino-1MQ). */
  startDate?: string
  /** Inclusive YYYY-MM-DD. Omit to keep the tier open-ended. */
  endDate?: string
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
  /** First calendar day this compound appears on Today’s Injections. */
  startsOn?: string
}

export interface RecompPlan {
  generatedAt: string
  summary: string[]
  nutritionNotes: string[]
  trainingNotes: string[]
  checkInCadence: string
  reconstitutionReminder?: string
  /** Protocol definition version. Logs / start date are independent. */
  definitionVersion?: string
}

export type CheckInCadence = 'daily' | 'weekly'

export interface Profile {
  currentWeight: number
  goalWeight: number
  height?: string
  startDate: string
  weeklyLossTarget: number
  checkInCadence?: CheckInCadence
  weeklyWeighInDay?: number
  weighInReminderEnabled?: boolean
}

export interface WeightEntry {
  date: string
  weight: number
}

export interface InjectionLog {
  date: string
  peptideId: string
  peptideName?: string
  doseMg?: number
  units?: number
  vialId?: string
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
  /** Snapshot of the live protocol the Assistant reads. Logs/start date stay independent. */
  protocolProfile?: Record<string, unknown>
  /** Peptides-tab vial inventory. Independent of injection history. */
  vialInventory?: import('./v2').Vial[]
}

export type ViewId =
  | 'dashboard'
  | 'assistant'
  | 'faqs'
  | 'profile'
  | 'settings'
  | 'company'
  | 'admin'
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

// v2 inventory / dose / plan models
export type {
  PeptideCompound,
  Vial,
  DoseLog as InventoryDoseLog,
  Blend,
  CheckIn as V2CheckIn,
  PlanHealth,
  PlanHealthStatus,
  AdaptivePlanState,
} from './v2'