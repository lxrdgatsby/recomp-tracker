import type { InjectionLog, Peptide } from '../types'
import type { Vial } from '../types/v2'
import {
  hasTakenDoseLogOnDay,
  loadDoseLogs,
  recordScheduledDoseLog,
  saveVials,
  type NewDoseLogInput,
} from './inventoryStorage'
import {
  doseMgForDate,
  isReplacedVial,
  peptideIdOf,
  remainingDosesForVial,
} from './vialUsage'
import { describeShelfLife, formatVialDate } from './vialShelfLife'

export type TodayDoseVialMeta = {
  dosesLeft: number | null
  expiresLabel: string
  empty: boolean
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/

function openedSortKey(vial: Vial): string {
  const opened = (vial.mixedDate || '').slice(0, 10)
  return `${opened} ${vial.createdAt || ''}`
}

function vialHasStock(vial: Vial): boolean {
  return !vial.depleted && vial.remainingMg > 0.001
}

/** Newest mixed, non-replaced vial. Prefers one that still has peptide left. */
export function linkedMixedVial(vials: Vial[], peptideId: string): Vial | undefined {
  const mixed = vials.filter(
    (vial) =>
      peptideIdOf(vial) === peptideId &&
      !vial.isPowder &&
      !isReplacedVial(vial)
  )
  const active = mixed.filter(vialHasStock)
  const pool = active.length > 0 ? active : mixed
  return [...pool].sort((a, b) => openedSortKey(b).localeCompare(openedSortKey(a)))[0]
}

export function expiresLabelForVial(
  vial?: Pick<Vial, 'mixedDate' | 'isPowder' | 'expiresOn'> | null
): string {
  if (!vial || vial.isPowder) return '—'
  const stored = (vial.expiresOn || '').slice(0, 10)
  if (ISO_DAY.test(stored)) return formatVialDate(stored)
  return describeShelfLife(vial).expiresLabel ?? '—'
}

export function dosesLeftOnVial(
  vial: Vial | undefined,
  peptide: Peptide | undefined,
  startDate: string,
  fromDate = new Date()
): number | null {
  if (!vial || !peptide) return null
  if (peptide.id === 'test-cyp') {
    if (vial.remainingMl == null) return null
    if (vial.remainingMl <= 0.001) return 0
    return Math.floor(vial.remainingMl / 0.75)
  }
  return remainingDosesForVial(vial, peptide, startDate, fromDate)
}

export function vialMetaForPeptide(
  vials: Vial[],
  peptide: Peptide,
  startDate: string,
  now = new Date()
): TodayDoseVialMeta {
  const linked = linkedMixedVial(vials, peptide.id)
  const dosesLeft = dosesLeftOnVial(linked, peptide, startDate, now)
  return {
    dosesLeft,
    expiresLabel: expiresLabelForVial(linked),
    empty: dosesLeft === 0,
  }
}

export function formatDoseTime(now: Date): string {
  return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function roundMg(n: number): number {
  return Math.round(n * 1000) / 1000
}

function withDoseSubtracted(
  vial: Vial,
  peptide: Peptide,
  dose: { doseMg: number; doseMl?: number },
  day: string
): Vial {
  if (peptide.id === 'test-cyp') {
    const drawsUsed = (vial.drawsUsed ?? 0) + 1
    if (vial.remainingMl == null) return { ...vial, drawsUsed }
    const remainingMl = Math.max(0, roundMg(vial.remainingMl - (dose.doseMl || 0.75)))
    return { ...vial, remainingMl, drawsUsed, depleted: false }
  }
  const remainingMg = Math.max(0, roundMg(vial.remainingMg - (dose.doseMg || 0)))
  const depleted = remainingMg <= 0.001
  return {
    ...vial,
    remainingMg,
    depleted,
    finishedAt: depleted ? vial.finishedAt || day : vial.finishedAt,
  }
}

function localDateTime(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

function previousSite(logs: InjectionLog[], peptide: Peptide): string | undefined {
  let best: { date: string; site: string } | undefined
  const consider = (date: string, site?: string) => {
    const trimmed = site?.trim()
    if (!trimmed) return
    if (!best || date > best.date) best = { date, site: trimmed }
  }
  for (const log of logs) {
    if (log.peptideId !== peptide.id) continue
    consider(log.date, log.injectionSite)
  }
  const name = peptide.name.trim().toLowerCase()
  for (const log of loadDoseLogs()) {
    const same =
      log.compoundId === peptide.id ||
      log.compoundName.trim().toLowerCase() === name
    if (!same) continue
    consider(log.date, log.injectionSite)
  }
  return best?.site
}

export function markScheduledDoseDone(opts: {
  vials: Vial[]
  peptides: Peptide[]
  startDate: string
  date: string
  peptideId: string
  logs: InjectionLog[]
  now?: Date
}): {
  created: boolean
  logs: InjectionLog[]
  vials: Vial[]
  doseLog?: NewDoseLogInput
} {
  const now = opts.now ?? new Date()
  const day = opts.date.slice(0, 10)
  const peptide = opts.peptides.find((item) => item.id === opts.peptideId)
  if (!peptide) return { created: false, logs: opts.logs, vials: opts.vials }

  const already = opts.logs.some(
    (log) => log.peptideId === opts.peptideId && log.date.slice(0, 10) === day
  )
  if (already) return { created: false, logs: opts.logs, vials: opts.vials }

  const linked = linkedMixedVial(opts.vials, opts.peptideId)
  const left = dosesLeftOnVial(linked, peptide, opts.startDate, now)
  if (left === 0) return { created: false, logs: opts.logs, vials: opts.vials }

  const dose = doseMgForDate(peptide, day, opts.startDate)
  const site = previousSite(opts.logs, peptide)
  const entry: InjectionLog = {
    date: day,
    peptideId: peptide.id,
    peptideName: peptide.name,
    doseMg: dose.doseMg,
    units: dose.units,
    vialId: linked?.id,
    time: formatDoseTime(now),
    injectionSite: site,
  }
  const logs = [...opts.logs, entry]
  const vials = linked
    ? opts.vials.map((vial) =>
        vial.id === linked.id ? withDoseSubtracted(vial, peptide, dose, day) : vial
      )
    : opts.vials

  return {
    created: true,
    logs,
    vials,
    doseLog: {
      date: localDateTime(now),
      compoundName: peptide.name,
      compoundId: peptide.id,
      doseMg: dose.doseMg,
      units: dose.units,
      vialId: linked?.id,
      injectionSite: site,
      taken: true,
    },
  }
}

/** Write the new dose log and vial totals. Leaves every existing log in place. */
export function commitMarkedDose(opts: {
  vials: Vial[]
  peptides: Peptide[]
  startDate: string
  date: string
  peptideId: string
  logs: InjectionLog[]
  now?: Date
}): { created: boolean; logs: InjectionLog[]; vials: Vial[] } {
  const result = markScheduledDoseDone(opts)
  if (!result.created || !result.doseLog) {
    return { created: false, logs: opts.logs, vials: opts.vials }
  }
  const day = opts.date.slice(0, 10)
  if (
    !hasTakenDoseLogOnDay(
      result.doseLog.compoundName,
      day,
      result.doseLog.compoundId
    )
  ) {
    recordScheduledDoseLog(result.doseLog)
  }
  saveVials(result.vials)
  return { created: true, logs: result.logs, vials: result.vials }
}
