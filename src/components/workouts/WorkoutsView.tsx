import { differenceInDays, parseISO } from 'date-fns'
import { Check } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { TrackerState, WorkoutDay, WorkoutWeek } from '../../types'
import {
  LAUTNER_HOW_TO,
  LAUTNER_RULES,
  LAUTNER_WEEK_END,
  isLautnerWeek,
  lautnerSessionDate,
  lautnerWeek,
} from '../../lib/lautnerPlan'
import { getWorkoutDate, WORKOUT_PLAN } from '../../utils/workoutPlan'
import { getWorkoutQuickLog } from '../../utils/workoutLogStorage'
import { getWorkoutSessionLog } from '../../utils/workoutSetStorage'
import { Card } from '../ui/Card'
import { WorkoutLogModal } from './WorkoutLogModal'
import { WorkoutQuickLogModal } from './WorkoutQuickLogModal'

interface LogModalState {
  day: WorkoutDay
  date: string
  week: number
}

interface WorkoutsViewProps {
  state: TrackerState
  onToggleWorkout: (date: string, week: number, dayIndex: number) => void
  lautner?: boolean
}

function getCurrentWeek(startDate: string, maxWeek: number): number {
  const offset = differenceInDays(new Date(), parseISO(startDate))
  if (offset < 0) return 1
  return Math.min(Math.floor(offset / 7) + 1, maxWeek)
}

function weekPlanFor(week: number, lautner: boolean): WorkoutWeek {
  if (lautner && isLautnerWeek(week)) return lautnerWeek(week)
  return WORKOUT_PLAN.find((item) => item.week === week) ?? WORKOUT_PLAN[0]
}

