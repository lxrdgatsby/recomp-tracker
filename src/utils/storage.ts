import { DEFAULT_STATE, STORAGE_KEY } from '../constants/defaults'
import type { TrackerState } from '../types'

export function loadState(): TrackerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_STATE, peptides: [...DEFAULT_STATE.peptides] }
    const parsed = JSON.parse(raw) as TrackerState
    return {
      ...DEFAULT_STATE,
      ...parsed,
      profile: { ...DEFAULT_STATE.profile, ...parsed.profile },
      peptides: parsed.peptides?.length ? parsed.peptides : DEFAULT_STATE.peptides,
      weightHistory: parsed.weightHistory ?? [],
      injectionLogs: parsed.injectionLogs ?? [],
      workoutCompletions: parsed.workoutCompletions ?? [],
    }
  } catch {
    return { ...DEFAULT_STATE, peptides: [...DEFAULT_STATE.peptides] }
  }
}

export function saveState(state: TrackerState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function exportState(state: TrackerState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `peptide-tracker-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}