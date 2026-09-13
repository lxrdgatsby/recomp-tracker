import { addDays, differenceInDays, format, parseISO } from 'date-fns'
import type { InjectionLog, Peptide } from '../types'
import { formatSyringeUnits, getTitrationForDay } from './recompProtocol'
import { formatUnits } from './doseMath'

export type InjectionSlot =
  | 'morning'
  | 'peri'
  | 'evening'
  | 'night'
  | 'weekly'

export interface ScheduledInjection {
  peptideId: string
  peptideName: string
  dose: string
  syringeUnits?: number
  timing: string
  notes?: string
  slot: InjectionSlot
  /** e.g. "Tesamorelin · 15 units on U-100 · Night, 2–3 h fasted" */
  cardLine: string
}

export const SLOT_LABELS: Record<InjectionSlot, string> = {
  morning: 'Morning, fasted',
  peri: 'Peri-training / after first meal',
  evening: 'Evening / post-training',
  night: 'Night, 2–3 h after last food',
  weekly: 'Weekly',
}

const SLOT_ORDER: InjectionSlot[] = [
  'morning',
  'peri',
  'evening',
  'night',
  'weekly',
]

const SLOT_BY_ID: Record<string, InjectionSlot> = {
  aod9604: 'morning',
  ss31: 'morning',
  motsc: 'morning',
  ghkcu: 'morning',
  bpc157: 'peri',
  klow: 'evening',
  nad: 'evening',
  tesamorelin: 'night',
  'test-cyp': 'weekly',
  retatrutide: 'weekly',
}

export function injectionSlot(peptideId: string): InjectionSlot {
  return SLOT_BY_ID[peptideId] ?? 'morning'
}

export function formatInjectionCardLine(opts: {
  name: string
  peptideId: string
  dose: string
  syringeUnits?: number
  timing: string
}): string {
  const isVolume =
    opts.peptideId === 'test-cyp' || /ml/i.test(opts.dose)
  if (isVolume) {
    return `${opts.name} · ${opts.dose} · ${opts.timing}`
  }
  if (opts.syringeUnits != null && opts.syringeUnits > 0) {
    return `${opts.name} · ${formatUnits(opts.syringeUnits)} units on U-100 · ${opts.timing}`
  }
  return `${opts.name} · ${opts.dose} · ${opts.timing}`
}

export function groupInjectionsBySlot(
  injections: ScheduledInjection[]
): { slot: InjectionSlot; label: string; items: ScheduledInjection[] }[] {
  return SLOT_ORDER.map((slot) => ({
    slot,
    label: SLOT_LABELS[slot],
    items: injections.filter((inj) => inj.slot === slot),
  })).filter((group) => group.items.length > 0)
}

export function getInjectionsForDate(
  peptides: Peptide[],
  date: Date,
  startDate: string
): ScheduledInjection[] {
  const start = parseISO(startDate)
  const preview = date < start
  const scheduleDate = preview ? start : date
  const dayInCycle = Math.max(0, differenceInDays(scheduleDate, start))

  return peptides
    .filter((p) => {
      const dow = scheduleDate.getDay()
      if (p.frequency === 'daily') return true
      if (p.frequency === 'mwf') return dow === 1 || dow === 3 || dow === 5
      return isWeeklyInjectionDay(scheduleDate, start)
    })
    .map((p) => {
      const tier = getTitrationForDay(p, dayInCycle)
      const syringeUnits = tier?.syringeUnits ?? p.protocol?.startingSyringeUnits
      const dose = /ml/i.test(p.dose)
        ? p.dose
        : syringeUnits != null
          ? formatSyringeUnits(syringeUnits)
          : tier?.doseLabel ?? p.dose
      const titrationNote = tier?.notes
      const timing =
        p.timing ??
        (p.frequency === 'weekly' ? 'Weekly — same day each week' : 'Daily')

      return {
        peptideId: p.id,
        peptideName: p.name,
        dose,
        syringeUnits,
        timing,
        notes: titrationNote ? `${titrationNote}. ${p.notes ?? ''}`.trim() : p.notes,
        slot: injectionSlot(p.id),
        cardLine: formatInjectionCardLine({
          name: p.name,
          peptideId: p.id,
          dose,
          syringeUnits,
          timing,
        }),
      }
    })
}

function isWeeklyInjectionDay(date: Date, start: Date): boolean {
  return date.getDay() === start.getDay()
}

export function isInjectionDone(logs: InjectionLog[], date: string, peptideId: string): boolean {
  return logs.some((l) => l.date === date && l.peptideId === peptideId)
}

export function getScheduleDates(startDate: string, count: number): string[] {
  const start = parseISO(startDate)
  return Array.from({ length: count }, (_, i) =>
    format(addDays(start, i), 'yyyy-MM-dd')
  )
}

/** Last `count` calendar days ending today, skipping dates before the cycle start. Oldest first. */
export function getRecentScheduleDates(
  startDate: string,
  count: number
): string[] {
  const start = parseISO(startDate)
  const today = new Date()
  const dates: string[] = []
  for (let i = count - 1; i >= 0; i--) {
    const date = addDays(today, -i)
    if (date >= start) dates.push(format(date, 'yyyy-MM-dd'))
  }
  return dates
}