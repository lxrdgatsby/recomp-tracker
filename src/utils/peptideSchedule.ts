import { addDays, format, parseISO } from 'date-fns'
import type { InjectionLog, Peptide } from '../types'

export interface ScheduledInjection {
  peptideId: string
  peptideName: string
  dose: string
  timing: string
  notes?: string
}

export function getInjectionsForDate(
  peptides: Peptide[],
  date: Date,
  startDate: string
): ScheduledInjection[] {
  const start = parseISO(startDate)

  return peptides
    .filter((p) => {
      if (date < start) return false
      if (p.frequency === 'daily') return true
      return isWeeklyInjectionDay(date, start)
    })
    .map((p) => ({
      peptideId: p.id,
      peptideName: p.name,
      dose: p.dose,
      timing: p.timing ?? (p.frequency === 'weekly' ? 'Weekly — same day each week' : 'Daily'),
      notes: p.notes,
    }))
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