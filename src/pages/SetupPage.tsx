import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export function SetupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-navy-950 px-6 text-center">
      <h1 className="text-2xl font-bold text-white">
        Peptide<span className="text-teal-400">Tracker</span>
      </h1>
      <p className="mt-4 max-w-md text-slate-400">
        Supabase environment variables are missing. Copy{' '}
        <code className="text-teal-400">.env.example</code> to{' '}
        <code className="text-teal-400">.env.local</code> and add your project
        keys, then restart the dev server.
      </p>
      <p className="mt-2 text-xs text-slate-600">
        See SUPABASE_SETUP.md for full instructions.
      </p>
      <Link to="/login" className="mt-8">
        <Button>Continue (after setup)</Button>
      </Link>
    </div>
  )
}