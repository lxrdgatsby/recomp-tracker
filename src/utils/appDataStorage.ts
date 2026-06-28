import { STORAGE_KEY } from '../constants/defaults'
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
  chat?: ReturnType<typeof loadLocalChat>
}

function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
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
  const keys = new Set<string>([
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
  ])

  if (userId) {
    keys.add(`peptide-tracker-chat:${userId}`)
    keys.add(`peptide-tracker-active-conversation:${userId}`)
  }

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (
      key?.startsWith('peptide-tracker-chat:') ||
      key?.startsWith('peptide-tracker-active-conversation:')
    ) {
      keys.add(key)
    }
  }

  return [...keys]
}

export function clearAllLocalData(userId?: string | null): void {
  for (const key of getAppLocalStorageKeys(userId)) {
    localStorage.removeItem(key)
  }
}