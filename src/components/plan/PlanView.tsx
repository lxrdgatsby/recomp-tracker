import { format } from 'date-fns'
import { Flag } from 'lucide-react'
import { CYCLE_DAYS } from '../../constants/defaults'
import type { TrackerState } from '../../types'
import {
  getDaysIntoCycle,
  getLatestWeight,
  getMilestones,
  getProjectedGoalDate,
  getStartWeight,
} from '../../utils/calculations'
import { Card } from '../ui/Card'
import { ProgressBar } from '../ui/ProgressBar'

interface PlanViewProps {
  state: TrackerState
}

export function PlanView({ state }: PlanViewProps) {
  const { profile, weightHistory } = state
  const current = getLatestWeight(profile, weightHistory)
  const start = getStartWeight(profile, weightHistory)
  const daysIn = getDaysIntoCycle(profile.startDate)
  const projected = getProjectedGoalDate(
    current,
    profile.goalWeight,
    profile.weeklyLossTarget
  )
  const milestones = getMilestones(profile, start)
  const cycleProgress = Math.round((daysIn / CYCLE_DAYS) * 100)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">90-Day Recomp Plan</h2>
        <p className="mt-1 text-sm text-slate-400">
          Auto-generated schedule based on your inputs
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="!p-4">
          <p className="text-xs text-slate-500">Cycle Progress</p>
          <p className="mt-1 text-2xl font-bold text-white">
            Day {daysIn} <span className="text-base font-normal text-slate-500">/ {CYCLE_DAYS}</span>
          </p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs text-slate-500">Weekly Loss Target</p>
          <p className="mt-1 text-2xl font-bold text-teal-400">
            {profile.weeklyLossTarget} lbs
          </p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs text-slate-500">Projected Goal Date</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">
            {projected ? format(projected, 'MMM d, yyyy') : '—'}
          </p>
        </Card>
      </div>

      <Card title="90-Day Timeline">
        <ProgressBar value={cycleProgress} label="Days elapsed" />
      </Card>

      <Card title="Key Milestones">
        <div className="space-y-3">
          {milestones.map((m) => (
            <div
              key={m.week}
              className="flex items-center gap-4 rounded-lg border border-slate-800/60 bg-navy-950/30 px-4 py-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-teal-400">
                <Flag size={16} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">{m.label}</p>
                <p className="text-xs text-slate-500">{m.date}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-emerald-400">
                  ~{m.projectedWeight} lbs
                </p>
                <p className="text-xs text-slate-600">projected</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Protocol Summary">
        <ul className="space-y-2 text-sm text-slate-400">
          <li>· 90-day structured recomp with conservative {profile.weeklyLossTarget} lb/week fat loss</li>
          <li>· 5 training days / 2 rest days per week with 10k steps + 100 pushups daily</li>
          <li>· Peptide stack per your configured schedule (daily + weekly compounds)</li>
          <li>· Milestone check-ins every 2 weeks to assess weight trend and adherence</li>
        </ul>
      </Card>
    </div>
  )
}