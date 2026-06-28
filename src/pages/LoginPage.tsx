import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function LoginPage() {
  const { signInWithMagicLink, user, configured } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  if (!configured) return <Navigate to="/setup" replace />
  if (user) return <Navigate to="/app" replace />

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await signInWithMagicLink(email)
    if (error) {
      setMessage(error)
    } else {
      setMessage('Magic link sent! Check your email.')
    }
    setLoading(false)
  }

  const isError =
    message &&
    !message.toLowerCase().includes('magic link sent') &&
    !message.toLowerCase().includes('check your email')

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-6 text-white">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <div className="mb-2 text-3xl font-semibold tracking-tight">
            PeptideTracker
          </div>
          <p className="text-slate-400">Sign in to continue</p>
        </div>

        <form onSubmit={handleMagicLink} className="space-y-4">
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-white/20 bg-white/5 px-5 py-4 text-lg text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none"
            autoComplete="email"
            inputMode="email"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-emerald-500 py-4 font-medium text-black transition-colors hover:bg-emerald-600 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Magic Link'}
          </button>
        </form>

        {message && (
          <p
            className={`mt-4 text-center text-sm ${
              isError ? 'text-red-400' : 'text-emerald-400'
            }`}
          >
            {message}
          </p>
        )}

        <p className="mt-8 text-center text-sm text-slate-500">
          No account?{' '}
          <Link to="/signup" className="text-emerald-400 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}