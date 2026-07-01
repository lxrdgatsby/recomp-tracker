import { AIChatDashboard } from '../components/dashboard/AIChatDashboard'
import { DashboardView } from '../components/dashboard/DashboardView'
import { FAQsView } from '../components/faqs/FAQsView'
import { ProfileView } from '../components/profile/ProfileView'
import { CompanyDashboard } from '../components/company/CompanyDashboard'
import { SettingsPage } from '../components/settings/SettingsPage'
import PeptidesPage from '../components/PeptidesPage'
import { PlanView } from '../components/plan/PlanView'
import { WorkoutsView } from '../components/workouts/WorkoutsView'
import { ProgressView } from '../components/progress/ProgressView'
import { useAuth } from '../contexts/AuthContext'
import { useAppContext } from './AppLayout'

export function DashboardRoute() {
  const { state, toggleInjection } = useAppContext()
  const { userProfile } = useAuth()
  return (
    <DashboardView
      state={state}
      username={userProfile?.username}
      onToggleInjection={toggleInjection}
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
  return <WorkoutsView state={state} onToggleWorkout={toggleWorkout} />
}

export function ProgressRoute() {
  const { state, logWeight } = useAppContext()
  return <ProgressView state={state} onLogWeight={logWeight} />
}