/**
 * PeptideTracker v2 domain models — vial inventory, dose logs, blends, check-ins.
 * Persisted in localStorage (see utils/v2Storage.ts); designed for future Supabase sync.
 */

export type PeptideCompound = {
  id: string
  name: string
  typicalDose?: string
  halfLifeHours?: number
}

export type Vial = {
  id: string
  compoundName: string
  /** @deprecated optional legacy id — match by compoundName when missing */
  compoundId?: string
  vialMg: number // total peptide in the vial
  bacWaterMl: number
  concentrationMgPerMl: number // calculated
  mixedDate: string // ISO date
  isPowder: boolean
  remainingMg: number
  notes?: string
  createdAt: string
  /** Soft-delete / fully used */
  depleted?: boolean
  finishedAt?: string
}

export type DoseLog = {
  id: string
  date: string // ISO
  compoundName: string
  /** @deprecated optional legacy */
  compoundId?: string
  doseMg: number
  units: number
  vialId?: string
  injectionSite?: string
  notes?: string
  taken: boolean // true = taken, false = missed
  createdAt: string
}

export type Blend = {
  id: string
  name: string
  components: {
    compoundId: string
    compoundName: string
    doseMg: number
  }[]
}

export type CheckIn = {
  id: string
  date: string
  weight?: number
  energy?: number // 1-10
  sleep?: number // 1-10
  notes?: string
}

/** Adaptive plan evaluation snapshot */
export type PlanHealthStatus = 'on_track' | 'needs_attention' | 'adjust' | 'unknown'

export type PlanHealth = {
  status: PlanHealthStatus
  summary: string
  suggestions: string[]
  evaluatedAt: string
  adherence7d: number
  weightTrendLbsPerWeek: number | null
  avgEnergy: number | null
}

export type AdaptivePlanState = {
  originalSummary: string[]
  originalGeneratedAt?: string
  lastEvaluation?: PlanHealth
  adjustments: { date: string; note: string }[]
}
