/**
 * Clean data helpers for Contextual AI Coach + Adaptive Plan Health.
 * Reads localStorage (v2) + TrackerState; ready for Supabase sync later.
 */

import { differenceInDays, parseISO, subDays } from 'date-fns'
import type { Peptide, TrackerState } from '../types'
import type { CheckIn, DoseLog, Vial } from '../types/v2'
import { getCheckInHistory, getLastCheckIn } from './checkInStorage'
import { computeWindowAdherence } from './doseAdherence'
import { getCurrentInjectionDose, formatProtocolContextForAI } from './recompProtocol'
import { loadDoseLogs } from './inventoryStorage'
import { activeVials, loadV2CheckIns } from './v2Storage'

export type ActiveStackItem = {
  id: string
  name: string
  doseLabel: string
  doseMg?: number
  syringeUnits?: number
  frequency: string
  timing?: string
}

/** Current active peptide stack with live protocol doses. */
export function getActiveStack(state: TrackerState): ActiveStackItem[] {
  return state.peptides.map((p: Peptide) => {
    const dose = getCurrentInjectionDose(p, state.profile.startDate)
    return {
      id: p.id,
      name: p.name,
      doseLabel: dose.doseLabel,
      doseMg: dose.doseMg,
      syringeUnits: dose.syringeUnits,
      frequency: p.frequency,
      timing: p.timing,
    }
  })
}

/** Recent detailed dose logs (taken / missed) from localStorage. */
export function getRecentDoseLogs(days = 14): DoseLog[] {
  const cutoff = subDays(new Date(), days)
  return loadDoseLogs()
    .filter((l) => {
      try {
        const d = parseISO(l.date.slice(0, 10))
        return d >= cutoff
      } catch {
        return false
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date))
}

export type RecentCheckIn = {
  date: string
  weight?: number
  energy?: number
  sleep?: number
  notes?: string
  sideEffects?: string
  source: 'v2' | 'legacy'
}

/** Latest check-ins: weight, energy, sleep (v2 + legacy storage). */
export function getRecentCheckIns(days = 14): RecentCheckIn[] {
  const cutoff = subDays(new Date(), days)
  const out: RecentCheckIn[] = []

  for (const c of loadV2CheckIns() as CheckIn[]) {
    try {
      const d = parseISO(c.date.slice(0, 10))
      if (d < cutoff) continue
      out.push({
        date: c.date.slice(0, 10),
        weight: c.weight,
        energy: c.energy,
        sleep: c.sleep,
        notes: c.notes,
        source: 'v2',
      })
    } catch {
      /* skip */
    }
  }

  for (const c of getCheckInHistory()) {
    try {
      const key = c.date.slice(0, 10)
      const d = parseISO(key)
      if (d < cutoff) continue
      if (out.some((x) => x.date === key)) continue
      const energy = parseInt(String(c.energy), 10)
      const weight = parseFloat(String(c.weight))
      out.push({
        date: key,
        weight: Number.isNaN(weight) ? undefined : weight,
        energy: Number.isNaN(energy) ? undefined : energy,
        notes: c.notes || undefined,
        sideEffects: c.sideEffects || undefined,
        source: 'legacy',
      })
    } catch {
      /* skip */
    }
  }

  // Include last check-in if history empty
  if (out.length === 0) {
    const last = getLastCheckIn()
    if (last) {
      const energy = parseInt(String(last.energy), 10)
      const weight = parseFloat(String(last.weight))
      out.push({
        date: last.date.slice(0, 10),
        weight: Number.isNaN(weight) ? undefined : weight,
        energy: Number.isNaN(energy) ? undefined : energy,
        notes: last.notes || undefined,
        sideEffects: last.sideEffects || undefined,
        source: 'legacy',
      })
    }
  }

  return out.sort((a, b) => b.date.localeCompare(a.date))
}

/** Adherence % over the last N days (v2 logs + scheduled fallback). */
export function getAdherencePercentage(
  days: number,
  state: TrackerState
): number {
  return computeWindowAdherence(state, days).pct
}

export function getActiveVials(): Vial[] {
  return activeVials()
}

/** Format helpers for AI context string. */
export function formatActiveStackForAI(state: TrackerState): string {
  const stack = getActiveStack(state)
  if (!stack.length) return 'Active stack: empty'
  const lines = stack.map(
    (s) =>
      `- ${s.name}: ${s.doseLabel}${s.syringeUnits != null ? ` (${s.syringeUnits}u)` : ''} · ${s.frequency}${s.timing ? ` · ${s.timing}` : ''}`
  )
  return (
    'Active stack:\n' +
    lines.join('\n') +
    '\n\nProtocol detail:\n' +
    formatProtocolContextForAI(state.peptides, state.profile.startDate)
  )
}

export function formatRecentDoseLogsForAI(days = 14): string {
  const logs = getRecentDoseLogs(days)
  if (!logs.length) return `Dose logs (last ${days}d): none recorded yet.`
  return (
    `Dose logs (last ${days}d):\n` +
    logs
      .slice(0, 40)
      .map((l) => {
        const day = l.date.slice(0, 10)
        const flag = l.taken ? 'taken' : 'missed'
        const site = l.injectionSite ? ` @ ${l.injectionSite}` : ''
        return `- ${day}: ${l.compoundName} ${l.doseMg}mg / ${l.units}u [${flag}]${site}`
      })
      .join('\n')
  )
}

export function formatRecentCheckInsForAI(days = 14): string {
  const rows = getRecentCheckIns(days)
  if (!rows.length) return `Check-ins (last ${days}d): none.`
  return (
    `Check-ins (last ${days}d):\n` +
    rows
      .slice(0, 20)
      .map((c) => {
        const se = c.sideEffects ? ` · sides: ${c.sideEffects}` : ''
        const n = c.notes ? ` · notes: ${c.notes}` : ''
        return `- ${c.date}: weight=${c.weight ?? 'n/a'} energy=${c.energy ?? 'n/a'}/10 sleep=${c.sleep ?? 'n/a'}${se}${n}`
      })
      .join('\n')
  )
}

export function formatVialsForAI(): string {
  const vials = getActiveVials()
  if (!vials.length) return 'Active vials: none in inventory.'
  return (
    'Active vials:\n' +
    vials
      .map(
        (v) =>
          `- ${v.compoundName}: ${v.remainingMg}mg left of ${v.vialMg}mg (${v.isPowder ? 'powder' : `${v.concentrationMgPerMl} mg/mL`})`
      )
      .join('\n')
  )
}

export function daysSince(isoDate: string): number {
  try {
    return differenceInDays(new Date(), parseISO(isoDate.slice(0, 10)))
  } catch {
    return 999
  }
}
