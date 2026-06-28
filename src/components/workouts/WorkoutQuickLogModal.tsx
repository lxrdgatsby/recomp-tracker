import { useEffect, useState } from 'react'
import type { WorkoutDay } from '../../types'
import {
  getWorkoutQuickLog,
  saveWorkoutQuickLog,
} from '../../utils/workoutLogStorage'

const TEXTAREA_CLASS =
  'h-32 w-full resize-none rounded-2xl border border-white/20 bg-white/5 p-4 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none'

interface WorkoutQuickLogModalProps {
  day: WorkoutDay
  date: string
  week: number
  onClose: () => void
  onSaved?: () => void
}

export function WorkoutQuickLogModal({
  day,
  date,
  week,
  onClose,
  onSaved,
}: WorkoutQuickLogModalProps) {
  const [sets, setSets] = useState('')

  useEffect(() => {
    const saved = getWorkoutQuickLog(week, day.dayIndex, date)
    setSets(saved?.sets ?? '')
  }, [day, date, week])

  const handleSave = () => {
    if (!sets.trim()) return

    saveWorkoutQuickLog({
      date,
      week,
      dayIndex: day.dayIndex,
      day: day.label,
      workout: day.focus,
      sets: sets.trim(),
      loggedAt: new Date().toISOString(),
    })
    onSaved?.()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111] p-6">
        <h3 className="mb-1 text-xl font-semibold">Log {day.focus}</h3>
        <p className="mb-4 text-xs text-slate-400">
          {day.label} · Week {week}
        </p>
        <textarea
          value={sets}
          onChange={(e) => setSets(e.target.value)}
          placeholder="e.g. Bench 4x8 @ 185lbs, OHP 3x10 @ 95lbs"
          className={TEXTAREA_CLASS}
          autoFocus
        />
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-white/20 py-3 text-sm transition-colors hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!sets.trim()}
            className="flex-1 rounded-2xl bg-emerald-500 py-3 text-sm font-medium text-black transition-colors hover:bg-emerald-600 disabled:opacity-40"
          >
            Save Log
          </button>
        </div>
      </div>
    </div>
  )
}