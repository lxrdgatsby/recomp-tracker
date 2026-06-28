import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { MedicalDisclaimer } from '../components/layout/MedicalDisclaimer'

export function LoginPage() {
  const { signIn, user, userProfile, configured } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!configured) return <Navigate to="/setup" replace />
  if (user && userProfile?.onboardingCompleted) return <Navigate to="/app" replace />
  if (user && userProfile && !userProfile.onboardingCompleted)
    return <Navigate to="/onboarding" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await signIn(email, password)
    setLoading(false)
    if (err) {
      setError(err)
      return
    }
    navigate('/app')
  }

  return (
    <div className="flex min-h-screen flex-col bg-navy-950">
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <h1 className="text-center text-2xl font-bold text-white">
            Peptide<span className="text-teal-400">Tracker</span>
          </h1>
          <p className="mt-2 text-center text-sm text-slate-400">
            Sign in to your account
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Input
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            No account?{' '}
            <Link to="/signup" className="text-teal-400 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
      <MedicalDisclaimer />
    </div>
  )
}