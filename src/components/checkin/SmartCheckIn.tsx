import { useEffect, useRef, useState } from 'react'
import type { CheckInCadence, Profile } from '../../types'
import {
  CHECK_IN_SCHEDULE_CHANGED,
  WEEKDAY_LONG,
  WEEKDAY_SHORT,
  getCheckInSchedule,
  hasWeighInLoggedToday,
  isWeighInDay,
  laCalendarDate,
  saveCheckInSchedule,
  syncCheckInScheduleFromProfile,
  type CheckInSchedule,
} from '../../utils/checkInSchedule'
import {
  getLastCheckIn,
  saveCheckIn,
  type CheckInData,
} from '../../utils/checkInStorage'
import {
  markWeighInFired,
  scheduleWeighInReminders,
  setWeighInReminderEnabled,
} from '../../utils/weighInReminders'

const INPUT_CLASS =
  'mt-1 w-full rounded-2xl border border-white/20 bg-black/40 p-3 text-base text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none'

const PILL_BASE =
  'flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors'
const CHIP_BASE =
  'rounded-full px-2 py-1 text-xs font-medium transition-colors'

interface SmartCheckInProps {
  defaultWeight?: string
  profile?: Profile
  onSubmit?: (data: CheckInData) => void
  onScheduleChange?: (schedule: CheckInSchedule) => void
  /** Extra vitals for one clinical plan. Hidden for everyone else. */
  clinicalTracking?: boolean
}

const EMPTY_CLINICAL = {
  doseMg: '',
  doseUnits: '',
  doseSite: '',
  bloodPressure: '',
  heartRate: '',
  waterLiters: '',
  proteinGrams: '',
  giScore: '',
  urineColor: '',
  flankPain: '',
  steps: '',
  resistanceSessions: '',
}

