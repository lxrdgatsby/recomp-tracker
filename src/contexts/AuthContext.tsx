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
import { fetchProfile, profileToTrackerState } from '../lib/profileService'
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
  signUp: (email: string, password: string) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  setTrackerState: (state: TrackerState) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [trackerState, setTrackerState] = useState<TrackerState>(DEFAULT_STATE)
  const [loading, setLoading] = useState(true)

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
    if (!supabase) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      if (data.session?.user) {
        loadUserData(data.session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession)
        setUser(newSession?.user ?? null)
        if (newSession?.user) {
          await loadUserData(newSession.user.id)
        } else {
          setUserProfile(null)
          setTrackerState(DEFAULT_STATE)
        }
        setLoading(false)
      }
    )

    return () => listener.subscription.unsubscribe()
  }, [loadUserData])

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: 'Supabase not configured' }
    const { error } = await supabase.auth.signUp({ email, password })
    return { error: error?.message ?? null }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: 'Supabase not configured' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }, [])

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut()
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