import { Check, Footprints } from 'lucide-react'
import { useState } from 'react'
import type { TrackerState } from '../../types'
import { formatDate } from '../../utils/calculations'
import { getWorkoutDate, WORKOUT_PLAN } from '../../utils/workoutPlan'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

interface WorkoutsViewProps {
  state: TrackerState
  onToggleWorkout: (date: string, week: number, dayIndex: number) => void
}

export function WorkoutsView({ state, onToggleWorkout }: WorkoutsViewProps) {
  const { profile, workoutCompletions } = state
  const [selectedWeek, setSelectedWeek] = useState(1)

  const weekPlan = WORKOUT_PLAN.find((w) => w.week === selectedWeek)!

  const isComplete = (date: string, week: number, dayIndex: number) =>
    workoutCompletions.some(
      (c) => c.date === date && c.week === week && c.dayIndex === dayIndex
    )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Workout Regimen</h2>
        <p className="mt-1 text-sm text-slate-400">
          5 days on · 2 days off · 13-week progressive plan
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {WORKOUT_PLAN.map((w) => (
          <button
            key={w.week}
            type="button"
            onClick={() => setSelectedWeek(w.week)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedWeek === w.week
                ? 'bg-teal-500/15 text-teal-400 ring-1 ring-teal-500/30'
                : 'bg-navy-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Week {w.week}
          </button>
        ))}
      </div>

      <Card>
        <p className="text-sm text-teal-400/90">
          <span className="font-semibold text-teal-400">Week {selectedWeek} focus:</span>{' '}
          {weekPlan.progressionNote}
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {weekPlan.days.map((day) => {
          const date = getWorkoutDate(profile.startDate, selectedWeek, day.dayIndex)
          const done = isComplete(date, selectedWeek, day.dayIndex)
          return (
            <Card key={day.dayIndex}>
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500">{day.label} · {formatDate(date)}</p>
                  <h4 className="text-lg font-semibold text-white">{day.focus}</h4>
                </div>
                <Button
                  size="sm"
                  variant={done ? 'success' : 'secondary'}
                  onClick={() =>
                    onToggleWorkout(date, selectedWeek, day.dayIndex)
                  }
                >
                  {done && <Check size={14} />}
                  {done ? 'Complete' : 'Mark Complete'}
                </Button>
              </div>

              <ul className="mb-4 space-y-1 text-sm text-slate-400">
                {day.exercises.map((ex) => (
                  <li key={ex}>· {ex}</li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-3 text-xs">
                <span className="flex items-center gap-1 rounded-full bg-navy-800 px-2.5 py-1 text-slate-400">
                  <Footprints size={12} className="text-sky-400" />
                  {day.stepsGoal.toLocaleString()} steps
                </span>
                <span className="rounded-full bg-navy-800 px-2.5 py-1 text-slate-400">
                  {day.pushupsGoal} pushups
                </span>
              </div>
              {day.notes && (
                <p className="mt-3 text-xs text-slate-600">{day.notes}</p>
              )}
            </Card>
          )
        })}
      </div>

      <Card title="Rest Days">
        <p className="text-sm text-slate-400">
          Days 6 & 7 each week are rest days. Target 10k+ steps, light mobility,
          and prioritize sleep for recovery. No structured lifting required.
        </p>
      </Card>
    </div>
  )
}