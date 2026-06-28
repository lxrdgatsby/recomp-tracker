import { ProfileView } from '../components/profile/ProfileView'
import { PeptidesView } from '../components/peptides/PeptidesView'
import { PlanView } from '../components/plan/PlanView'
import { WorkoutsView } from '../components/workouts/WorkoutsView'
import { ProgressView } from '../components/progress/ProgressView'
import { useAppContext } from './AppLayout'

export function ProfileRoute() {
  const { state, saveProfile } = useAppContext()
  return <ProfileView state={state} onSaveProfile={saveProfile} />
}

export function PeptidesRoute() {
  const { state, toggleInjection } = useAppContext()
  return <PeptidesView state={state} onToggleInjection={toggleInjection} />
}

export function PlanRoute() {
  const { state } = useAppContext()
  return <PlanView state={state} />
}

export function WorkoutsRoute() {
  const { state, toggleWorkout } = useAppContext()
  return <WorkoutsView state={state} onToggleWorkout={toggleWorkout} />
}

export function ProgressRoute() {
  const { state } = useAppContext()
  return <ProgressView state={state} />
}