import { AMINO_1MQ_START_DATE } from '../constants/reconstitutionTable'
import type { Peptide } from '../types'
import type { Vial } from '../types/v2'
import {
  loadVialLedger,
  saveVialLedger,
  VIAL_SEED_THROUGH,
} from '../lib/vialInventorySeed'
import { getInjectionsForDate, parseLocalYmd } from './peptideSchedule'
import { getTitrationForDay } from './recompProtocol'
import { saveVials } from './inventoryStorage'

function roundMg(n: number): number {
  return Math.round(n * 1000) / 1000
}

export function peptideIdOf(vial: Vial): string {
  return (vial.compoundId || '').trim()
}

export function vialsForPeptide(vials: Vial[], peptideId: string): Vial[] {
  return vials.filter((v) => peptideIdOf(v) === peptideId)
}

export function getActiveVialForPeptide(vials: Vial[], peptideId: string): Vial | undefined {
  return vials.find(
    (v) =>
      peptideIdOf(v) === peptideId &&
      !v.depleted &&
      (peptideId === 'test-cyp' || v.remainingMg > 0.001)
  )
}

export function doseMgForDate(
  peptide: Peptide,
  date: string,
  startDate: string
): { doseMg: number; units: number; doseMl?: number } {
  const day = parseLocalYmd(date)
  const start = parseLocalYmd(startDate)
  const dayInCycle = Math.max(
    0,
    Math.round((day.getTime() - start.getTime()) / 86_400_000)
  )
  const tier = getTitrationForDay(peptide, dayInCycle, day)
  if (peptide.id === 'test-cyp') {
    return { doseMg: 0, units: 0, doseMl: 0.75 }
  }
  return {
    doseMg: tier?.doseMg ?? peptide.protocol?.startingDoseMg ?? 0,
    units: tier?.syringeUnits ?? peptide.protocol?.startingSyringeUnits ?? 0,
  }
}

export function remainingDosesForVial(
  vial: Vial,
  peptide: Peptide | undefined,
  startDate: string,
  fromDate = new Date()
): number {
  if (vial.depleted || vial.remainingMg <= 0) return 0
  if (!peptide || peptide.id === 'test-cyp') return 0
  if (peptide.id === 'amino1mq') {
    let remaining = vial.remainingMg
    let count = 0
    for (let i = 0; i < 120; i++) {
      const day = new Date(fromDate)
      day.setHours(0, 0, 0, 0)
      day.setDate(day.getDate() + i)
      const shots = getInjectionsForDate([peptide], day, startDate)
      const shot = shots.find((s) => s.peptideId === peptide.id)
      if (!shot) continue
      const y = day.getFullYear()
      const m = String(day.getMonth() + 1).padStart(2, '0')
      const d = String(day.getDate()).padStart(2, '0')
      const dose = doseMgForDate(peptide, `${y}-${m}-${d}`, startDate).doseMg
      if (dose <= 0) continue
      if (remaining + 1e-6 < dose) break
      remaining = roundMg(remaining - dose)
      count += 1
    }
    return count
  }
  const todayIso = `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, '0')}-${String(fromDate.getDate()).padStart(2, '0')}`
  const dose = doseMgForDate(peptide, todayIso, startDate).doseMg
  if (dose <= 0) return 0
  return Math.floor(vial.remainingMg / dose)
}

function applyDelta(
  vials: Vial[],
  vialId: string,
  doseMg: number,
  doseMl?: number
): Vial[] {
  return vials.map((v) => {
    if (v.id !== vialId) return v
    if (v.depleted && doseMg > 0) return v
    const remainingMg = Math.max(0, roundMg(v.remainingMg - doseMg))
    const remainingMl =
      v.startingMl != null && doseMl
        ? Math.max(0, roundMg((v.remainingMl ?? v.startingMl) - doseMl))
        : v.remainingMl
    const drawsUsed =
      doseMl && doseMl > 0 ? (v.drawsUsed ?? 0) + (doseMg < 0 || doseMl < 0 ? -1 : 1) : v.drawsUsed
    const depleted =
      v.compoundId === 'test-cyp' ? false : remainingMg <= 0.001
    return {
      ...v,
      remainingMg,
      remainingMl,
      drawsUsed: drawsUsed != null && drawsUsed < 0 ? 0 : drawsUsed,
      depleted,
      finishedAt: depleted ? v.finishedAt || todayIsoDate() : v.finishedAt,
    }
  })
}

function todayIsoDate(): string {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
}

export function applyVialToggle(opts: {
  vials: Vial[]
  peptides: Peptide[]
  startDate: string
  date: string
  peptideId: string
  turningOn: boolean
}): { vials: Vial[]; vialId?: string; doseMg: number } {
  const { peptides, startDate, date, peptideId, turningOn } = opts
  let { vials } = opts
  const peptide = peptides.find((p) => p.id === peptideId)
  if (!peptide) return { vials, doseMg: 0 }
  if (peptideId === 'amino1mq' && date < AMINO_1MQ_START_DATE) {
    return { vials, doseMg: 0 }
  }

  const dose = doseMgForDate(peptide, date, startDate)
  const ledger = loadVialLedger()
  const key = `${date}:${peptideId}`

  if (turningOn) {
    if (ledger[key]) return { vials, vialId: ledger[key].vialId, doseMg: dose.doseMg }
    const active = getActiveVialForPeptide(vials, peptideId)
    if (!active) return { vials, doseMg: dose.doseMg }
    vials = applyDelta(vials, active.id, dose.doseMg, dose.doseMl)
    ledger[key] = { vialId: active.id, doseMg: dose.doseMg, doseMl: dose.doseMl }
    saveVialLedger(ledger)
    saveVials(vials)
    return { vials, vialId: active.id, doseMg: dose.doseMg }
  }

  const entry = ledger[key]
  if (!entry) return { vials, doseMg: dose.doseMg }
  vials = applyDelta(vials, entry.vialId, -entry.doseMg, entry.doseMl ? -entry.doseMl : undefined)
  const restored = vials.find((v) => v.id === entry.vialId)
  if (restored && restored.remainingMg > 0.001) {
    vials = vials.map((v) =>
      v.id === restored.id
        ? { ...v, depleted: false, finishedAt: undefined }
        : v
    )
  }
  delete ledger[key]
  saveVialLedger(ledger)
  saveVials(vials)
  return { vials, vialId: entry.vialId, doseMg: dose.doseMg }
}

export { VIAL_SEED_THROUGH }
