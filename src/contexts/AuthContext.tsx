import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { useSupabaseAuth } from '../hooks/useSupabaseAuth'
import { fetchProfile, profileToTrackerState } from '../lib/profileService'
import { getAuthCallbackUrl } from '../lib/authRedirect'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { TrackerState } from '../types'
import type { UserProfile } from '../types/auth'
import { DEFAULT_STATE } from '../constants/defaults'

interface AuthContextValue {
  user: User | null
  session: Session | null
  userProfile: UserProfile | null
  trackerState: TrackerState
  loading: boolean
  configured: boolean
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error: string | null; needsConfirmation: boolean }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signInWithMagicLink: (email: string) => Promise<{ error: string | null }>
  resendConfirmation: (email: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  setTrackerState: (state: TrackerState) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, session, ready: sessionReady } = useSupabaseAuth()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [trackerState, setTrackerState] = useState<TrackerState>(DEFAULT_STATE)
  const [profileLoading, setProfileLoading] = useState(false)

  const loadUserData = useCallback(async (userId: string) => {
    const profile = await fetchProfile(userId)
    setUserProfile(profile)
    if (profile) {
      setTrackerState(profileToTrackerState(profile))
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) await loadUserData(user.id)
  }, [user, loadUserData])

  useEffect(() => {
    if (!sessionReady) return

    if (!user) {
      setUserProfile(null)
      setTrackerState(DEFAULT_STATE)
      setProfileLoading(false)
      return
    }

    let cancelled = false
    setProfileLoading(true)
    void loadUserData(user.id).finally(() => {
      if (!cancelled) setProfileLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [user?.id, sessionReady, loadUserData])

  const loading = !sessionReady || profileLoading

  const getEmailRedirectTo = () => getAuthCallbackUrl()

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase)
      return { error: 'Supabase not configured', needsConfirmation: false }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: getEmailRedirectTo() },
    })
    if (error) return { error: error.message, needsConfirmation: false }

    const needsConfirmation = !data.session && !!data.user

    // Only sign out when email confirmation is required (no session yet)
    if (needsConfirmation) {
      await supabase.auth.signOut()
    }

    return { error: null, needsConfirmation }
  }, [])

  const signInWithMagicLink = useCallback(async (email: string) => {
    if (!supabase) return { error: 'Supabase not configured' }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: getAuthCallbackUrl(),
      },
    })
    return { error: error?.message ?? null }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: 'Supabase not configured' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) return { error: null }

    const msg = error.message.toLowerCase()
    if (msg.includes('confirm') || msg.includes('verified')) {
      return {
        error:
          'Please confirm your email first. Check your inbox for a message from PeptideTracker, then try again.',
      }
    }
    return { error: error.message }
  }, [])

  const resendConfirmation = useCallback(async (email: string) => {
    if (!supabase) return { error: 'Supabase not configured' }
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: getEmailRedirectTo() },
    })
    return { error: error?.message ?? null }
  }, [])

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut()
    window.location.href = '/login'
  }, [])

  const value = useMemo(
    () => ({
      user,
      session,
      userProfile,
      trackerState,
      loading,
      configured: isSupabaseConfigured,
      signUp,
      signIn,
      signInWithMagicLink,
      resendConfirmation,
      signOut,
      refreshProfile,
      setTrackerState,
    }),
    [
      user,
      session,
      userProfile,
      trackerState,
      loading,
      signUp,
      signIn,
      signInWithMagicLink,
      resendConfirmation,
      signOut,
      refreshProfile,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}