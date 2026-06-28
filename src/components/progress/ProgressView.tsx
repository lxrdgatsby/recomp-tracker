import {
  addDays,
  format,
  parse,
  parseISO,
  startOfMonth,
} from 'date-fns'
import { Target, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { TrackerState } from '../../types'
import { computeAdherence } from '../../utils/adherence'
import {
  getLatestWeight,
  getMilestones,
  getStartWeight,
} from '../../utils/calculations'

interface ProgressViewProps {
  state: TrackerState
  onLogWeight: (date: string, weight: number) => void
}

interface DisplayMilestone {
  title: string
  date: string
  goal: string
  achieved: boolean
}

const ADHERENCE_STATS = [
  { key: 'overall' as const, label: 'Overall', colorClass: 'text-emerald-400' },
  {
    key: 'injection' as const,
    label: 'Injections',
    colorClass: 'text-emerald-400',
  },
  { key: 'workout' as const, label: 'Workouts', colorClass: 'text-blue-400' },
]

function getMonthWeightChange(
  history: TrackerState['weightHistory'],
  currentWeight: number
): { delta: number; label: string } | null {
  const monthStart = startOfMonth(new Date())
  const monthEntries = [...history]
    .filter((e) => parseISO(e.date) >= monthStart)
    .sort((a, b) => a.date.localeCompare(b.date))

  if (monthEntries.length === 0) return null

  const baseline = monthEntries[0].weight
  const latest =
    monthEntries.length > 1
      ? monthEntries[monthEntries.length - 1].weight
      : currentWeight
  const delta = Math.round((baseline - latest) * 10) / 10
  if (delta === 0) return null

  const arrow = delta > 0 ? '↓' : '↑'
  return {
    delta,
    label: `${arrow} ${Math.abs(delta)} lbs this month`,
  }
}

function buildMilestones(state: TrackerState): DisplayMilestone[] {
  const { profile, weightHistory } = state
  const startWeight = getStartWeight(profile, weightHistory)
  const currentWeight = getLatestWeight(profile, weightHistory)
  const milestones = getMilestones(profile, startWeight)

  const week2 = milestones.find((m) => m.week === 2)
  const week4 = milestones.find((m) => m.week === 4)

  const first10Target = Math.round((startWeight - 10) * 10) / 10
  const weeksTo10 = Math.ceil(10 / profile.weeklyLossTarget)
  const first10Date = format(
    addDays(parseISO(profile.startDate), weeksTo10 * 7),
    'MMM d'
  )

  const toDisplay = (
    title: string,
    date: string,
    projectedWeight: number
  ): DisplayMilestone => ({
    title,
    date,
    goal: `~${projectedWeight} lbs`,
    achieved: currentWeight <= projectedWeight,
  })

  const result: DisplayMilestone[] = []
  if (week2) {
    result.push(
      toDisplay(week2.label, format(parse(week2.date, 'MMM d, yyyy', new Date()), 'MMM d'), week2.projectedWeight)
    )
  }
  if (week4) {
    result.push(
      toDisplay(week4.label, format(parse(week4.date, 'MMM d, yyyy', new Date()), 'MMM d'), week4.projectedWeight)
    )
  }
  result.push(
    toDisplay('First 10lbs Lost', first10Date, first10Target)
  )

  return result
}

export function ProgressView({ state, onLogWeight }: ProgressViewProps) {
  const { profile, weightHistory } = state
  const [showLogModal, setShowLogModal] = useState(false)
  const [weightInput, setWeightInput] = useState('')

  const adherence = useMemo(() => computeAdherence(state), [state])
  const currentWeight = getLatestWeight(profile, weightHistory)

  const adherenceValues = {
    overall: adherence.overall,
    injection: adherence.injectionPct,
    workout: adherence.workoutPct,
  }

  const chartEntries = useMemo(
    () =>
      [...weightHistory]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((e) => ({
          date: format(parseISO(e.date), 'MMM d'),
          weight: e.weight,
        })),
    [weightHistory]
  )

  const barScale = useMemo(() => {
    if (chartEntries.length === 0) {
      return { min: profile.goalWeight - 10, max: currentWeight + 10 }
    }
    const weights = chartEntries.map((e) => e.weight)
    const min = Math.min(...weights, profile.goalWeight) - 5
    const max = Math.max(...weights, currentWeight) + 5
    return { min, max: Math.max(max, min + 1) }
  }, [chartEntries, profile.goalWeight, currentWeight])

  const monthChange = getMonthWeightChange(weightHistory, currentWeight)
  const milestones = useMemo(() => buildMilestones(state), [state])

  const today = format(new Date(), 'yyyy-MM-dd')

  const openLogModal = () => {
    setWeightInput(String(currentWeight))
    setShowLogModal(true)
  }

  const saveWeight = () => {
    const w = parseFloat(weightInput)
    if (!isNaN(w) && w > 0) {
      onLogWeight(today, w)
      setShowLogModal(false)
    }
  }

  return (
    <div className="pb-8 text-white">
      <div className="pt-2">
        <h1 className="mb-1 text-3xl font-semibold tracking-tight">Progress</h1>
        <p className="text-slate-400">
          Weight history, adherence, and milestones
        </p>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {ADHERENCE_STATS.map((stat) => (
          <div
            key={stat.key}
            className="rounded-2xl bg-white/5 p-4 text-center"
          >
            <div className={`text-3xl font-semibold tabular-nums ${stat.colorClass}`}>
              {adherenceValues[stat.key]}%
            </div>
            <div className="mt-1 text-xs text-slate-400">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-medium">Weight Trend</h2>
          {monthChange && (
            <span
              className={`text-xs ${
                monthChange.delta > 0 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {monthChange.label}
            </span>
          )}
        </div>

        <div className="relative flex h-64 items-end justify-between rounded-2xl bg-white/5 p-6">
          {chartEntries.length === 0 ? (
            <p className="w-full text-center text-sm text-slate-500">
              No weight logged yet. Tap the target button to log your first
              weigh-in.
            </p>
          ) : (
            chartEntries.map((entry) => {
              const range = barScale.max - barScale.min
              const heightPx = Math.max(
                12,
                ((entry.weight - barScale.min) / range) * 180
              )
              return (
                <div
                  key={entry.date}
                  className="flex flex-1 flex-col items-center"
                >
                  <div
                    className="w-8 rounded-t bg-emerald-500 transition-all"
                    style={{ height: `${heightPx}px` }}
                  />
                  <div className="mt-2 text-xs text-slate-400">{entry.date}</div>
                  <div className="text-sm font-medium tabular-nums">
                    {entry.weight}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-4 font-medium">Key Milestones</h2>
        <div className="space-y-3">
          {milestones.map((milestone) => (
            <div
              key={milestone.title}
              className="flex items-center justify-between rounded-2xl bg-white/5 p-4"
            >
              <div>
                <div className="font-medium">{milestone.title}</div>
                <div className="text-xs text-slate-400">{milestone.date}</div>
              </div>
              <div className="text-right">
                <div
                  className={`text-sm ${
                    milestone.achieved ? 'text-emerald-400' : 'text-emerald-400/80'
                  }`}
                >
                  {milestone.goal}
                  {milestone.achieved && (
                    <span className="ml-1 text-xs text-emerald-500">✓</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={openLogModal}
                  className="mt-1 rounded-full bg-white/10 px-3 py-1 text-xs transition-colors hover:bg-white/20"
                >
                  Log Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed right-6 bottom-20 z-40 lg:bottom-8">
        <button
          type="button"
          onClick={openLogModal}
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-black shadow-xl shadow-emerald-500/30 transition-colors hover:bg-emerald-600"
          aria-label="Log weight"
        >
          <Target size={24} />
        </button>
      </div>

      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Log Weight</h3>
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <label className="text-sm text-slate-400">Weight (lbs)</label>
            <input
              type="text"
              inputMode="decimal"
              className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-xl tabular-nums text-white focus:border-emerald-500/50 focus:outline-none"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              autoFocus
            />
            <p className="mt-2 text-xs text-slate-500">
              Logging for {format(new Date(), 'MMM d, yyyy')}
            </p>
            <button
              type="button"
              onClick={saveWeight}
              className="mt-4 w-full rounded-2xl bg-emerald-500 py-3.5 font-medium text-black transition-colors hover:bg-emerald-600"
            >
              Save Weight
            </button>
          </div>
        </div>
      )}
    </div>
  )
}