export function WorkoutsView({ state, onToggleWorkout, lautner = false }: WorkoutsViewProps) {
  const { profile, workoutCompletions, recompPlan } = state
  const maxWeek = lautner ? LAUTNER_WEEK_END : WORKOUT_PLAN.length
  const weeks = Array.from({ length: maxWeek }, (_, index) => index + 1)
  const [selectedWeek, setSelectedWeek] = useState(() =>
    getCurrentWeek(profile.startDate, maxWeek)
  )

  useEffect(() => {
    setSelectedWeek(getCurrentWeek(profile.startDate, maxWeek))
  }, [lautner, profile.startDate, maxWeek])
  const [logModal, setLogModal] = useState<LogModalState | null>(null)
  const [quickLogModal, setQuickLogModal] = useState<LogModalState | null>(null)
  const [logsVersion, setLogsVersion] = useState(0)

  const bulkWeek = lautner && isLautnerWeek(selectedWeek)
  const weekPlan = weekPlanFor(selectedWeek, lautner)

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
        {bulkWeek
          ? 'Lautner bulk · 5 days · stop by 5 PM · cardio ≤ 20 min'
          : '5 on • 2 off • Progressive overload'}
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
          {weeks.map((week) => (
            <option key={week} value={week}
            >
              Week {week}
            </option>
          ))}
        </select>
      </div>

      <p className="mb-3 text-xs leading-snug text-emerald-400/90 sm:mb-4 sm:text-sm">
        <span className="font-medium text-emerald-400">Week {selectedWeek}:</span>{' '}
        {weekPlan.progressionNote}
      </p>

      <div className="mb-4 hidden flex-wrap gap-1.5 sm:mb-6 sm:flex">
        {weeks.map((week) => (
          <button
            key={week}
            type="button"
            onClick={() => setSelectedWeek(week)}
            className={`rounded-lg px-2.5 py-1.5 text-center text-xs font-medium transition-colors ${selectedWeek === week
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            {week}
          </button>
        ))}
      </div>

      {weekPlan.days.map((day) => {
        const date = bulkWeek
          ? lautnerSessionDate(profile.startDate, selectedWeek, day.dayIndex)
          : getWorkoutDate(profile.startDate, selectedWeek, day.dayIndex)
        const done = isComplete(date, selectedWeek, day.dayIndex)
        void logsVersion
        const hasSetLog = !!getWorkoutSessionLog(selectedWeek, day.dayIndex, date)
        const hasQuickLog = !!getWorkoutQuickLog(selectedWeek, day.dayIndex, date)

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
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <button
                  type="button"
                  onClick={() =>
                    setQuickLogModal({ day, date, week: selectedWeek })
                  }
                  className={`flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-all sm:rounded-2xl sm:px-5 ${hasQuickLog
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-emerald-500 text-black hover:bg-emerald-600'
                  }`}
                >
                  {hasQuickLog ? 'Edit Log' : 'Log Workout'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setLogModal({ day, date, week: selectedWeek })
                  }
                  className={`flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium transition-all sm:rounded-2xl sm:px-5 ${hasSetLog
                      ? 'border-white/20 bg-white/10 text-slate-200'
                      : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {hasSetLog ? 'Edit Sets' : 'Log Sets'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onToggleWorkout(date, selectedWeek, day.dayIndex)
                  }
                  className={`flex items-center justify-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium transition-all sm:rounded-2xl sm:px-5 ${done
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
            </div>

            <ul className="space-y-1.5 text-xs sm:space-y-2 sm:text-sm">
              {day.exercises.map((ex) => (
                <li key={ex} className="flex items-start gap-2 break-words">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                  <span className="min-w-0">{ex}</span>
                </li>
              ))}
            </ul>

            {bulkWeek && (
              <p className="mt-2 text-[11px] leading-relaxed text-slate-500 sm:text-xs">
                12:45 PM · Lifting block 50 min max · Abs 15 min · Stretching 10 min · ~75 min total
              </p>
            )}

            {hasQuickLog && (
              <p className="mt-3 rounded-2xl bg-black/30 p-3 text-xs leading-relaxed text-slate-400 sm:text-sm">
                {getWorkoutQuickLog(selectedWeek, day.dayIndex, date)?.sets}
              </p>
            )}

            {day.notes && (
              <p className="mt-3 text-[11px] leading-relaxed text-slate-500 sm:text-xs">{day.notes}</p>
            )}

            {(day.stepsGoal > 0 || day.pushupsGoal > 0) && (
              <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-slate-500 sm:mt-4 sm:gap-2 sm:text-xs">
                {day.stepsGoal > 0 && (
                  <span className="rounded-full bg-white/5 px-2 py-0.5 sm:px-2.5 sm:py-1">
                    {day.stepsGoal.toLocaleString()} steps
                  </span>
                )}
                {day.pushupsGoal > 0 && (
                  <span className="rounded-full bg-white/5 px-2 py-0.5 sm:px-2.5 sm:py-1">
                    {day.pushupsGoal} pushups
                  </span>
                )}
              </div>
            )}
          </div>
        )
      })}

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-400 sm:rounded-3xl sm:p-5 sm:text-sm">
        {bulkWeek
          ? 'Saturday and Sunday are off. Do not train past 5 PM. Cardio stays at or under 20 minutes.'
          : 'Days 6 & 7 are rest days — aim for 10k+ steps, mobility, and recovery.'}
      </div>

      {bulkWeek && (
        <div className="mt-4 rounded-2xl border border-[#c6a15b]/30 bg-[#c6a15b]/10 p-4 text-xs leading-relaxed text-[#f3ead8]">
          <div className="mb-2 font-medium">Yuam's three rules</div>
          <ul className="space-y-1.5">
            {LAUTNER_RULES.slice(0, 3).map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
          <div className="mt-4 border-t border-white/10 pt-3">
            <div className="mb-2 font-medium">How to follow them</div>
            <ul className="space-y-2">
              {LAUTNER_HOW_TO.map((step) => (
                <li key={step} className="leading-relaxed">{step}</li>
              ))}
            </ul>
          </div>
          <Link to="/app/diet" className="mt-3 inline-block text-emerald-400">
            Diet · 3,200 kcal / 186 P / 93 F / 330 C
          </Link>
        </div>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card title="Nutrition">
          <ul className="space-y-2 text-sm text-slate-400">
            {(recompPlan?.nutritionNotes ?? [
              'High protein to preserve muscle during deficit.',
              'Weigh weekly and adjust calories to hit loss target.',
            ]).map((note) => (
              <li key={note}>· {note}</li>
            ))}
          </ul>
        </Card>
        <Card title="Training">
          <ul className="space-y-2 text-sm text-slate-400">
            {(recompPlan?.trainingNotes ?? [
              '5 training days / 2 rest with 10k steps daily.',
            ]).map((note) => (
              <li key={note}>· {note}</li>
            ))}
          </ul>
          {recompPlan?.checkInCadence && (
            <p className="mt-3 text-xs text-slate-500">{recompPlan.checkInCadence}</p>
          )}
        </Card>
      </div>

      {quickLogModal && (
        <WorkoutQuickLogModal
          day={quickLogModal.day}
          date={quickLogModal.date}
          week={quickLogModal.week}
          onClose={() => setQuickLogModal(null)}
          onSaved={() => setLogsVersion((v) => v + 1)}
        />
      )}

      {logModal && (
        <WorkoutLogModal
          day={logModal.day}
          date={logModal.date}
          week={logModal.week}
          onClose={() => setLogModal(null)}
          onSaved={() => setLogsVersion((v) => v + 1)}
        />
      )}
    </div>
  )
}
