import { differenceInCalendarDays, format, parse, parseISO } from 'date-fns'
import { Calendar, Download, Target, TrendingUp, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { SmartCheckIn } from '../checkin/SmartCheckIn'
import { AdvancedAnalytics } from './AdvancedAnalytics'
import { ProgressCorrelation } from './ProgressCorrelation'
import type { TrackerState } from '../../types'
import type { CheckInData } from '../../utils/checkInStorage'
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

const ADHERENCE_STATS = [
  { key: 'overall' as const, label: 'Overall', colorClass: 'text-emerald-400' },
  {
    key: 'injection' as const,
    label: 'Injections',
    colorClass: 'text-emerald-400',
  },
  { key: 'workout' as const, label: 'Workouts', colorClass: 'text-blue-400' },
]

const UPCOMING_WEEKS = [2, 4, 8]

interface ChartPoint {
  date: string
  weight: number
  goal: number
}

interface UpcomingMilestone {
  week: string
  date: string
  target: string
  status: string
  statusClass: string
}

function buildChartData(state: TrackerState): ChartPoint[] {
  const { profile, weightHistory } = state
  const start = parseISO(profile.startDate)
  const startWeight = getStartWeight(profile, weightHistory)

  const entries = [...weightHistory].sort((a, b) => a.date.localeCompare(b.date))

  if (entries.length === 0) {
    const today = new Date()
    const weeksElapsed = Math.max(0, differenceInCalendarDays(today, start) / 7)
    const goal = Math.max(
      profile.goalWeight,
      Math.round(
        (startWeight - weeksElapsed * profile.weeklyLossTarget) * 10
      ) / 10
    )
    return [
      {
        date: format(today, 'MMM d'),
        weight: startWeight,
        goal,
      },
    ]
  }

  return entries.map((entry) => {
    const entryDate = parseISO(entry.date)
    const weeksElapsed = Math.max(
      0,
      differenceInCalendarDays(entryDate, start) / 7
    )
    const goal = Math.max(
      profile.goalWeight,
      Math.round(
        (startWeight - weeksElapsed * profile.weeklyLossTarget) * 10
      ) / 10
    )
    return {
      date: format(entryDate, 'MMM d'),
      weight: entry.weight,
      goal,
    }
  })
}

function getYDomain(chartData: ChartPoint[], goalWeight: number): [number, number] {
  const values = chartData.flatMap((d) => [d.weight, d.goal])
  const min = Math.floor(Math.min(...values, goalWeight) - 4)
  const max = Math.ceil(Math.max(...values) + 4)
  return [min, Math.max(max, min + 8)]
}

function buildUpcomingMilestones(state: TrackerState): UpcomingMilestone[] {
  const { profile, weightHistory } = state
  const startWeight = getStartWeight(profile, weightHistory)
  const currentWeight = getLatestWeight(profile, weightHistory)
  const today = new Date()
  const milestones = getMilestones(profile, startWeight)

  return UPCOMING_WEEKS.map((weekNum) => {
    const milestone = milestones.find((m) => m.week === weekNum)
    if (!milestone) return null

    const milestoneDate = parse(milestone.date, 'MMM d, yyyy', new Date())
    const shortDate = format(milestoneDate, 'MMM d')
    const achieved = currentWeight <= milestone.projectedWeight
    const isPast = milestoneDate < today

    let status = 'Upcoming'
    let statusClass = 'text-emerald-400'
    if (isPast && achieved) {
      status = 'Achieved'
      statusClass = 'text-emerald-400'
    } else if (isPast) {
      status = 'In progress'
      statusClass = 'text-amber-400'
    }

    return {
      week: `Week ${weekNum}`,
      date: shortDate,
      target: `~${milestone.projectedWeight} lbs`,
      status,
      statusClass,
    }
  }).filter((m): m is UpcomingMilestone => m != null)
}

export function ProgressView({ state, onLogWeight }: ProgressViewProps) {
  const { profile, weightHistory } = state
  const [showLogModal, setShowLogModal] = useState(false)
  const [weightInput, setWeightInput] = useState('')
  const [checkInVersion, setCheckInVersion] = useState(0)

  const adherence = useMemo(() => computeAdherence(state), [state])
  const currentWeight = getLatestWeight(profile, weightHistory)
  const startWeight = getStartWeight(profile, weightHistory)
  const totalLoss = Math.round((startWeight - currentWeight) * 10) / 10

  const adherenceValues = {
    overall: adherence.overall,
    injection: adherence.injectionPct,
    workout: adherence.workoutPct,
  }

  const chartData = useMemo(() => buildChartData(state), [state])
  const yDomain = useMemo(
    () => getYDomain(chartData, profile.goalWeight),
    [chartData, profile.goalWeight]
  )
  const upcomingMilestones = useMemo(
    () => buildUpcomingMilestones(state),
    [state]
  )

  const today = format(new Date(), 'yyyy-MM-dd')
  const hasLoggedWeights = weightHistory.length > 0

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

  const handleCheckIn = (data: CheckInData) => {
    const w = parseFloat(data.weight)
    if (!isNaN(w) && w > 0) {
      onLogWeight(today, w)
    }
    setCheckInVersion((v) => v + 1)
  }

  const handleExportPdf = async () => {
    const { exportFullReport } = await import('../../utils/exportPDF')
    exportFullReport()
  }

  return (
    <div className="pb-8 text-white">
      <div className="flex items-start justify-between gap-3 pb-6 pt-2">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Progress Log</h1>
          <p className="text-slate-400">Track your recomp journey</p>
        </div>
        <button
          type="button"
          onClick={handleExportPdf}
          className="flex shrink-0 items-center gap-2 rounded-xl border border-white/20 px-3 py-2 text-xs text-slate-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-400"
        >
          <Download size={14} />
          Export Full Report (PDF)
        </button>
      </div>

      <div className="mb-4">
        <SmartCheckIn
          defaultWeight={String(currentWeight)}
          onSubmit={handleCheckIn}
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ProgressCorrelation refreshKey={checkInVersion} />
        <AdvancedAnalytics refreshKey={checkInVersion} />
      </div>

      <div className="mb-8 grid grid-cols-3 gap-3">
        {ADHERENCE_STATS.map((stat) => (
          <div
            key={stat.key}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center"
          >
            <div
              className={`text-3xl font-semibold tabular-nums ${stat.colorClass}`}
            >
              {adherenceValues[stat.key]}%
            </div>
            <div className="mt-1 text-xs text-slate-400">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-medium">Weight Trend</h2>
          {totalLoss > 0 && (
            <div className="flex items-center gap-1 text-sm text-emerald-400">
              <TrendingUp size={16} />-{totalLoss} lbs
            </div>
          )}
        </div>

        <div className="h-72 rounded-3xl bg-white/5 p-4">
          {!hasLoggedWeights && (
            <p className="mb-2 text-center text-xs text-slate-500">
              Log weight to build your trend line
            </p>
          )}
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis
                dataKey="date"
                stroke="#666"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis
                domain={yDomain}
                stroke="#666"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#334155' }}
              />
              <Tooltip
                contentStyle={{
                  background: '#0a0a0a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  color: '#e2e8f0',
                }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Line
                type="natural"
                dataKey="weight"
                name="Weight"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 5 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="natural"
                dataKey="goal"
                name="Target"
                stroke="#666"
                strokeDasharray="4 2"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h2 className="mb-4 flex items-center gap-2 font-medium">
          <Calendar size={18} /> Upcoming Milestones
        </h2>

        <div className="space-y-3">
          {upcomingMilestones.map((milestone) => (
            <div
              key={milestone.week}
              className="flex items-center justify-between rounded-2xl bg-white/5 p-5"
            >
              <div>
                <div className="font-medium">{milestone.week} Check-in</div>
                <div className="text-xs text-slate-400">
                  {milestone.date} • {milestone.target}
                </div>
              </div>
              <div className={`text-right text-sm ${milestone.statusClass}`}>
                {milestone.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={openLogModal}
        className="fixed right-6 bottom-20 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 shadow-2xl shadow-emerald-500/50 transition-colors hover:bg-emerald-600 lg:bottom-8"
        aria-label="Log weight"
      >
        <Target size={26} className="text-black" />
      </button>

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