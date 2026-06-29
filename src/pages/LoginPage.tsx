import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { MedicalDisclaimer } from '../components/layout/MedicalDisclaimer'

export function LoginPage() {
  const { signIn, resendConfirmation, user, configured } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showResend, setShowResend] = useState(false)
  const [resent, setResent] = useState(false)

  const justConfirmed = searchParams.get('confirmed') === '1'

  useEffect(() => {
    const authError = searchParams.get('error')
    if (authError) {
      setError(decodeURIComponent(authError))
    }
  }, [searchParams])

  if (!configured) return <Navigate to="/setup" replace />
  if (user) return <Navigate to="/app" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setShowResend(false)
    setLoading(true)
    const { error: err } = await signIn(email, password)
    setLoading(false)
    if (err) {
      setError(err)
      if (err.toLowerCase().includes('confirm')) setShowResend(true)
      return
    }
    navigate('/app')
  }

  const handleResend = async () => {
    if (!email) return
    setResent(false)
    const { error: err } = await resendConfirmation(email)
    if (err) {
      setError(err)
      return
    }
    setResent(true)
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

          {justConfirmed && (
            <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
              Email confirmed! You can sign in now.
            </div>
          )}

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
            {error && <p className="text-sm text-red-400">{error}</p>}
            {showResend && (
              <div className="rounded-xl border border-slate-800 bg-navy-900 p-4 text-sm">
                <p className="text-slate-400">
                  Haven&apos;t received it? Check spam or resend the confirmation
                  email.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={handleResend}
                >
                  Resend confirmation email
                </Button>
                {resent && (
                  <p className="mt-2 text-xs text-emerald-400">Email sent!</p>
                )}
              </div>
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