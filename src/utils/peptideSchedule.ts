import { addDays, differenceInDays, format, parseISO } from 'date-fns'
import type { InjectionLog, Peptide } from '../types'
import { formatSyringeUnits, getTitrationForDay } from './recompProtocol'

export interface ScheduledInjection {
  peptideId: string
  peptideName: string
  dose: string
  syringeUnits?: number
  timing: string
  notes?: string
}

export function getInjectionsForDate(
  peptides: Peptide[],
  date: Date,
  startDate: string
): ScheduledInjection[] {
  const start = parseISO(startDate)
  const dayInCycle = Math.max(0, differenceInDays(date, start))

  return peptides
    .filter((p) => {
      if (date < start) return false
      if (p.frequency === 'daily') return true
      return isWeeklyInjectionDay(date, start)
    })
    .map((p) => {
      const tier = getTitrationForDay(p, dayInCycle)
      const syringeUnits = tier?.syringeUnits ?? p.protocol?.startingSyringeUnits
      const dose =
        syringeUnits != null
          ? formatSyringeUnits(syringeUnits)
          : tier?.doseLabel ?? p.dose
      const titrationNote = tier?.notes

      return {
        peptideId: p.id,
        peptideName: p.name,
        dose,
        syringeUnits,
        timing:
          p.timing ??
          (p.frequency === 'weekly' ? 'Weekly — same day each week' : 'Daily'),
        notes: titrationNote ? `${titrationNote}. ${p.notes ?? ''}`.trim() : p.notes,
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