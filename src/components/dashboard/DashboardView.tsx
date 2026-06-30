import { format } from 'date-fns'
import {
  Award,
  Calendar,
  Dumbbell,
  Syringe,
  Target,
  TrendingUp,
  User,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { inferWeightGoalMode } from '../../constants/onboardingGoals'
import type { TrackerState } from '../../types'
import {
  getLatestWeight,
  getWeightToLose,
} from '../../utils/calculations'
import { getOnboardingData } from '../../utils/onboardingStorage'
import { getGreeting, getTodayDashboardData } from '../../utils/todayActions'

interface DashboardViewProps {
  state: TrackerState
  username?: string | null
  onToggleInjection: (date: string, peptideId: string) => void
}

export function DashboardView({
  state,
  username,
  onToggleInjection,
}: DashboardViewProps) {
  const navigate = useNavigate()
  const { userProfile } = useAuth()
  const { profile } = state
  const today = format(new Date(), 'yyyy-MM-dd')
  const currentWeight = getLatestWeight(profile, state.weightHistory)
  const weightDelta = Math.abs(currentWeight - profile.goalWeight)
  const weightToLose = getWeightToLose(currentWeight, profile.goalWeight)
  const { dayInCycle, totalDays, primaryInjection, workout } =
    getTodayDashboardData(state)
  const progress = Math.round((dayInCycle / totalDays) * 100)

  const displayName = username
    ? username.charAt(0).toUpperCase() + username.slice(1)
    : 'Gatsby'

  const goals =
    getOnboardingData()?.goals ??
    userProfile?.mainGoal?.split(',').map((g) => g.trim()).filter(Boolean) ??
    []

  const weightMode = inferWeightGoalMode(
    goals,
    currentWeight,
    profile.goalWeight
  )

  const weeklyTarget = Math.round(profile.weeklyLossTarget * 10) / 10

  const goalWeightSubtext =
    weightMode === 'gain'
      ? `+${weightDelta.toFixed(1)} lbs to go`
      : weightMode === 'wellness' || weightMode === 'maintain'
        ? goals[0] ?? 'Personalized protocol'
        : `-${weightToLose} lbs remaining`

  const weekCardLabel =
    weightMode === 'gain'
      ? 'Target gain'
      : weightMode === 'wellness' || weightMode === 'maintain'
        ? 'Protocol focus'
        : 'Target loss'

  const weekCardValue =
    weightMode === 'wellness' || weightMode === 'maintain'
      ? goals.slice(0, 2).join(' · ') || 'Your goals'
      : `${weeklyTarget}`

  const weekCardUnit =
    weightMode === 'wellness' || weightMode === 'maintain' ? '' : 'lbs'

  return (
    <div className="pb-6 text-white">
      <div className="pt-2 pb-4">
        <div className="flex items-start justify-between">
          <Link
            to="/app/profile"
            className="rounded-xl transition-opacity hover:opacity-90"
          >
            <p className="text-sm text-slate-400">{getGreeting()},</p>
            <h1 className="text-3xl font-semibold tracking-tight">
              {displayName} ♠️
            </h1>
            {username && (
              <p className="mt-0.5 text-xs text-emerald-400/80">
                @{username} · Edit profile
              </p>
            )}
          </Link>
          <div className="text-right">
            <div className="text-xs text-slate-400">
              DAY {dayInCycle} / {totalDays}
            </div>
            <div className="font-mono text-2xl font-medium text-emerald-400">
              {progress}%
            </div>
          </div>
        </div>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white/5 p-4">
          <div className="mb-1 flex items-center gap-2 text-emerald-400">
            <Target size={16} />
            <span className="text-xs tracking-widest uppercase">Goal Weight</span>
          </div>
          <div className="text-3xl font-semibold tabular-nums">
            {profile.goalWeight}{' '}
            <span className="text-base font-normal text-slate-400">lbs</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">{goalWeightSubtext}</div>
        </div>

        <div className="rounded-2xl bg-white/5 p-4">
          <div className="mb-1 flex items-center gap-2 text-emerald-400">
            <TrendingUp size={16} />
            <span className="text-xs tracking-widest uppercase">This Week</span>
          </div>
          <div
            className={`font-semibold tabular-nums ${
              weightMode === 'wellness' || weightMode === 'maintain'
                ? 'text-lg leading-snug'
                : 'text-3xl'
            }`}
          >
            {weekCardValue}
            {weekCardUnit && (
              <span className="text-base font-normal text-slate-400">
                {' '}
                {weekCardUnit}
              </span>
            )}
          </div>
          <div className="mt-1 text-xs text-slate-400">{weekCardLabel}</div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="mb-3 px-1 text-sm tracking-[2px] text-slate-400 uppercase">
          Today&apos;s Actions
        </h2>

        {primaryInjection ? (
          <div className="mb-3 rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Syringe className="text-emerald-400" size={18} />
                </div>
                <div>
                  <div className="font-medium">{primaryInjection.peptideName}</div>
                  <div className="text-sm text-emerald-400">
                    {primaryInjection.dose}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onToggleInjection(today, primaryInjection.peptideId)
                }
                className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                  primaryInjection.done
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-white text-black hover:bg-white/90'
                }`}
              >
                {primaryInjection.done ? 'Done' : 'Mark Done'}
              </button>
            </div>
            <div className="text-xs text-slate-400">{primaryInjection.timing}</div>
          </div>
        ) : (
          <div className="mb-3 rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">No injections scheduled today.</p>
          </div>
        )}

        {workout ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10">
                  <Dumbbell className="text-blue-400" size={18} />
                </div>
                <div>
                  <div className="font-medium">Workout</div>
                  <div className="text-sm text-slate-400">
                    {workout.label} • Week {workout.week}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/app/workouts')}
                className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                  workout.completed
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-white text-black hover:bg-white/90'
                }`}
              >
                {workout.completed ? 'Done' : 'Start'}
              </button>
            </div>
            <div className="text-xs text-slate-400">{workout.exercises}</div>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">Rest day — no workout scheduled.</p>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 px-1 text-sm tracking-[2px] text-slate-400 uppercase">
          Quick Access
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/app/profile"
            className="flex items-center gap-3 rounded-2xl bg-white/5 p-4 transition-colors hover:bg-white/10"
          >
            <User size={20} className="text-emerald-400" />
            <span>My Profile</span>
          </Link>
          <Link
            to="/app/peptides"
            className="flex items-center gap-3 rounded-2xl bg-white/5 p-4 transition-colors hover:bg-white/10"
          >
            <Syringe size={20} className="text-emerald-400" />
            <span>Peptides & Dosing</span>
          </Link>
          <Link
            to="/app/plan"
            className="flex items-center gap-3 rounded-2xl bg-white/5 p-4 transition-colors hover:bg-white/10"
          >
            <Calendar size={20} className="text-emerald-400" />
            <span>90-Day Plan</span>
          </Link>
          <Link
            to="/app/progress"
            className="flex items-center gap-3 rounded-2xl bg-white/5 p-4 transition-colors hover:bg-white/10"
          >
            <TrendingUp size={20} className="text-emerald-400" />
            <span>Progress Log</span>
          </Link>
          <Link
            to="/app/assistant"
            className="flex items-center gap-3 rounded-2xl bg-white/5 p-4 transition-colors hover:bg-white/10"
          >
            <Award size={20} className="text-emerald-400" />
            <span>Ask Assistant</span>
          </Link>
        </div>
      </div>
    </div>
  )
}