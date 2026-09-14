import { useCallback, useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import OnboardingWizard from '@/components/OnboardingWizard'
import { useOnboardingSubmit } from '@/hooks/useOnboardingSubmit'
import { InstallAppButton } from '../components/layout/InstallAppButton'
import { MedicalDisclaimer } from '../components/layout/MedicalDisclaimer'
import { Sidebar } from '../components/layout/Sidebar'
import { useAuth } from '../contexts/AuthContext'
import { saveProfileToDb, saveReconstitutionPlan } from '../lib/profileService'
import type { PeptideSelection } from '../constants/peptideCatalog'
import type { Peptide, Profile, TrackerState, ViewId } from '../types'
import { useReminderRuntime } from '../hooks/useReminderRuntime'
import type { DoseLog } from '../components/DoseCalculator'
import { usePersistTrackerState } from '../hooks/usePersistTrackerState'
import { addInjectionLogToState } from '../utils/injectionLogs'
import { exportState } from '../utils/storage'
import { loadVials } from '../utils/inventoryStorage'
import { applyVialToggle } from '../utils/vialUsage'

const ROUTE_MAP: Record<string, ViewId> = {
  '/app': 'dashboard',
  '/app/assistant': 'assistant',
  '/app/faqs': 'faqs',
  '/app/profile': 'profile',
  '/app/settings': 'settings',
  '/app/company': 'company',
  '/admin': 'admin',
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
  settings: '/app/settings',
  company: '/app/company',
  admin: '/admin',
  peptides: '/app/peptides',
  plan: '/app/plan',
  workouts: '/app/workouts',
  progress: '/app/progress',
}

export type SaveProfileExtras = {
  familiarity?: string | null
  mainGoal?: string | null
  interestedPeptides?: string | null
  additionalInfo?: string | null
  gender?: string | null
  age?: number | null
  trainingActivities?: string | null
}

export interface AppContext {
  state: TrackerState
  saveProfile: (
    profile: Profile,
    peptides: Peptide[],
    extras?: SaveProfileExtras
  ) => Promise<void>
  logWeight: (date: string, weight: number) => Promise<void>
  toggleInjection: (date: string, peptideId: string) => Promise<void>
  addInjectionLog: (log: DoseLog) => Promise<void>
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
  const { persistState } = usePersistTrackerState()
  const location = useLocation()
  const navigate = useNavigate()
  const submitOnboarding = useOnboardingSubmit()
  const [showOnboarding, setShowOnboarding] = useState(
    () => !userProfile?.onboardingCompleted
  )

  useEffect(() => {
    setShowOnboarding(!userProfile?.onboardingCompleted)
  }, [userProfile?.onboardingCompleted])

  useReminderRuntime(!showOnboarding)

  const activeView = ROUTE_MAP[location.pathname] ?? 'dashboard'

  const navigateTo = (view: ViewId) => navigate(VIEW_ROUTES[view])

  const saveProfileHandler = useCallback(
    async (profile: Profile, peptides: Peptide[], extras?: SaveProfileExtras) => {
      if (user) {
        const { error } = await saveProfileToDb(
          user.id,
          profile,
          peptides,
          { ...trackerState, profile, peptides },
          extras,
          userProfile?.peptideSelections ?? []
        )
        if (error) throw new Error(error)
        await refreshProfile()
        return
      }
      setTrackerState({ ...trackerState, profile, peptides })
    },
    [user, userProfile?.peptideSelections, trackerState, refreshProfile, setTrackerState]
  )

  const updateReconstitutionHandler = useCallback(
    async (state: TrackerState, selections: PeptideSelection[]) => {
      setTrackerState(state)
      if (user) {
        const { error } = await saveReconstitutionPlan(user.id, selections, state)
        if (error) {
          await refreshProfile()
          throw new Error(error)
        }
        await refreshProfile()
        return
      }
    },
    [user, refreshProfile, setTrackerState]
  )

  const contextValue: AppContext = {
    state: trackerState,
    saveProfile: saveProfileHandler,
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
      const turningOn = !exists
      const { vials, vialId, doseMg } = applyVialToggle({
        vials: loadVials(),
        peptides: trackerState.peptides,
        startDate: trackerState.profile.startDate,
        date,
        peptideId,
        turningOn,
      })
      const injectionLogs = exists
        ? trackerState.injectionLogs.filter(
            (l) => !(l.date === date && l.peptideId === peptideId)
          )
        : [
            ...trackerState.injectionLogs,
            { date, peptideId, doseMg, vialId },
          ]
      await persistState({
        ...trackerState,
        injectionLogs,
        vialInventory: vials,
      })
      try {
        window.dispatchEvent(new CustomEvent('pt-data-updated', { detail: 'injection' }))
      } catch {
        /* ignore */
      }
    },
    addInjectionLog: async (log) => {
      await persistState(addInjectionLogToState(trackerState, log))
    },
    updateReconstitution: updateReconstitutionHandler,
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

  if (showOnboarding) {
    return (
      <OnboardingWizard
        onComplete={async (userData) => {
          const { error } = await submitOnboarding(userData)
          if (!error) {
            setShowOnboarding(false)
            navigate('/app', { replace: true })
          }
          return { error }
        }}
      />
    )
  }

  return (
    <div className="flex min-h-dvh min-w-0 bg-[#0a0a0a]">
      <Sidebar
        active={activeView}
        onNavigate={navigateTo}
        onExport={() => exportState(trackerState)}
        username={userProfile?.username}
        onSignOut={signOut}
      />

      <div className="pt-app-shell flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header
          className={`pt-top-header no-print sticky top-0 z-40 flex shrink-0 items-center justify-between border-b border-white/10 bg-[#0a0a0a] px-4 pb-3 lg:hidden ${
            activeView === 'assistant' ? 'hidden' : ''
          }`}
        >
          <Link
            to="/app"
            className="cursor-pointer rounded-lg"
            aria-label="Back to home"
          >
            <h1 className="text-lg font-bold text-white">
              Peptide<span className="text-emerald-400">Tracker</span>
            </h1>
            {userProfile?.username && (
              <p className="text-[10px] text-emerald-400">@{userProfile.username}</p>
            )}
          </Link>
          <div className="flex items-center gap-2">
            <InstallAppButton />
            <button
              type="button"
              onClick={signOut}
              className="rounded-lg border border-white/15 p-2 text-white"
              aria-label="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <main
          className={`min-h-0 min-w-0 flex-1 ${
            activeView === 'assistant'
              ? 'flex flex-col overflow-hidden'
              : 'overflow-x-hidden overflow-y-auto px-4 lg:px-8 lg:pb-8'
          }`}
        >
          {activeView === 'assistant' ? (
            <Outlet context={contextValue} />
          ) : (
            <div className="mx-auto min-w-0 max-w-5xl">
              <Outlet context={contextValue} />
              <MedicalDisclaimer />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}