export function SmartCheckIn({
  defaultWeight = '',
  profile,
  onSubmit,
  onScheduleChange,
  clinicalTracking = false,
}: SmartCheckInProps) {
  const [form, setForm] = useState({
    weight: defaultWeight,
    energy: '7',
    hunger: '5',
    sideEffects: '',
    notes: '',
    mood: 'Good',
  })
  const [clinical, setClinical] = useState(EMPTY_CLINICAL)
  const [submitted, setSubmitted] = useState(false)
  const [schedule, setSchedule] = useState<CheckInSchedule>(() =>
    syncCheckInScheduleFromProfile(profile)
  )
  const [deniedNote, setDeniedNote] = useState(false)
  const [reminderBusy, setReminderBusy] = useState(false)
  const [loggedToday, setLoggedToday] = useState(() => hasWeighInLoggedToday())
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
    if (!clinicalTracking) return
    const last = getLastCheckIn()
    if (!last) return
    setClinical({
      doseMg: last.doseMg ?? '',
      doseUnits: last.doseUnits ?? '',
      doseSite: last.doseSite ?? '',
      bloodPressure: last.bloodPressure ?? '',
      heartRate: last.heartRate ?? '',
      waterLiters: last.waterLiters ?? '',
      proteinGrams: last.proteinGrams ?? '',
      giScore: last.giScore ?? '',
      urineColor: last.urineColor ?? '',
      flankPain: last.flankPain ?? '',
      steps: last.steps ?? '',
      resistanceSessions: last.resistanceSessions ?? '',
    })
  }, [clinicalTracking])

  useEffect(() => {
    const sync = () => {
      setSchedule(getCheckInSchedule(profile))
      setLoggedToday(hasWeighInLoggedToday())
    }
    window.addEventListener(CHECK_IN_SCHEDULE_CHANGED, sync)
    return () => window.removeEventListener(CHECK_IN_SCHEDULE_CHANGED, sync)
  }, [profile])

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    }
  }, [])

  const commitSchedule = (next: CheckInSchedule) => {
    const saved = saveCheckInSchedule(next)
    setSchedule(saved)
    onScheduleChange?.(saved)
    void scheduleWeighInReminders()
  }

  const setCadence = (cadence: CheckInCadence) => {
    commitSchedule({ ...schedule, cadence })
  }

  const setWeighInDay = (day: number) => {
    commitSchedule({ ...schedule, weeklyWeighInDay: day })
  }

  const toggleReminder = async () => {
    setReminderBusy(true)
    try {
      const enabling = !schedule.reminderEnabled
      if (!enabling) {
        commitSchedule({ ...schedule, reminderEnabled: false })
        setDeniedNote(false)
        await setWeighInReminderEnabled(false)
        return
      }
      commitSchedule({ ...schedule, reminderEnabled: true })
      const permission = await setWeighInReminderEnabled(true)
      if (permission === 'granted') {
        setDeniedNote(false)
      } else {
        commitSchedule({ ...schedule, reminderEnabled: false })
        setDeniedNote(true)
      }
    } finally {
      setReminderBusy(false)
    }
  }

  const handleSubmit = () => {
    const checkInData: CheckInData = {
      ...form,
      ...(clinicalTracking ? clinical : {}),
      date: new Date().toISOString(),
    }
    saveCheckIn(checkInData)
    onSubmit?.(checkInData)
    setSubmitted(true)
    setLoggedToday(true)
    if (isWeighInDay(schedule)) {
      markWeighInFired(laCalendarDate(new Date()))
      void scheduleWeighInReminders()
    }
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    feedbackTimerRef.current = setTimeout(() => setSubmitted(false), 2000)
  }

  const weekly = schedule.cadence === 'weekly'
  const weighInDayName = WEEKDAY_LONG[schedule.weeklyWeighInDay] ?? 'Sunday'
  const showBanner =
    schedule.reminderEnabled && isWeighInDay(schedule) && !loggedToday

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h3 className="mb-4 font-semibold">
        {weekly ? 'Weekly Check-in' : 'Daily Check-in'}
      </h3>

      {showBanner && (
        <p className="mb-4 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-200">
          Weigh-in today — log your weight below.
        </p>
      )}

      <div className="mb-5 space-y-4">
        <div>
          <p className="text-sm text-slate-400">Check-in schedule</p>
          <div className="mt-2 flex gap-2 rounded-full bg-black/30 p-1">
            {(['daily', 'weekly'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setCadence(option)}
                className={`${PILL_BASE} ${
                  schedule.cadence === option
                    ? 'bg-emerald-500 text-black'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                {option === 'daily' ? 'Daily' : 'Weekly'}
              </button>
            ))}
          </div>
        </div>

        {weekly && (
          <div>
            <p className="text-sm text-slate-400">Weigh-in day</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {WEEKDAY_SHORT.map((label, day) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setWeighInDay(day)}
                  className={`${CHIP_BASE} ${
                    schedule.weeklyWeighInDay === day
                      ? 'bg-emerald-500 text-black'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Log weight on {weighInDayName} each week.
            </p>
          </div>
        )}

        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-white">Remind me to weigh in</p>
            <p className="mt-0.5 text-xs text-slate-500">
              7:00 AM {weekly ? `on ${weighInDayName}s` : 'every morning'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={schedule.reminderEnabled}
            aria-label="Remind me to weigh in"
            disabled={reminderBusy}
            onClick={() => void toggleReminder()}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center overflow-hidden rounded-full border-0 p-0 transition disabled:opacity-50 ${
              schedule.reminderEnabled ? 'bg-emerald-500' : 'bg-zinc-700'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                schedule.reminderEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        {deniedNote && (
          <p className="text-xs leading-relaxed text-amber-200/90">
            Enable notifications in iPhone Settings → PeptideTracker to get
            weigh-in reminders.
          </p>
        )}
      </div>

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

        {clinicalTracking ? (
          <div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-sm text-slate-300">
              Clinical log. Investigational tracking — not a prescription.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(
                [
                  ['doseMg', 'Dose (mg)', '0.5'],
                  ['doseUnits', 'Units', '10'],
                  ['doseSite', 'Site', 'Abdomen, rotate'],
                  ['bloodPressure', 'BP (SBP/DBP)', '120/80'],
                  ['heartRate', 'HR seated/standing', '60 / 72'],
                  ['waterLiters', 'Water (L)', '2.5–3'],
                  ['proteinGrams', 'Protein (g)', '100–120'],
                  ['giScore', 'GI score', '0–10'],
                  ['urineColor', 'Urine color', 'Pale'],
                  ['steps', 'Steps', ''],
                  ['resistanceSessions', 'Resistance sessions', '0–1'],
                ] as const
              ).map(([key, label, placeholder]) => (
                <div key={key}>
                  <label className="text-sm text-slate-400">{label}</label>
                  <input
                    value={clinical[key]}
                    placeholder={placeholder}
                    onChange={(e) =>
                      setClinical((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    className={INPUT_CLASS}
                  />
                </div>
              ))}
              <div>
                <p className="text-sm text-slate-400">Flank pain</p>
                <div className="mt-1 flex gap-2">
                  {(['no', 'yes'] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setClinical((prev) => ({ ...prev, flankPain: value }))
                      }
                      className={`rounded-full px-4 py-2 text-sm ${
                        clinical.flankPain === value
                          ? 'bg-emerald-500 text-black'
                          : 'bg-black/40 text-slate-300'
                      }`}
                    >
                      {value === 'yes' ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
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
