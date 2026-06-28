import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/** Legacy route — onboarding runs inside AppLayout at /app */
export function OnboardingPage() {
  const { userProfile } = useAuth()
  if (userProfile?.onboardingCompleted) {
    return <Navigate to="/app" replace />
  }
  return <Navigate to="/app" replace />
}