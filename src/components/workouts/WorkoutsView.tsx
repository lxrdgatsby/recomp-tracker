import { differenceInDays, parseISO } from 'date-fns'
import { Check } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { TrackerState } from '../../types'
import { getWorkoutDate, WORKOUT_PLAN } from '../../utils/workoutPlan'

interface WorkoutsViewProps {
  state: TrackerState
  onToggleWorkout: (date: string, week: number, dayIndex: number) => void
}

function getCurrentWeek(startDate: string): number {
  const offset = differenceInDays(new Date(), parseISO(startDate))
  if (offset < 0) return 1
  return Math.min(Math.floor(offset / 7) + 1, WORKOUT_PLAN.length)
}

export function WorkoutsView({ state, onToggleWorkout }: WorkoutsViewProps) {
  const { profile, workoutCompletions } = state
  const [selectedWeek, setSelectedWeek] = useState(() =>
    getCurrentWeek(profile.startDate)
  )

  const weekPlan = WORKOUT_PLAN.find((w) => w.week === selectedWeek) ?? WORKOUT_PLAN[0]

  const completedKeys = useMemo(
    () =>
      new Set(
        workoutCompletions.map((c) => `${c.week}-${c.dayIndex}-${c.date}`)
      ),
    [workoutCompletions]
  )

  const isComplete = (date: string, week: number, dayIndex: number) =>
    completedKeys.has(`${week}-${dayIndex}-${date}`)

  return (
    <div className="pb-8 text-white">
      <h1 className="mb-1 text-3xl font-semibold">Workouts</h1>
      <p className="mb-2 text-slate-400">
        5 days on • 2 days off • Progressive overload
      </p>
      <p className="mb-4 text-sm text-emerald-400/90">
        Week {selectedWeek}: {weekPlan.progressionNote}
      </p>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {WORKOUT_PLAN.map((w) => (
          <button
            key={w.week}
            type="button"
            onClick={() => setSelectedWeek(w.week)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedWeek === w.week
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            W{w.week}
          </button>
        ))}
      </div>

      {weekPlan.days.map((day) => {
        const date = getWorkoutDate(profile.startDate, selectedWeek, day.dayIndex)
        const done = isComplete(date, selectedWeek, day.dayIndex)

        return (
          <div
            key={day.dayIndex}
            className="mb-4 rounded-3xl border border-white/10 bg-white/5 p-6"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <div className="text-sm text-emerald-400">{day.label}</div>
                <div className="text-xl font-semibold">{day.focus}</div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onToggleWorkout(date, selectedWeek, day.dayIndex)
                }
                className={`flex shrink-0 items-center gap-2 rounded-2xl px-5 py-2 text-sm transition-all ${
                  done
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-white text-black hover:bg-white/90'
                }`}
              >
                {done ? (
                  <>
                    <Check size={16} /> Done
                  </>
                ) : (
                  'Mark Complete'
                )}
              </button>
            </div>

            <ul className="space-y-2 text-sm">
              {day.exercises.map((ex) => (
                <li key={ex} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                  {ex}
                </li>
              ))}
            </ul>

            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="rounded-full bg-white/5 px-2.5 py-1">
                {day.stepsGoal.toLocaleString()} steps
              </span>
              <span className="rounded-full bg-white/5 px-2.5 py-1">
                {day.pushupsGoal} pushups
              </span>
            </div>
          </div>
        )
      })}

      <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-400">
        Days 6 & 7 are rest days — aim for 10k+ steps, mobility, and recovery.
      </div>
    </div>
  )
}