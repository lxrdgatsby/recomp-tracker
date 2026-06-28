import { useEffect, useRef, useState } from 'react'
import {
  getLastCheckIn,
  saveCheckIn,
  type CheckInData,
} from '../../utils/checkInStorage'

const INPUT_CLASS =
  'mt-1 w-full rounded-2xl border border-white/20 bg-black/40 p-3 text-base text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none'

interface SmartCheckInProps {
  defaultWeight?: string
  onSubmit?: (data: CheckInData) => void
}

export function SmartCheckIn({ defaultWeight = '', onSubmit }: SmartCheckInProps) {
  const [form, setForm] = useState({
    weight: defaultWeight,
    energy: '7',
    hunger: '5',
    sideEffects: '',
    notes: '',
    mood: 'Good',
  })
  const [submitted, setSubmitted] = useState(false)
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const last = getLastCheckIn()
    const today = new Date().toISOString().split('T')[0]
    if (last && last.date.split('T')[0] === today) {
      setForm({
        weight: last.weight || defaultWeight,
        energy: last.energy,
        hunger: last.hunger,
        sideEffects: last.sideEffects,
        notes: last.notes,
        mood: last.mood,
      })
    }
  }, [defaultWeight])

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    }
  }, [])

  const handleSubmit = () => {
    const checkInData: CheckInData = {
      ...form,
      date: new Date().toISOString(),
    }
    saveCheckIn(checkInData)
    onSubmit?.(checkInData)
    setSubmitted(true)
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    feedbackTimerRef.current = setTimeout(() => setSubmitted(false), 2000)
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h3 className="mb-4 font-semibold">Daily Check-in</h3>

      <div className="space-y-4">
        <div>
          <label className="text-sm text-slate-400">Current Weight (lbs)</label>
          <input
            type="number"
            inputMode="decimal"
            value={form.weight}
            onChange={(e) => setForm({ ...form, weight: e.target.value })}
            className={INPUT_CLASS}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-400">Energy (1-10)</label>
            <input
              type="range"
              min="1"
              max="10"
              value={form.energy}
              onChange={(e) => setForm({ ...form, energy: e.target.value })}
              className="mt-2 w-full accent-emerald-500"
            />
            <div className="text-center text-emerald-400">{form.energy}</div>
          </div>
          <div>
            <label className="text-sm text-slate-400">Hunger (1-10)</label>
            <input
              type="range"
              min="1"
              max="10"
              value={form.hunger}
              onChange={(e) => setForm({ ...form, hunger: e.target.value })}
              className="mt-2 w-full accent-emerald-500"
            />
            <div className="text-center text-emerald-400">{form.hunger}</div>
          </div>
        </div>

        <div>
          <label className="text-sm text-slate-400">Side Effects / Notes</label>
          <textarea
            value={form.sideEffects}
            onChange={(e) => setForm({ ...form, sideEffects: e.target.value })}
            className={`${INPUT_CLASS} h-20 resize-none`}
            placeholder="Any side effects today?"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        className="mt-6 w-full rounded-2xl bg-emerald-500 py-3.5 font-medium text-black transition-colors hover:bg-emerald-600"
      >
        {submitted ? 'Check-in Saved ✓' : 'Submit Check-in'}
      </button>
    </div>
  )
}

export default SmartCheckIn