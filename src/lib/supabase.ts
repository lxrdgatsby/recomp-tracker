import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Vite env mapping (Next.js equivalents):
 *   VITE_SUPABASE_URL      ← NEXT_PUBLIC_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY ← NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

function normalizeSupabaseUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  return raw
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/rest\/v1\/?$/, '')
    .replace(/\/auth\/v1\/?$/, '')
}

const url = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL)
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!)
  : null