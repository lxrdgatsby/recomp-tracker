import { useCallback, useEffect, useState } from 'react'
import type {
  InjectionLog,
  Peptide,
  Profile,
  TrackerState,
  WorkoutCompletion,
} from '../types'
import { exportState, loadState, saveState } from '../utils/storage'

export function useTrackerStore() {
  const [state, setState] = useState<TrackerState>(loadState)

  useEffect(() => {
    saveState(state)
  }, [state])

  const updateProfile = useCallback((profile: Partial<Profile>) => {
    setState((s) => ({ ...s, profile: { ...s.profile, ...profile } }))
  }, [])

  const setPeptides = useCallback((peptides: Peptide[]) => {
    setState((s) => ({ ...s, peptides }))
  }, [])

  const saveProfile = useCallback((profile: Profile, peptides: Peptide[]) => {
    setState((s) => ({ ...s, profile, peptides }))
  }, [])

  const logWeight = useCallback((date: string, weight: number) => {
    setState((s) => {
      const existing = s.weightHistory.filter((e) => e.date !== date)
      const weightHistory = [...existing, { date, weight }].sort((a, b) =>
        a.date.localeCompare(b.date)
      )
      return {
        ...s,
        weightHistory,
        profile: { ...s.profile, currentWeight: weight },
      }
    })
  }, [])

  const toggleInjection = useCallback((date: string, peptideId: string) => {
    setState((s) => {
      const exists = s.injectionLogs.some(
        (l) => l.date === date && l.peptideId === peptideId
      )
      const injectionLogs: InjectionLog[] = exists
        ? s.injectionLogs.filter(
            (l) => !(l.date === date && l.peptideId === peptideId)
          )
        : [...s.injectionLogs, { date, peptideId }]
      return { ...s, injectionLogs }
    })
  }, [])

  const toggleWorkout = useCallback(
    (date: string, week: number, dayIndex: number) => {
      setState((s) => {
        const exists = s.workoutCompletions.some(
          (c) => c.date === date && c.week === week && c.dayIndex === dayIndex
        )
        const workoutCompletions: WorkoutCompletion[] = exists
          ? s.workoutCompletions.filter(
              (c) =>
                !(c.date === date && c.week === week && c.dayIndex === dayIndex)
            )
          : [...s.workoutCompletions, { date, week, dayIndex }]
        return { ...s, workoutCompletions }
      })
    },
    []
  )

  const exportData = useCallback(() => exportState(state), [state])

  return {
    state,
    updateProfile,
    setPeptides,
    saveProfile,
    logWeight,
    toggleInjection,
    toggleWorkout,
    exportData,
  }
}