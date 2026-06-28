import { Mail, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { MedicalDisclaimer } from '../components/layout/MedicalDisclaimer'

export function ConfirmEmailPage() {
  const { resendConfirmation, configured } = useAuth()
  const [params] = useSearchParams()
  const email = params.get('email') ?? ''
  const [resent, setResent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!configured) return <Navigate to="/setup" replace />
  if (!email) return <Navigate to="/signup" replace />

  const handleResend = async () => {
    setError('')
    setLoading(true)
    const { error: err } = await resendConfirmation(email)
    setLoading(false)
    if (err) {
      setError(err)
      return
    }
    setResent(true)
    setTimeout(() => setResent(false), 5000)
  }

  return (
    <div className="flex min-h-screen flex-col bg-navy-950">
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/10">
            <Mail className="text-teal-400" size={32} />
          </div>

          <h1 className="text-2xl font-bold text-white">Check your email</h1>
          <p className="mt-3 text-slate-400">
            We sent a confirmation link to
          </p>
          <p className="mt-1 font-medium text-teal-400">{email}</p>

          <div className="mt-8 rounded-xl border border-slate-800 bg-navy-900 p-5 text-left text-sm text-slate-400">
            <p className="font-medium text-slate-200">Next steps:</p>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>Open the email from <strong className="text-white">PeptideTracker</strong></li>
              <li>Tap <strong className="text-white">Confirm your email</strong></li>
              <li>Come back here and sign in</li>
            </ol>
            <p className="mt-4 text-xs text-slate-500">
              Check spam/junk if you don&apos;t see it within a few minutes.
            </p>
          </div>

          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
          {resent && (
            <p className="mt-4 text-sm text-emerald-400">
              Confirmation email sent again!
            </p>
          )}

          <div className="mt-8 flex flex-col gap-3">
            <Link to="/login">
              <Button className="w-full">I&apos;ve confirmed — Sign In</Button>
            </Link>
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleResend}
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Sending…' : 'Resend confirmation email'}
            </Button>
          </div>
        </div>
      </div>
      <MedicalDisclaimer />
    </div>
  )
}