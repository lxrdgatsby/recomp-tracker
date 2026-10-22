import { STORAGE_KEY } from '../constants/defaults'
import { readLocal, scopedStorageKey } from '../lib/protocolStorageScope'
import type { TrackerState } from '../types'
import { getCheckInHistory, getLastCheckIn } from './checkInStorage'
import { getWorkoutLogs } from './workoutLogStorage'
import { getWorkoutSetLogs } from './workoutSetStorage'
import { loadLocalChat } from '../lib/localChatStore'
import { get90DayPlan, getOnboardingData } from './onboardingStorage'

export interface AppDataExport {
  exportedAt: string
  trackerState: TrackerState
  onboarding: ReturnType<typeof getOnboardingData>
  ninetyDayPlan: ReturnType<typeof get90DayPlan>
  checkInHistory: ReturnType<typeof getCheckInHistory>
  lastCheckIn: ReturnType<typeof getLastCheckIn>
  doseCalculator: unknown
  injectionSites: unknown
  workoutLogs: ReturnType<typeof getWorkoutLogs>
  workoutSetLogs: ReturnType<typeof getWorkoutSetLogs>
  reminderSettings: unknown
  reminderLastFired: unknown
  vials: unknown
  chat?: ReturnType<typeof loadLocalChat>
}

function readJson(key: string): unknown {
  try {
    const raw = readLocal(key)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportAllLocalData(
  trackerState: TrackerState,
  userId?: string | null
): void {
  const payload: AppDataExport = {
    exportedAt: new Date().toISOString(),
    trackerState,
    onboarding: getOnboardingData(),
    ninetyDayPlan: get90DayPlan(),
    checkInHistory: getCheckInHistory(),
    lastCheckIn: getLastCheckIn(),
    doseCalculator: readJson('doseCalculator'),
    injectionSites: readJson('injectionSites'),
    workoutLogs: getWorkoutLogs(),
    workoutSetLogs: getWorkoutSetLogs(),
    reminderSettings: readJson('reminderSettings'),
    reminderLastFired: readJson('reminderLastFired'),
    vials: readJson('vials'),
  }

  if (userId) {
    payload.chat = loadLocalChat(userId)
  }

  downloadJson(
    payload,
    `peptide-tracker-full-export-${new Date().toISOString().slice(0, 10)}.json`
  )
}

export function getAppLocalStorageKeys(userId?: string | null): string[] {
  const keys = new Set<string>(
    [
      STORAGE_KEY,
      'onboardingData',
      'ninetyDayPlan',
      'lastCheckIn',
      'checkInHistory',
      'checkIns',
      'doseCalculator',
      'injectionSites',
      'workoutLogs',
      'workoutSetLogs',
      'reminderSettings',
      'reminderLastFired',
      'vials',
      'pt-v2-vials',
      'pt-v2-dose-logs',
      'migration_vial_sizes_v2',
    ].map((key) => scopedStorageKey(key))
  )

  if (userId) {
    keys.add(`peptide-tracker-chat:${userId}`)
    keys.add(`peptide-tracker-active-conversation:${userId}`)
  }

  return [...keys]
}

export function clearAllLocalData(userId?: string | null): void {
  for (const key of getAppLocalStorageKeys(userId)) {
    localStorage.removeItem(key)
  }
}