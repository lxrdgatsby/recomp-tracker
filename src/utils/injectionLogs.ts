import { format } from 'date-fns'
import type { DoseLog } from '../components/DoseCalculator'
import type { InjectionLog, TrackerState } from '../types'

export function doseLogToInjectionEntry(log: DoseLog): InjectionLog {
  return {
    date: format(new Date(log.date), 'yyyy-MM-dd'),
    peptideId: log.peptideId,
    peptideName: log.peptideName,
    doseMg: log.doseMg,
    units: log.units,
  }
}

export function addInjectionLogToState(
  state: TrackerState,
  log: DoseLog
): TrackerState {
  const entry = doseLogToInjectionEntry(log)
  const exists = state.injectionLogs.some(
    (l) => l.date === entry.date && l.peptideId === entry.peptideId
  )
  const injectionLogs = exists
    ? state.injectionLogs.map((l) =>
        l.date === entry.date && l.peptideId === entry.peptideId ? entry : l
      )
    : [...state.injectionLogs, entry]
  return { ...state, injectionLogs }
}