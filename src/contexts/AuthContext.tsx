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
import {
  blankTrackerState,
  fetchProfile,
  persistSeededProtocol,
  profileToTrackerState,
  touchLastActive,
  trackerForSignedInUser,
} from '../lib/profileService'
import {
  applyLxrdgatsbyProtocolSeed,
  isLxrdgatsbyUser,
  refreshProtocolDefinition,
} from '../lib/protocolSeed'
import {
  applyMaggiePlan,
  isMaggieUser,
  MAGGIE_ADDITIONAL_INFO,
  MAGGIE_MAIN_GOAL,
  MAGGIE_TRAINING,
} from '../lib/maggiePlan'
import { setProtocolStorageScope } from '../lib/protocolStorageScope'
import { withNadHorizon } from '../lib/lxrdRestart'
import { applyLxrdgatsbyVialInventorySeed } from '../lib/vialInventorySeed'
import { runVialSizeMigrationV2 } from '../lib/vialInventory'
import { getAuthCallbackUrl } from '../lib/authRedirect'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { TrackerState } from '../types'
import type { UserProfile } from '../types/auth'
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
  const [trackerState, setTrackerState] = useState<TrackerState>(blankTrackerState)
  const [profileLoading, setProfileLoading] = useState(false)

  const loadUserData = useCallback(async (userId: string) => {
    const profile = await fetchProfile(userId)
    const {
      data: { user: sessionUser },
    } = (await supabase?.auth.getUser()) ?? { data: { user: null } }
    const email = sessionUser?.email ?? profile?.email ?? null
    void touchLastActive(userId, email)
    if (!profile) {
      setProtocolStorageScope(userId, false)
      setUserProfile(null)
      setTrackerState(blankTrackerState())
      return
    }

    const lxrd = isLxrdgatsbyUser(profile.username, email)
    setProtocolStorageScope(userId, lxrd)
    setUserProfile(profile)
    let next = trackerForSignedInUser({ ...profile, email: profile.email ?? email })
    let changed = false
    let maggieExtras = false
    if (lxrd) {
      const seeded = applyLxrdgatsbyProtocolSeed(next, profile.username, email)
      if (seeded) {
        next = seeded
        changed = true
      }
      const refreshed = refreshProtocolDefinition(next, profile.username, email)
      if (refreshed) {
        next = refreshed
        changed = true
      } else {
        const horizon = withNadHorizon(next)
        if (horizon !== next) {
          next = horizon
          changed = true
        }
      }
      const vialsSeeded = applyLxrdgatsbyVialInventorySeed(
        next,
        profile.username,
        email,
      )
      if (vialsSeeded) {
        next = vialsSeeded
        changed = true
      }
    } else if (isMaggieUser(email)) {
      const source = profileToTrackerState({
        ...profile,
        email: profile.email ?? email,
      })
      const seeded = applyMaggiePlan(source, email, {
        preserveStartDate: Boolean(
          profile.onboardingCompleted && source.profile.startDate
        ),
      })
      if (seeded) {
        next = seeded
        changed = true
        maggieExtras = true
      } else {
        next = source
        if (!profile.onboardingCompleted) {
          changed = true
          maggieExtras = true
        }
      }
      if (maggieExtras) {
        setUserProfile({
          ...profile,
          email: profile.email ?? email,
          onboardingCompleted: true,
          gender: 'female',
          age: 51,
          height: next.profile.height ?? profile.height,
          currentWeight: next.profile.currentWeight,
          goalWeight: next.profile.goalWeight,
          startDate: next.profile.startDate,
          weeklyLossTarget: next.profile.weeklyLossTarget,
          mainGoal: MAGGIE_MAIN_GOAL,
          additionalInfo: MAGGIE_ADDITIONAL_INFO,
          trainingActivities: MAGGIE_TRAINING,
          peptideStack: next.peptides,
          trackerData: next,
        })
      }
    } else if (!profile.onboardingCompleted) {
      const storedPeptides =
        profile.trackerData?.peptides?.length ?? profile.peptideStack.length
      const storedLogs = profile.trackerData?.injectionLogs?.length ?? 0
      if (storedPeptides > 0 || storedLogs > 0) changed = true
    }
    if (changed) {
      try {
        await persistSeededProtocol(
          userId,
          next,
          maggieExtras
            ? {
                mainGoal: MAGGIE_MAIN_GOAL,
                additionalInfo: MAGGIE_ADDITIONAL_INFO,
                gender: 'female',
                age: 51,
                trainingActivities: MAGGIE_TRAINING,
                onboardingCompleted: true,
              }
            : {
                mainGoal: profile.mainGoal ?? next.recompPlan?.summary?.[1],
                additionalInfo: profile.additionalInfo,
              }
        )
      } catch (err) {
        console.error('persist protocol definition:', err)
      }
    }
    next = runVialSizeMigrationV2(next) ?? next
    setTrackerState(next)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) await loadUserData(user.id)
  }, [user, loadUserData])

  useEffect(() => {
    if (!sessionReady) return

    if (!user) {
      setProtocolStorageScope(null, true)
      setUserProfile(null)
      setTrackerState(blankTrackerState())
      setProfileLoading(false)
      return
    }

    let cancelled = false
    setProtocolStorageScope(user.id, false)
    setUserProfile(null)
    setTrackerState(blankTrackerState())
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