import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { supabaseConfigError, testSupabaseConnection } from '../lib/supabase'

export function SetupPage() {
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    testSupabaseConnection().then((r) => setStatus(r.message))
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-navy-950 px-6 text-center">
      <h1 className="text-2xl font-bold text-white">
        Peptide<span className="text-teal-400">Tracker</span>
      </h1>
      <p className="mt-4 max-w-md text-slate-400">
        {supabaseConfigError ??
          status ??
          'Supabase is not configured correctly.'}
      </p>
      <div className="mt-6 max-w-md rounded-xl border border-slate-800 bg-navy-900 p-4 text-left text-sm text-slate-400">
        <p className="font-medium text-slate-300">Fix this:</p>
        <ol className="mt-2 list-decimal space-y-2 pl-5">
          <li>
            Supabase → <strong>Project Settings → API</strong>
          </li>
          <li>
            Copy <strong>Project URL</strong> and <strong>anon public</strong>{' '}
            key
          </li>
          <li>
            Paste into <code className="text-teal-400">.env.local</code>{' '}
            (local) or <strong>Vercel env vars</strong> (production)
          </li>
          <li>Restart dev server or redeploy Vercel</li>
        </ol>
      </div>
      <p className="mt-4 text-xs text-slate-600">
        See SUPABASE_SETUP.md for full instructions.
      </p>
      <Link to="/signup" className="mt-8">
        <Button>Try again after setup</Button>
      </Link>
    </div>
  )
}