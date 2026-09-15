import { AMINO_1MQ_START_DATE } from '../constants/reconstitutionTable'
import type { InjectionLog, Peptide } from '../types'
import type { Vial } from '../types/v2'
import { getInjectionsForDate, parseLocalYmd } from './peptideSchedule'
import { getTitrationForDay } from './recompProtocol'

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

/** Assign a Done log to the vial that was active on that date. */
export function vialIdForDate(
  vials: Vial[],
  peptideId: string,
  date: string
): string | undefined {
  const day = date.slice(0, 10)
  const matches = vials.filter((v) => peptideIdOf(v) === peptideId)
  if (matches.length === 0) return undefined

  if (peptideId === 'ss31') {
    if (day < '2026-09-13') {
      return matches.find((v) => v.id === 'vial-ss31-a')?.id ?? oldestOnOrBefore(matches, day)
    }
    return matches.find((v) => v.id === 'vial-ss31-b')?.id ?? latestOnOrBefore(matches, day)
  }
  if (peptideId === 'aod9604') {
    if (day < '2026-09-13') {
      return matches.find((v) => v.id === 'vial-aod-a')?.id ?? oldestOnOrBefore(matches, day)
    }
    return matches.find((v) => v.id === 'vial-aod-b')?.id ?? latestOnOrBefore(matches, day)
  }
  if (peptideId === 'amino1mq') {
    if (day < AMINO_1MQ_START_DATE) return undefined
    return matches.find((v) => v.id === 'vial-amino1mq-a')?.id ?? latestOnOrBefore(matches, day)
  }
  return latestOnOrBefore(matches, day)
}

function openedIso(vial: Vial): string {
  return (vial.mixedDate || vial.createdAt || '').slice(0, 10)
}

function oldestOnOrBefore(vials: Vial[], date: string): string | undefined {
  const eligible = vials.filter((v) => {
    const opened = openedIso(v)
    return !opened || opened <= date
  })
  const sorted = [...(eligible.length ? eligible : vials)].sort((a, b) =>
    openedIso(a).localeCompare(openedIso(b))
  )
  return sorted[0]?.id
}

function latestOnOrBefore(vials: Vial[], date: string): string | undefined {
  const eligible = vials.filter((v) => {
    const opened = openedIso(v)
    return !opened || opened <= date
  })
  const sorted = [...(eligible.length ? eligible : vials)].sort((a, b) =>
    openedIso(b).localeCompare(openedIso(a))
  )
  return sorted[0]?.id
}

export function remainingDosesForVial(
  vial: Vial,
  peptide: Peptide | undefined,
  startDate: string,
  fromDate = new Date()
): number {
  if (vial.remainingMg <= 0.001) return 0
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

export function recalculateVialInventory(opts: {
  vials: Vial[]
  logs: InjectionLog[]
  peptides: Peptide[]
  startDate: string
}): Vial[] {
  const { vials, logs, peptides, startDate } = opts
  const used = new Map<string, { mg: number; ml: number; draws: number; lastDate?: string }>()

  for (const log of logs) {
    const date = (log.date || '').slice(0, 10)
    if (!date || !log.peptideId) continue
    if (log.peptideId === 'amino1mq' && date < AMINO_1MQ_START_DATE) continue
    const peptide = peptides.find((p) => p.id === log.peptideId)
    const protocolDose = peptide
      ? doseMgForDate(peptide, date, startDate)
      : { doseMg: 0, units: 0 }
    const doseMg =
      log.doseMg != null && log.doseMg > 0 ? log.doseMg : protocolDose.doseMg
    const doseMl = protocolDose.doseMl
    const vialId =
      log.vialId && vials.some((v) => v.id === log.vialId)
        ? log.vialId
        : vialIdForDate(vials, log.peptideId, date)
    if (!vialId) continue
    const cur = used.get(vialId) ?? { mg: 0, ml: 0, draws: 0 }
    cur.mg = roundMg(cur.mg + (doseMg || 0))
    if (doseMl) {
      cur.ml = roundMg(cur.ml + doseMl)
      cur.draws += 1
    }
    if (!cur.lastDate || date > cur.lastDate) cur.lastDate = date
    used.set(vialId, cur)
  }

  return vials.map((vial) => {
    const isTest = peptideIdOf(vial) === 'test-cyp'
    const spent = used.get(vial.id) ?? { mg: 0, ml: 0, draws: 0 }
    const remainingMg = isTest
      ? vial.remainingMg
      : Math.max(0, roundMg(vial.vialMg - spent.mg))
    const depleted = isTest ? false : remainingMg <= 0.001
    const remainingMl =
      vial.startingMl != null
        ? Math.max(0, roundMg(vial.startingMl - spent.ml))
        : vial.remainingMl
    return {
      ...vial,
      remainingMg,
      remainingMl,
      drawsUsed: isTest ? spent.draws : vial.drawsUsed,
      depleted,
      finishedAt: depleted ? spent.lastDate || vial.finishedAt : undefined,
    }
  })
}

export function applyVialToggle(opts: {
  vials: Vial[]
  peptides: Peptide[]
  startDate: string
  date: string
  peptideId: string
  turningOn: boolean
  logs: InjectionLog[]
}): { vials: Vial[]; vialId?: string; doseMg: number; logs: InjectionLog[] } {
  const { peptides, startDate, date, peptideId, turningOn } = opts
  const peptide = peptides.find((p) => p.id === peptideId)
  const dose = peptide
    ? doseMgForDate(peptide, date, startDate)
    : { doseMg: 0, units: 0 }
  if (peptideId === 'amino1mq' && date < AMINO_1MQ_START_DATE) {
    return { vials: opts.vials, doseMg: 0, logs: opts.logs }
  }
  const vialId = vialIdForDate(opts.vials, peptideId, date)
  const logs = turningOn
    ? [
        ...opts.logs.filter((l) => !(l.date.slice(0, 10) === date && l.peptideId === peptideId)),
        { date, peptideId, doseMg: dose.doseMg, units: dose.units, vialId },
      ]
    : opts.logs.filter((l) => !(l.date.slice(0, 10) === date && l.peptideId === peptideId))

  const vials = recalculateVialInventory({
    vials: opts.vials,
    logs,
    peptides,
    startDate,
  })
  return { vials, vialId, doseMg: dose.doseMg, logs }
}
