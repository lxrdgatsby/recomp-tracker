import {
  eachDayOfInterval,
  format,
  parseISO,
  startOfDay,
  subDays,
} from 'date-fns'
import type { DoseLog } from '../types/v2'
import type { TrackerState } from '../types'
import { getInjectionsForDate } from './peptideSchedule'
import { loadDoseLogs } from './inventoryStorage'

export type DayAdherenceCell = {
  date: string
  status: 'taken' | 'missed' | 'partial' | 'empty' | 'none'
  taken: number
  expected: number
}

function dateKey(iso: string): string {
  return iso.slice(0, 10)
}

/**
 * Prefer detailed v2 dose logs; fall back to scheduled peptides + injectionLogs.
 */
export function computeWindowAdherence(
  state: TrackerState,
  days: number
): {
  pct: number
  taken: number
  expected: number
  cells: DayAdherenceCell[]
  streak: number
} {
  const end = startOfDay(new Date())
  const start = subDays(end, days - 1)
  const interval = eachDayOfInterval({ start, end })
  const v2Logs = loadDoseLogs()

  let takenTotal = 0
  let expectedTotal = 0
  const cells: DayAdherenceCell[] = []

  for (const day of interval) {
    const dateStr = format(day, 'yyyy-MM-dd')
    const dayLogs = v2Logs.filter((l) => dateKey(l.date) === dateStr)

    if (dayLogs.length > 0) {
      const taken = dayLogs.filter((l) => l.taken).length
      const expected = dayLogs.length
      takenTotal += taken
      expectedTotal += expected
      let status: DayAdherenceCell['status'] = 'empty'
      if (expected === 0) status = 'none'
      else if (taken === expected) status = 'taken'
      else if (taken === 0) status = 'missed'
      else status = 'partial'
      cells.push({ date: dateStr, status, taken, expected })
      continue
    }

    // Fallback: scheduled stack + legacy injection logs
    const scheduled = getInjectionsForDate(
      state.peptides,
      day,
      state.profile.startDate
    )
    const expected = scheduled.length
    let taken = 0
    for (const inj of scheduled) {
      if (
        state.injectionLogs.some(
          (l) => l.date === dateStr && l.peptideId === inj.peptideId
        )
      ) {
        taken++
      }
    }
    takenTotal += taken
    expectedTotal += expected
    let status: DayAdherenceCell['status'] = 'none'
    if (expected === 0) status = 'none'
    else if (taken === expected) status = 'taken'
    else if (taken === 0) status = 'missed'
    else status = 'partial'
    cells.push({ date: dateStr, status, taken, expected })
  }

  const pct =
    expectedTotal > 0 ? Math.round((takenTotal / expectedTotal) * 100) : 100

  // Streak: consecutive days ending today with full taken (or no expected)
  let streak = 0
  for (let i = cells.length - 1; i >= 0; i--) {
    const c = cells[i]
    if (c.status === 'none' || c.status === 'taken') {
      if (c.status === 'taken') streak++
      continue
    }
    if (c.status === 'empty') continue
    break
  }

  return { pct, taken: takenTotal, expected: expectedTotal, cells, streak }
}

export function recentDoseLogsForAI(days = 14): DoseLog[] {
  const cutoff = subDays(new Date(), days)
  return loadDoseLogs()
    .filter((l) => {
      try {
        return parseISO(dateKey(l.date)) >= cutoff
      } catch {
        return false
      }
    })
    .slice(0, 40)
}

export function formatDoseLogsForAI(logs: DoseLog[]): string {
  if (!logs.length) return 'No detailed dose logs in the last 14 days.'
  return logs
    .map((l) => {
      const day = dateKey(l.date)
      const status = l.taken ? 'taken' : 'missed'
      const site = l.injectionSite ? ` @ ${l.injectionSite}` : ''
      return `- ${day}: ${l.compoundName} ${l.doseMg}mg (${l.units}u) [${status}]${site}`
    })
    .join('\n')
}
