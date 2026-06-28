import { useCallback } from 'react'
import { Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { InstallAppButton } from '../components/layout/InstallAppButton'
import { MedicalDisclaimer } from '../components/layout/MedicalDisclaimer'
import { Sidebar } from '../components/layout/Sidebar'
import { useAuth } from '../contexts/AuthContext'
import { saveProfileToDb, saveReconstitutionPlan } from '../lib/profileService'
import type { PeptideSelection } from '../constants/peptideCatalog'
import type { Peptide, Profile, TrackerState, ViewId } from '../types'
import { exportState } from '../utils/storage'

const ROUTE_MAP: Record<string, ViewId> = {
  '/app': 'dashboard',
  '/app/assistant': 'assistant',
  '/app/faqs': 'faqs',
  '/app/profile': 'profile',
  '/app/peptides': 'peptides',
  '/app/plan': 'plan',
  '/app/workouts': 'workouts',
  '/app/progress': 'progress',
}

const VIEW_ROUTES: Record<ViewId, string> = {
  dashboard: '/app',
  assistant: '/app/assistant',
  faqs: '/app/faqs',
  profile: '/app/profile',
  peptides: '/app/peptides',
  plan: '/app/plan',
  workouts: '/app/workouts',
  progress: '/app/progress',
}

export interface AppContext {
  state: TrackerState
  saveProfile: (
    profile: Profile,
    peptides: Peptide[],
    extras?: {
      familiarity?: string | null
      mainGoal?: string | null
      interestedPeptides?: string | null
      additionalInfo?: string | null
      gender?: string | null
      age?: number | null
      trainingActivities?: string | null
    }
  ) => Promise<void>
  logWeight: (date: string, weight: number) => Promise<void>
  toggleInjection: (date: string, peptideId: string) => Promise<void>
  toggleWorkout: (date: string, week: number, dayIndex: number) => Promise<void>
  updateReconstitution: (
    state: TrackerState,
    selections: PeptideSelection[]
  ) => Promise<void>
}

export function useAppContext() {
  return useOutletContext<AppContext>()
}

export function AppLayout() {
  const { user, userProfile, trackerState, setTrackerState, signOut, refreshProfile } =
    useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const activeView = ROUTE_MAP[location.pathname] ?? 'dashboard'

  const navigateTo = (view: ViewId) => navigate(VIEW_ROUTES[view])

  const persistState = useCallback(
    async (state: TrackerState) => {
      setTrackerState(state)
      if (user) {
        await saveProfileToDb(user.id, state.profile, state.peptides, state)
      }
    },
    [user, setTrackerState]
  )

  const contextValue: AppContext = {
    state: trackerState,
    saveProfile: async (profile, peptides, extras) => {
      const newState = { ...trackerState, profile, peptides }
      setTrackerState(newState)
      if (user) {
        await saveProfileToDb(user.id, profile, peptides, newState, extras)
      }
    },
    logWeight: async (date, weight) => {
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
    toggleInjection: async (date, peptideId) => {
      const exists = trackerState.injectionLogs.some(
        (l) => l.date === date && l.peptideId === peptideId
      )
      const injectionLogs = exists
        ? trackerState.injectionLogs.filter(
            (l) => !(l.date === date && l.peptideId === peptideId)
          )
        : [...trackerState.injectionLogs, { date, peptideId }]
      await persistState({ ...trackerState, injectionLogs })
    },
    updateReconstitution: async (state, selections) => {
      setTrackerState(state)
      if (user) {
        await saveReconstitutionPlan(user.id, selections, state)
        await refreshProfile()
      }
    },
    toggleWorkout: async (date, week, dayIndex) => {
      const exists = trackerState.workoutCompletions.some(
        (c) => c.date === date && c.week === week && c.dayIndex === dayIndex
      )
      const workoutCompletions = exists
        ? trackerState.workoutCompletions.filter(
            (c) =>
              !(c.date === date && c.week === week && c.dayIndex === dayIndex)
          )
        : [...trackerState.workoutCompletions, { date, week, dayIndex }]
      await persistState({ ...trackerState, workoutCompletions })
    },
  }

  return (
    <div className="flex min-h-screen bg-navy-950">
      <Sidebar
        active={activeView}
        onNavigate={navigateTo}
        onExport={() => exportState(trackerState)}
        username={userProfile?.username}
        onSignOut={signOut}
      />

      <div className="flex h-svh min-h-0 flex-1 flex-col lg:min-h-screen lg:h-auto">
        <header className="no-print flex items-center justify-between border-b border-slate-800/80 bg-navy-900/50 px-4 py-3 lg:hidden">
          <div>
            <h1 className="text-lg font-bold text-white">
              Peptide<span className="text-teal-400">Tracker</span>
            </h1>
            {userProfile?.username && (
              <p className="text-[10px] text-slate-500">@{userProfile.username}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <InstallAppButton />
            <button
              type="button"
              onClick={signOut}
              className="rounded-lg border border-slate-700 p-2 text-slate-400"
              aria-label="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <main
          className={`flex-1 ${
            activeView === 'assistant'
              ? 'flex min-h-0 flex-1 flex-col overflow-hidden'
              : 'overflow-y-auto px-4 pt-6 pb-[var(--mobile-nav-height)] lg:px-8 lg:pb-8'
          }`}
        >
          {activeView === 'assistant' ? (
            <Outlet context={contextValue} />
          ) : (
            <div className="mx-auto max-w-5xl">
              <Outlet context={contextValue} />
              <MedicalDisclaimer />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}