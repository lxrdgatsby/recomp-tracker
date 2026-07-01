import { useCallback, useMemo } from 'react'
import type { DoseLog, SavedProtocolData } from '../components/DoseCalculator'
import { useAuth } from '../contexts/AuthContext'
import { applyProtocolSave } from '../utils/protocolSave'
import type {
  InjectionLog,
  Peptide,
  Profile,
  TrackerState,
  WorkoutCompletion,
} from '../types'
import { addInjectionLogToState } from '../utils/injectionLogs'
import { exportState } from '../utils/storage'
import { usePersistTrackerState } from './usePersistTrackerState'

export interface TrackerStoreApi {
  state: TrackerState
  updateProfile: (profile: Partial<Profile>) => Promise<void>
  setPeptides: (peptides: Peptide[]) => Promise<void>
  saveProfile: (profile: Profile, peptides: Peptide[]) => Promise<void>
  logWeight: (date: string, weight: number) => Promise<void>
  addInjectionLog: (log: DoseLog) => Promise<void>
  saveActiveProtocol: (protocol: SavedProtocolData) => Promise<void>
  toggleInjection: (date: string, peptideId: string) => Promise<void>
  toggleWorkout: (date: string, week: number, dayIndex: number) => Promise<void>
  exportData: () => void
}

function useTrackerStoreApi(): TrackerStoreApi {
  const { userProfile } = useAuth()
  const { trackerState, persistState } = usePersistTrackerState()
  const familiarity = userProfile?.familiarity ?? 'beginner'

  const updateProfile = useCallback(
    async (profile: Partial<Profile>) => {
      await persistState({
        ...trackerState,
        profile: { ...trackerState.profile, ...profile },
      })
    },
    [trackerState, persistState]
  )

  const setPeptides = useCallback(
    async (peptides: Peptide[]) => {
      await persistState({ ...trackerState, peptides })
    },
    [trackerState, persistState]
  )

  const saveProfile = useCallback(
    async (profile: Profile, peptides: Peptide[]) => {
      await persistState({ ...trackerState, profile, peptides })
    },
    [trackerState, persistState]
  )

  const logWeight = useCallback(
    async (date: string, weight: number) => {
      const existing = trackerState.weightHistory.filter((e) => e.date !== date)
      const weightHistory = [...existing, { date, weight }].sort((a, b) =>
        a.date.localeCompare(b.date)
      )
      await persistState({
        ...trackerState,
        weightHistory,
        profile: { ...trackerState.profile, currentWeight: weight },
      })
    },
    [trackerState, persistState]
  )

  const addInjectionLog = useCallback(
    async (log: DoseLog) => {
      await persistState(addInjectionLogToState(trackerState, log))
    },
    [trackerState, persistState]
  )

  const saveActiveProtocol = useCallback(
    async (protocol: SavedProtocolData) => {
      await persistState(applyProtocolSave(trackerState, protocol, familiarity))
    },
    [trackerState, persistState, familiarity]
  )

  const toggleInjection = useCallback(
    async (date: string, peptideId: string) => {
      const exists = trackerState.injectionLogs.some(
        (l) => l.date === date && l.peptideId === peptideId
      )
      const injectionLogs: InjectionLog[] = exists
        ? trackerState.injectionLogs.filter(
            (l) => !(l.date === date && l.peptideId === peptideId)
          )
        : [...trackerState.injectionLogs, { date, peptideId }]
      await persistState({ ...trackerState, injectionLogs })
    },
    [trackerState, persistState]
  )

  const toggleWorkout = useCallback(
    async (date: string, week: number, dayIndex: number) => {
      const exists = trackerState.workoutCompletions.some(
        (c) => c.date === date && c.week === week && c.dayIndex === dayIndex
      )
      const workoutCompletions: WorkoutCompletion[] = exists
        ? trackerState.workoutCompletions.filter(
            (c) =>
              !(c.date === date && c.week === week && c.dayIndex === dayIndex)
          )
        : [...trackerState.workoutCompletions, { date, week, dayIndex }]
      await persistState({ ...trackerState, workoutCompletions })
    },
    [trackerState, persistState]
  )

  const exportData = useCallback(() => exportState(trackerState), [trackerState])

  return useMemo(
    () => ({
      state: trackerState,
      updateProfile,
      setPeptides,
      saveProfile,
      logWeight,
      addInjectionLog,
      saveActiveProtocol,
      toggleInjection,
      toggleWorkout,
      exportData,
    }),
    [
      trackerState,
      updateProfile,
      setPeptides,
      saveProfile,
      logWeight,
      addInjectionLog,
      saveActiveProtocol,
      toggleInjection,
      toggleWorkout,
      exportData,
    ]
  )
}

export function useTrackerStore(): TrackerStoreApi
export function useTrackerStore<T>(selector: (store: TrackerStoreApi) => T): T
export function useTrackerStore<T>(
  selector?: (store: TrackerStoreApi) => T
): TrackerStoreApi | T {
  const api = useTrackerStoreApi()
  return selector ? selector(api) : api
}