import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireOnboarding?: boolean
}

export function ProtectedRoute({
  children,
  requireOnboarding = false,
}: ProtectedRouteProps) {
  const { user, userProfile, loading, configured } = useAuth()

  if (!configured) {
    return <Navigate to="/setup" replace />
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (requireOnboarding && (!userProfile || !userProfile.onboardingCompleted)) {
    return <Navigate to="/onboarding" replace />
  }

  if (!requireOnboarding && userProfile?.onboardingCompleted) {
    return <Navigate to="/app" replace />
  }

  return <>{children}</>
}