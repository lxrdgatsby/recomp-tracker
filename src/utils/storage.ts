import { DEFAULT_STATE, STORAGE_KEY } from '../constants/defaults'
import { readLocal, writeLocal } from '../lib/protocolStorageScope'
import { runVialSizeMigrationV2 } from '../lib/vialInventory'
import type { TrackerState } from '../types'

function emptyPlan(): TrackerState {
  return {
    ...DEFAULT_STATE,
    peptides: [],
    weightHistory: [],
    injectionLogs: [],
    workoutCompletions: [],
    vialInventory: [],
  }
}

export function loadState(): TrackerState {
  try {
    const raw = readLocal(STORAGE_KEY)
    if (!raw) return emptyPlan()
    const parsed = JSON.parse(raw) as TrackerState
    const loaded = {
      ...DEFAULT_STATE,
      ...parsed,
      profile: { ...DEFAULT_STATE.profile, ...parsed.profile },
      peptides: Array.isArray(parsed.peptides) ? parsed.peptides : [],
      weightHistory: parsed.weightHistory ?? [],
      injectionLogs: parsed.injectionLogs ?? [],
      workoutCompletions: parsed.workoutCompletions ?? [],
      vialInventory: parsed.vialInventory ?? [],
    }
    return runVialSizeMigrationV2(loaded) ?? loaded
  } catch {
    return emptyPlan()
  }
}

export function saveState(state: TrackerState): void {
  writeLocal(STORAGE_KEY, JSON.stringify(state))
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