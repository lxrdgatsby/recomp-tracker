import { ExternalLink } from 'lucide-react'
import { Button } from '../ui/Button'

function getSqlEditorUrl(): string {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  if (!url) return 'https://supabase.com/dashboard'
  try {
    const host = new URL(url).hostname
    const ref = host.split('.')[0]
    return `https://supabase.com/dashboard/project/${ref}/sql/new`
  } catch {
    return 'https://supabase.com/dashboard'
  }
}

export function isDatabaseSetupError(message: string): boolean {
  return message.startsWith('Database not set up yet')
}

export function DatabaseSetupPanel() {
  const sqlEditorUrl = getSqlEditorUrl()

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
      <p className="font-semibold text-amber-200">One-time database setup (~2 min)</p>
      <p className="mt-1 text-amber-100/90">
        Your Supabase project is connected, but the <code className="text-amber-200">profiles</code>{' '}
        table has not been created yet.
      </p>
      <ol className="mt-3 list-decimal space-y-2 pl-4 text-amber-100/90">
        <li>
          Open{' '}
          <a
            href={sqlEditorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-teal-400 underline underline-offset-2 hover:text-teal-300"
          >
            Supabase SQL Editor
            <ExternalLink size={12} className="ml-1 inline" />
          </a>
        </li>
        <li>
          In <strong>Cursor</strong> (or Finder), open{' '}
          <code className="rounded bg-navy-900 px-1 py-0.5 text-amber-200">
            recomp-tracker/supabase/schema.sql
          </code>{' '}
          — not Terminal; just the file in your project folder
        </li>
        <li>Select all (Cmd+A), copy, paste into SQL Editor, and click <strong>Run</strong></li>
        <li>Come back here and tap <strong>Get Started</strong> again</li>
      </ol>
      <Button
        variant="secondary"
        className="mt-4 w-full sm:w-auto"
        onClick={() => window.open(sqlEditorUrl, '_blank', 'noopener,noreferrer')}
      >
        Open SQL Editor
      </Button>
    </div>
  )
}