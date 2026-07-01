import { useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { saveProfileToDb } from '../lib/profileService'
import type { TrackerState } from '../types'
import { saveState } from '../utils/storage'

export function usePersistTrackerState() {
  const { user, userProfile, trackerState, setTrackerState, refreshProfile } =
    useAuth()

  const persistState = useCallback(
    async (next: TrackerState) => {
      if (user) {
        const { error } = await saveProfileToDb(
          user.id,
          next.profile,
          next.peptides,
          next,
          undefined,
          userProfile?.peptideSelections ?? []
        )
        if (error) throw new Error(error)
        await refreshProfile()
        return
      }
      setTrackerState(next)
      saveState(next)
    },
    [user, userProfile?.peptideSelections, refreshProfile, setTrackerState]
  )

  return { trackerState, setTrackerState, persistState }
}