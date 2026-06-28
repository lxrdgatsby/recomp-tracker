import { format, parseISO, startOfWeek, eachDayOfInterval, addDays } from 'date-fns'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { useMemo } from 'react'
import { CYCLE_DAYS } from '../../constants/defaults'
import type { TrackerState } from '../../types'
import { getDaysIntoCycle } from '../../utils/calculations'
import { getInjectionsForDate } from '../../utils/peptideSchedule'
import { getWorkoutDate, WORKOUT_PLAN } from '../../utils/workoutPlan'
import { Card } from '../ui/Card'

interface ProgressViewProps {
  state: TrackerState
}

function computeAdherence(state: TrackerState) {
  const { profile, injectionLogs, workoutCompletions, peptides } = state
  const daysIn = getDaysIntoCycle(profile.startDate)
  const start = parseISO(profile.startDate)
  const end = addDays(start, Math.min(daysIn, CYCLE_DAYS) - 1)

  let expectedInjections = 0
  let completedInjections = 0
  const days = eachDayOfInterval({ start, end })

  days.forEach((day) => {
    const dateStr = format(day, 'yyyy-MM-dd')
    const scheduled = getInjectionsForDate(peptides, day, profile.startDate)
    expectedInjections += scheduled.length
    scheduled.forEach((inj) => {
      if (
        injectionLogs.some(
          (l) => l.date === dateStr && l.peptideId === inj.peptideId
        )
      ) {
        completedInjections++
      }
    })
  })

  let expectedWorkouts = 0
  let completedWorkouts = 0
  WORKOUT_PLAN.forEach((week) => {
    week.days.forEach((day) => {
      const date = getWorkoutDate(profile.startDate, week.week, day.dayIndex)
      const dayDate = parseISO(date)
      if (dayDate >= start && dayDate <= end) {
        expectedWorkouts++
        if (
          workoutCompletions.some(
            (c) =>
              c.date === date &&
              c.week === week.week &&
              c.dayIndex === day.dayIndex
          )
        ) {
          completedWorkouts++
        }
      }
    })
  })

  const injectionPct =
    expectedInjections > 0
      ? Math.round((completedInjections / expectedInjections) * 100)
      : 100
  const workoutPct =
    expectedWorkouts > 0
      ? Math.round((completedWorkouts / expectedWorkouts) * 100)
      : 100
  const overall = Math.round((injectionPct + workoutPct) / 2)

  return {
    injectionPct,
    workoutPct,
    overall,
    completedInjections,
    expectedInjections,
    completedWorkouts,
    expectedWorkouts,
  }
}

export function ProgressView({ state }: ProgressViewProps) {
  const { weightHistory, workoutCompletions } = state
  const adherence = useMemo(() => computeAdherence(state), [state])

  const chartData = [...weightHistory]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({
      date: format(parseISO(e.date), 'MMM d'),
      weight: e.weight,
    }))

  const recentWorkouts = [...workoutCompletions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 14)

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 })
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: addDays(weekStart, 6),
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Progress Log</h2>
        <p className="mt-1 text-sm text-slate-400">
          Weight history, workout adherence, and completion tracking
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="!p-4 text-center">
          <p className="text-xs text-slate-500">Overall Adherence</p>
          <p className="mt-1 text-3xl font-bold text-teal-400">
            {adherence.overall}%
          </p>
        </Card>
        <Card className="!p-4 text-center">
          <p className="text-xs text-slate-500">Injection Adherence</p>
          <p className="mt-1 text-3xl font-bold text-emerald-400">
            {adherence.injectionPct}%
          </p>
          <p className="text-xs text-slate-600">
            {adherence.completedInjections}/{adherence.expectedInjections}
          </p>
        </Card>
        <Card className="!p-4 text-center">
          <p className="text-xs text-slate-500">Workout Adherence</p>
          <p className="mt-1 text-3xl font-bold text-sky-400">
            {adherence.workoutPct}%
          </p>
          <p className="text-xs text-slate-600">
            {adherence.completedWorkouts}/{adherence.expectedWorkouts}
          </p>
        </Card>
      </div>

      <Card title="Weight History">
        {chartData.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            No weight entries yet. Log weight from the dashboard.
          </p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  domain={['dataMin - 2', 'dataMax + 2']}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#334155' }}
                />
                <Tooltip
                  contentStyle={{
                    background: '#0c1220',
                    border: '1px solid #334155',
                    borderRadius: 8,
                    color: '#e2e8f0',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#14b8a6"
                  strokeWidth={2}
                  dot={{ fill: '#14b8a6', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {weightHistory.length > 0 && (
          <div className="mt-4 max-h-40 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Weight</th>
                </tr>
              </thead>
              <tbody>
                {[...weightHistory]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((e) => (
                    <tr key={e.date} className="border-t border-slate-800/60">
                      <td className="py-2 text-slate-400">
                        {format(parseISO(e.date), 'MMM d, yyyy')}
                      </td>
                      <td className="py-2 font-medium text-white">
                        {e.weight} lbs
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="This Week's Workouts">
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const done = workoutCompletions.some((c) => c.date === dateStr)
            const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr
            return (
              <div
                key={dateStr}
                className={`rounded-lg border p-2 text-center ${
                  done
                    ? 'border-emerald-500/30 bg-emerald-500/10'
                    : 'border-slate-800 bg-navy-950/40'
                } ${isToday ? 'ring-1 ring-teal-500/40' : ''}`}
              >
                <p className="text-[10px] text-slate-500">
                  {format(day, 'EEE')}
                </p>
                <p className="text-sm font-medium text-slate-300">
                  {format(day, 'd')}
                </p>
                {done && (
                  <p className="mt-1 text-[10px] text-emerald-400">Done</p>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      <Card title="Recent Completions">
        {recentWorkouts.length === 0 ? (
          <p className="text-sm text-slate-500">No workouts completed yet.</p>
        ) : (
          <ul className="space-y-2">
            {recentWorkouts.map((w) => (
              <li
                key={`${w.date}-${w.week}-${w.dayIndex}`}
                className="flex justify-between text-sm"
              >
                <span className="text-slate-400">
                  {format(parseISO(w.date), 'MMM d, yyyy')}
                </span>
                <span className="text-slate-300">
                  Week {w.week} · Day {w.dayIndex + 1}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}