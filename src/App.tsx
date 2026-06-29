import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AppLayout } from './pages/AppLayout'
import {
  AssistantRoute,
  DashboardRoute,
  FAQsRoute,
  PeptidesRoute,
  PlanRoute,
  ProfileRoute,
  ProgressRoute,
  SettingsRoute,
  CompanyRoute,
  WorkoutsRoute,
} from './pages/AppRoutes'
import { LoginPage } from './pages/LoginPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { SetupPage } from './pages/SetupPage'
import { AuthCallbackPage } from './pages/AuthCallbackPage'
import { ConfirmEmailPage } from './pages/ConfirmEmailPage'
import { SignupPage } from './pages/SignupPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/confirm-email" element={<ConfirmEmailPage />} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app"
            element={
              <ProtectedRoute requireOnboarding>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardRoute />} />
            <Route path="assistant" element={<AssistantRoute />} />
            <Route path="faqs" element={<FAQsRoute />} />
            <Route path="profile" element={<ProfileRoute />} />
            <Route path="settings" element={<SettingsRoute />} />
            <Route path="company" element={<CompanyRoute />} />
            <Route path="peptides" element={<PeptidesRoute />} />
            <Route path="plan" element={<PlanRoute />} />
            <Route path="workouts" element={<WorkoutsRoute />} />
            <Route path="progress" element={<ProgressRoute />} />
          </Route>
          <Route path="/" element={<Navigate to="/app" replace />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}