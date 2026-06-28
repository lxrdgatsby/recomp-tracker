import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { WorkoutDay } from '../../types'
import {
  buildEmptyExerciseLogs,
  getWorkoutSessionLog,
  saveWorkoutSessionLog,
  type ExerciseSetLog,
} from '../../utils/workoutSetStorage'

const INPUT_CLASS =
  'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none'

interface WorkoutLogModalProps {
  day: WorkoutDay
  date: string
  week: number
  onClose: () => void
  onSaved?: () => void
}

export function WorkoutLogModal({
  day,
  date,
  week,
  onClose,
  onSaved,
}: WorkoutLogModalProps) {
  const [exercises, setExercises] = useState<ExerciseSetLog[]>(() =>
    buildEmptyExerciseLogs(day.exercises)
  )
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const saved = getWorkoutSessionLog(week, day.dayIndex, date)
    if (saved) {
      setExercises(saved.exercises)
      setNotes(saved.notes)
    } else {
      setExercises(buildEmptyExerciseLogs(day.exercises))
      setNotes('')
    }
  }, [day, date, week])

  const updateSet = (
    exerciseIndex: number,
    setIndex: number,
    field: 'weight' | 'reps',
    value: string
  ) => {
    setExercises((prev) =>
      prev.map((ex, ei) =>
        ei !== exerciseIndex
          ? ex
          : {
              ...ex,
              sets: ex.sets.map((s, si) =>
                si !== setIndex ? s : { ...s, [field]: value }
              ),
            }
      )
    )
  }

  const handleSave = () => {
    saveWorkoutSessionLog({
      date,
      week,
      dayIndex: day.dayIndex,
      focus: day.focus,
      exercises,
      notes,
      loggedAt: new Date().toISOString(),
    })
    onSaved?.()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-white/10 bg-[#0a0a0a]">
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 p-4">
          <div>
            <h3 className="text-lg font-semibold">Log Sets</h3>
            <p className="text-xs text-slate-400">
              {day.label} · {day.focus} · Week {week}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/10"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {exercises.map((exercise, exerciseIndex) => (
            <div
              key={exercise.exercise}
              className="rounded-2xl border border-white/10 bg-white/5 p-3"
            >
              <div className="mb-2 text-sm font-medium">{exercise.exercise}</div>
              <div className="space-y-2">
                {exercise.sets.map((set, setIndex) => (
                  <div key={set.set} className="grid grid-cols-[2rem_1fr_1fr] items-center gap-2">
                    <span className="text-xs text-slate-500">#{set.set}</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="lbs"
                      value={set.weight}
                      onChange={(e) =>
                        updateSet(exerciseIndex, setIndex, 'weight', e.target.value)
                      }
                      className={INPUT_CLASS}
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="reps"
                      value={set.reps}
                      onChange={(e) =>
                        updateSet(exerciseIndex, setIndex, 'reps', e.target.value)
                      }
                      className={INPUT_CLASS}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div>
            <label className="text-xs text-slate-400">Session notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="RPE, form cues, how it felt..."
              className={`${INPUT_CLASS} mt-1 h-20 resize-none`}
            />
          </div>
        </div>

        <div className="shrink-0 border-t border-white/10 p-4">
          <button
            type="button"
            onClick={handleSave}
            className="w-full rounded-2xl bg-emerald-500 py-3.5 font-medium text-black transition-colors hover:bg-emerald-600"
          >
            Save Sets
          </button>
        </div>
      </div>
    </div>
  )
}