import { AIChatDashboard } from '../components/dashboard/AIChatDashboard'
import { DashboardView } from '../components/dashboard/DashboardView'
import { FAQsView } from '../components/faqs/FAQsView'
import { ProfileView } from '../components/profile/ProfileView'
import { CompanyDashboard } from '../components/company/CompanyDashboard'
import { SettingsPage } from '../components/settings/SettingsPage'
import PeptidesPage from '../components/PeptidesPage'
import { PlanView } from '../components/plan/PlanView'
import { DietView } from '../components/diet/DietView'
import { WorkoutsView } from '../components/workouts/WorkoutsView'
import { isLxrdgatsbyUser } from '../lib/protocolSeed'
import { Navigate } from 'react-router-dom'
import { ProgressView } from '../components/progress/ProgressView'
import { useAuth } from '../contexts/AuthContext'
import { usePersistTrackerState } from '../hooks/usePersistTrackerState'
import { useAppContext } from './AppLayout'

export function DashboardRoute() {
  const { state, markDoseDone } = useAppContext()
  const { userProfile } = useAuth()
  return (
    <DashboardView
      state={state}
      username={userProfile?.username}
      onMarkDoseDone={markDoseDone}
    />
  )
}

export function AssistantRoute() {
  return <AIChatDashboard />
}

export function FAQsRoute() {
  return <FAQsView />
}

export function ProfileRoute() {
  const { state, saveProfile } = useAppContext()
  return <ProfileView state={state} onSaveProfile={saveProfile} />
}

export function SettingsRoute() {
  return <SettingsPage />
}

export function CompanyRoute() {
  return <CompanyDashboard />
}

export function PeptidesRoute() {
  return <PeptidesPage />
}

export function PlanRoute() {
  const { state, toggleInjection } = useAppContext()
  return <PlanView state={state} onToggleInjection={toggleInjection} />
}

export function WorkoutsRoute() {
  const { state, toggleWorkout } = useAppContext()
  const { userProfile } = useAuth()
  const lautner = isLxrdgatsbyUser(userProfile?.username, userProfile?.email)
  return <WorkoutsView state={state} onToggleWorkout={toggleWorkout} lautner={lautner} />
}

export function DietRoute() {
  const { state } = useAppContext()
  const { userProfile } = useAuth()
  if (!isLxrdgatsbyUser(userProfile?.username, userProfile?.email)) {
    return <Navigate to="/app" replace />
  }
  return <DietView startDate={state.profile.startDate} />
}

export function ProgressRoute() {
  const { state, logWeight, toggleInjection } = useAppContext()
  const { persistState } = usePersistTrackerState()
  return (
    <ProgressView
      state={state}
      onLogWeight={logWeight}
      onToggleInjection={toggleInjection}
      onCheckInScheduleChange={(schedule) => {
        void persistState({
          ...state,
          profile: {
            ...state.profile,
            checkInCadence: schedule.cadence,
            weeklyWeighInDay: schedule.weeklyWeighInDay,
            weighInReminderEnabled: schedule.reminderEnabled,
          },
        })
      }}
    />
  )
}