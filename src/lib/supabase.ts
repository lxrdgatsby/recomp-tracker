import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

const PLACEHOLDER_PATTERNS = [
  'your-project',
  'your-anon-key',
  'xxxx.supabase.co',
  'example.com',
]

function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true
  const lower = value.toLowerCase()
  return PLACEHOLDER_PATTERNS.some((p) => lower.includes(p))
}

export const isSupabaseConfigured = Boolean(
  url && anonKey && !isPlaceholder(url) && !isPlaceholder(anonKey)
)

export const supabaseConfigError: string | null = !url || !anonKey
  ? 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY'
  : isPlaceholder(url) || isPlaceholder(anonKey)
    ? 'Supabase keys are still placeholders — replace with real values from your Supabase dashboard'
    : null

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

export async function testSupabaseConnection(): Promise<{
  ok: boolean
  message: string
}> {
  if (!supabase || !url) {
    return { ok: false, message: supabaseConfigError ?? 'Supabase not configured' }
  }
  try {
    const res = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: anonKey! },
    })
    if (!res.ok) {
      return {
        ok: false,
        message: `Cannot reach Supabase (HTTP ${res.status}). Check your Project URL.`,
      }
    }
    return { ok: true, message: 'Connected to Supabase' }
  } catch {
    return {
      ok: false,
      message:
        'Failed to reach Supabase. Check your URL, network, and that the project is not paused.',
    }
  }
}