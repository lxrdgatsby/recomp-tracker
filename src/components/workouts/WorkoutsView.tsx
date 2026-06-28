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
    <div className="min-w-0 max-w-full overflow-hidden pb-8 text-white">
      <h1 className="mb-1 text-2xl font-semibold sm:text-3xl">Workouts</h1>
      <p className="mb-2 text-xs text-slate-400 sm:text-sm">
        5 on • 2 off • Progressive overload
      </p>

      <div className="mb-3 flex items-center gap-2 sm:hidden">
        <label htmlFor="workout-week" className="shrink-0 text-xs text-slate-500">
          Week
        </label>
        <select
          id="workout-week"
          value={selectedWeek}
          onChange={(e) => setSelectedWeek(Number(e.target.value))}
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-500/50 focus:outline-none"
        >
          {WORKOUT_PLAN.map((w) => (
            <option key={w.week} value={w.week}>
              Week {w.week}
            </option>
          ))}
        </select>
      </div>

      <p className="mb-3 text-xs leading-snug text-emerald-400/90 sm:mb-4 sm:text-sm">
        <span className="font-medium text-emerald-400">Week {selectedWeek}:</span>{' '}
        {weekPlan.progressionNote}
      </p>

      <div className="mb-4 hidden flex-wrap gap-1.5 sm:mb-6 sm:flex">
        {WORKOUT_PLAN.map((w) => (
          <button
            key={w.week}
            type="button"
            onClick={() => setSelectedWeek(w.week)}
            className={`rounded-lg px-2.5 py-1.5 text-center text-xs font-medium transition-colors ${
              selectedWeek === w.week
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            {w.week}
          </button>
        ))}
      </div>

      {weekPlan.days.map((day) => {
        const date = getWorkoutDate(profile.startDate, selectedWeek, day.dayIndex)
        const done = isComplete(date, selectedWeek, day.dayIndex)

        return (
          <div
            key={day.dayIndex}
            className="mb-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:mb-4 sm:rounded-3xl sm:p-6"
          >
            <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
              <div className="min-w-0">
                <div className="text-xs text-emerald-400 sm:text-sm">{day.label}</div>
                <div className="text-lg font-semibold sm:text-xl">{day.focus}</div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onToggleWorkout(date, selectedWeek, day.dayIndex)
                }
                className={`flex w-full items-center justify-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium transition-all sm:w-auto sm:rounded-2xl sm:px-5 ${
                  done
                    ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-400'
                    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-500/20'
                }`}
              >
                {done ? (
                  <>
                    <Check size={16} /> Done
                  </>
                ) : (
                  'Complete'
                )}
              </button>
            </div>

            <ul className="space-y-1.5 text-xs sm:space-y-2 sm:text-sm">
              {day.exercises.map((ex) => (
                <li key={ex} className="flex items-start gap-2 break-words">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                  <span className="min-w-0">{ex}</span>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-slate-500 sm:mt-4 sm:gap-2 sm:text-xs">
              <span className="rounded-full bg-white/5 px-2 py-0.5 sm:px-2.5 sm:py-1">
                {day.stepsGoal.toLocaleString()} steps
              </span>
              <span className="rounded-full bg-white/5 px-2 py-0.5 sm:px-2.5 sm:py-1">
                {day.pushupsGoal} pushups
              </span>
            </div>
          </div>
        )
      })}

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-400 sm:rounded-3xl sm:p-5 sm:text-sm">
        Days 6 & 7 are rest days — aim for 10k+ steps, mobility, and recovery.
      </div>
    </div>
  )
}