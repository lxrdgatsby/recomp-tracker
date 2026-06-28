import { format } from 'date-fns'
import { Scale, Target, TrendingDown, Calendar, Clock } from 'lucide-react'
import { useState } from 'react'
import { CYCLE_DAYS } from '../../constants/defaults'
import type { TrackerState } from '../../types'
import {
  getDaysIntoCycle,
  getLatestWeight,
  getProgressPercent,
  getProjectedGoalDate,
  getStartWeight,
  getWeightToLose,
} from '../../utils/calculations'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'
import { ProgressBar } from '../ui/ProgressBar'

interface DashboardViewProps {
  state: TrackerState
  onLogWeight: (date: string, weight: number) => void
}

export function DashboardView({ state, onLogWeight }: DashboardViewProps) {
  const { profile, weightHistory } = state
  const current = getLatestWeight(profile, weightHistory)
  const start = getStartWeight(profile, weightHistory)
  const toLose = getWeightToLose(current, profile.goalWeight)
  const daysIn = getDaysIntoCycle(profile.startDate)
  const projected = getProjectedGoalDate(
    current,
    profile.goalWeight,
    profile.weeklyLossTarget
  )
  const progress = getProgressPercent(start, current, profile.goalWeight)

  const [weightInput, setWeightInput] = useState(String(current))
  const today = format(new Date(), 'yyyy-MM-dd')

  const stats = [
    {
      label: 'Current Weight',
      value: `${current} lbs`,
      icon: Scale,
      accent: 'text-teal-400',
    },
    {
      label: 'Goal Weight',
      value: `${profile.goalWeight} lbs`,
      icon: Target,
      accent: 'text-emerald-400',
    },
    {
      label: 'Weight to Lose',
      value: `${toLose} lbs`,
      icon: TrendingDown,
      accent: 'text-amber-400',
    },
    {
      label: 'Days into Cycle',
      value: `${daysIn} / ${CYCLE_DAYS}`,
      icon: Clock,
      accent: 'text-sky-400',
    },
    {
      label: 'Projected Goal',
      value: projected ? format(projected, 'MMM d, yyyy') : '—',
      icon: Calendar,
      accent: 'text-violet-400',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        <p className="mt-1 text-sm text-slate-400">
          Your 90-day recomp at a glance
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map(({ label, value, icon: Icon, accent }) => (
          <Card key={label} className="!p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-1 text-xl font-bold text-white">{value}</p>
              </div>
              <Icon size={20} className={accent} />
            </div>
          </Card>
        ))}
      </div>

      <Card title="Goal Progress">
        <ProgressBar value={progress} label="Progress toward goal weight" />
        <p className="mt-3 text-xs text-slate-500">
          Based on {profile.weeklyLossTarget} lb/week target · Started{' '}
          {profile.startDate}
        </p>
      </Card>

      <Card title="Log Today's Weight">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="Weight (lbs)"
              type="number"
              step="0.1"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
            />
          </div>
          <Button
            onClick={() => {
              const w = parseFloat(weightInput)
              if (!isNaN(w) && w > 0) onLogWeight(today, w)
            }}
          >
            Save Weight
          </Button>
        </div>
      </Card>
    </div>
  )
}