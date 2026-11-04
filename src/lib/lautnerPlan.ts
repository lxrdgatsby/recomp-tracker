import { addDays, differenceInDays, format, getDay, parseISO } from 'date-fns'
import type { WorkoutDay, WorkoutWeek } from '../types'

/** First recomp week that uses this bulk. Weeks 1–10 stay the original plan. */
export const LAUTNER_WEEK_START = 11
export const LAUTNER_WEEK_END = 40

export const LAUTNER_RULES = [
  'Taste the weight: about 40% above your 10-rep max, lowering half only, spotter, 3×5.',
  'Vary volume between 3×8–10 and 4×15.',
  'Cardio: 20 min at 12% incline, 3 mph, after stretching on Mon/Wed/Fri only.',
  'Six meals, nothing more than 2 hours apart. Lean meats and vegetables. A cheat day is a planned refeed.',
  'Retatrutide fights the surplus. Consider tapering or pausing it during this bulk. Research-use tracking only.',
]

/** Plain-language reminder card for Yuam's three rules — read before every session. */
export const LAUTNER_HOW_TO = [
  'Rule 1 — Taste the weight: Load about 40% heavier than your normal 10-rep weight. Do NOT press it up. Only lower it slowly, 3 sets of 5, with someone spotting you. Do this every other week on your main lifts.',
  'Rule 2 — Vary volume: Switch your assistance lifts between 3 sets of 8–10 reps one week and 4 sets of 15 reps the next. Alternate so your muscles never get comfortable.',
  'Rule 3 — Cardio cap: Never do more than 20 minutes of cardio. It burns the calories you are trying to keep for muscle.',
]

type PrimaryKey = 'bench' | 'deadlift' | 'squat' | 'press'

interface Lift {
  name: string
  sets: number
  reps: string
  role: 'primary' | 'assistance' | 'finisher'
  extra?: string
  /** Shown as written, until a deload scales the set count. */
  written?: string
  primaryKey?: PrimaryKey
}

interface DayTemplate {
  dayIndex: number
  label: string
  focus: string
  lifts: Lift[]
  abs: boolean
}

const SESSION_NOTE_BASE =
  '12:45 PM start. Stretch 10 min (12:45-12:55). Lifting 50 min max (12:55-1:45). Abs 15 min (1:45-2:00). Done by 5 PM.'

const CARDIO_NOTE = 'Cardio 20 min - 12% incline, 3 mph (2:00-2:20).'

const OFF_DAY_CARDIO_NOTE = 'Off day. Do 20 min cardio - 12% incline, 3 mph, anytime today.'

const ABS: Lift[] = [
  {
    name: 'Swiss ball pikes',
    sets: 4,
    reps: '8–12',
    role: 'finisher',
    written: 'Swiss ball pikes: 3–4×8–12',
  },
  { name: 'Reverse crunches', sets: 3, reps: '15', role: 'finisher' },
  {
    name: 'Swiss ball leg curls',
    sets: 4,
    reps: '10–12',
    role: 'finisher',
    written: 'Swiss ball leg curls: 3–4×10–12',
  },
  {
    name: 'Hanging leg raises',
    sets: 3,
    reps: 'hold',
    role: 'finisher',
    written: 'Hanging leg raises: 3×hold 7–10 sec at the top',
  },
  { name: 'Prone cobra', sets: 3, reps: '60 sec', role: 'finisher' },
]

const DAYS: DayTemplate[] = [
  {
    dayIndex: 0,
    label: 'Monday',
    focus: 'Bench & Assistance',
    abs: true,
    lifts: [
      { name: 'Barbell bench press', sets: 5, reps: '5', role: 'primary', extra: 'heavy', primaryKey: 'bench' },
      { name: 'Close-grip tricep press', sets: 4, reps: '15', role: 'assistance' },
      { name: 'Dumbbell incline bench', sets: 3, reps: '8–10', role: 'assistance' },
      { name: 'Dips', sets: 4, reps: '15', role: 'assistance' },
      { name: 'Dumbbell overhead tricep extension', sets: 3, reps: '8–10', role: 'assistance' },
      { name: 'Incline chest flys', sets: 4, reps: '15', role: 'assistance', extra: 'light' },
    ],
  },
  {
    dayIndex: 1,
    label: 'Tuesday',
    focus: 'Deadlift & Assistance',
    abs: false,
    lifts: [
      { name: 'Deadlift', sets: 5, reps: '5', role: 'primary', primaryKey: 'deadlift' },
      { name: 'Cable rows', sets: 4, reps: '15', role: 'assistance' },
      { name: 'Lat pulldowns', sets: 3, reps: '8–10', role: 'assistance' },
      { name: 'T-bar rows', sets: 4, reps: '15', role: 'assistance' },
      { name: 'Dumbbell curls', sets: 3, reps: '8–10', role: 'assistance' },
      { name: 'Preacher curls', sets: 4, reps: '15', role: 'assistance' },
    ],
  },
  {
    dayIndex: 2,
    label: 'Wednesday',
    focus: 'Squats & Assistance',
    abs: true,
    lifts: [
      { name: 'Back squat', sets: 5, reps: '5', role: 'primary', primaryKey: 'squat' },
      { name: 'Weighted lunges', sets: 4, reps: '15', role: 'assistance' },
      { name: 'Leg press', sets: 3, reps: '8–10', role: 'assistance' },
      { name: 'Box jumps', sets: 4, reps: '15', role: 'assistance' },
      { name: 'Calf raises', sets: 3, reps: '8–10', role: 'assistance' },
      { name: 'Hamstring curls', sets: 4, reps: '15', role: 'assistance' },
    ],
  },
  {
    dayIndex: 3,
    label: 'Thursday',
    focus: 'Shoulders',
    abs: false,
    lifts: [
      { name: 'Military press', sets: 5, reps: '5', role: 'primary', primaryKey: 'press' },
      { name: 'Front raises', sets: 4, reps: '15', role: 'assistance' },
      { name: 'Shrugs', sets: 3, reps: '8–10', role: 'assistance' },
      { name: 'Face pulls', sets: 4, reps: '15', role: 'assistance' },
      { name: 'Arnold press', sets: 3, reps: '8–10', role: 'assistance' },
      { name: 'Dumbbell shrugs', sets: 4, reps: '15', role: 'assistance' },
    ],
  },
  {
    dayIndex: 4,
    label: 'Friday',
    focus: 'Arms & Core Finisher',
    abs: true,
    lifts: [
      {
        name: 'Arm supersets',
        sets: 4,
        reps: '10–12',
        role: 'finisher',
        extra: 'pairs back to back, no rest between exercises',
      },
    ],
  },
]

interface Scheme {
  note: string
  assistance15: boolean
  primary?: { sets: number; reps: string }
  eccentric: PrimaryKey[]
  deload: boolean
  days: 'all' | 'mwf'
}

function schemeForWeek(week: number): Scheme {
  if (week <= 12) {
    return {
      note: 'Base solidification. Keep the 3×8–10 assistance volume. Log every working weight. No new maxes.',
      assistance15: false,
      eccentric: [],
      deload: false,
      days: 'all',
    }
  }
  if (week <= 14) {
    return {
      note: 'First intensity block. Taste the weight on bench and squat. Assistance jumps to 4×15.',
      assistance15: true,
      eccentric: ['bench', 'squat'],
      deload: false,
      days: 'all',
    }
  }
  if (week === 15) {
    return {
      note: 'Volume swing. Primaries move to 4×15. Assistance stays 4×15.',
      assistance15: true,
      primary: { sets: 4, reps: '15' },
      eccentric: [],
      deload: false,
      days: 'all',
    }
  }
  if (week === 16) {
    return {
      note: 'Volume swing. Primaries drop to 3×8–10. Assistance stays 4×15.',
      assistance15: true,
      primary: { sets: 3, reps: '8–10' },
      eccentric: [],
      deload: false,
      days: 'all',
    }
  }
  if (week <= 18) {
    return {
      note:
        week % 2 === 1
          ? 'Load climb. Add 5 lbs when every set hits the top of the range. Eccentrics this week. Cardio stays at or under 20 minutes.'
          : 'Load climb. Add 5 lbs when every set hits the top of the range. No eccentrics this week. Cardio stays at or under 20 minutes.',
      assistance15: false,
      eccentric: week % 2 === 1 ? ['bench', 'deadlift', 'squat', 'press'] : [],
      deload: false,
      days: 'all',
    }
  }
  if (week <= 20) {
    return {
      note: 'Deload. Volume is cut 40%. Keep the same loads.',
      assistance15: false,
      eccentric: [],
      deload: true,
      days: 'all',
    }
  }
  if (week <= 24) {
    return {
      note: 'Second intensity block. 5×5 on primaries at the new maxes. Taste the weight on bench, deadlift, squat, and press.',
      assistance15: false,
      eccentric: ['bench', 'deadlift', 'squat', 'press'],
      deload: false,
      days: 'all',
    }
  }
  if (week <= 28) {
    const high = week % 2 === 0
    return {
      note: high
        ? 'Volume swing. Primaries are 4×15. If the weekly weigh-in average is flat, add 200 kcal.'
        : 'Volume swing. Primaries are 3×8–10. If the weekly weigh-in average is flat, add 200 kcal.',
      assistance15: true,
      primary: high ? { sets: 4, reps: '15' } : { sets: 3, reps: '8–10' },
      eccentric: [],
      deload: false,
      days: 'all',
    }
  }
  if (week <= 30) {
    return {
      note: 'Deload. Volume is cut 40%. Keep the same loads.',
      assistance15: false,
      eccentric: [],
      deload: true,
      days: 'all',
    }
  }
  if (week <= 36) {
    return {
      note: 'Peak block. Heaviest sustained loads, 2-hour sessions. Target 175–180 lbs by the end of this block.',
      assistance15: false,
      eccentric: [],
      deload: false,
      days: 'all',
    }
  }
  return {
    note: 'Cut to shoot shape. Lift Monday, Wednesday, and Friday only. Protein stays 186 g. Calories drop from the surplus to maintenance. Photos weekly.',
    assistance15: false,
    eccentric: [],
    deload: false,
    days: 'mwf',
  }
}

function formatLift(lift: Lift, scheme: Scheme): string {
  if (lift.written && !scheme.deload) return lift.written
  let sets = lift.sets
  let reps = lift.reps
  let extra = lift.extra
  if (lift.role === 'assistance' && scheme.assistance15) {
    sets = 4
    reps = '15'
  }
  if (lift.role === 'primary' && scheme.primary) {
    sets = scheme.primary.sets
    reps = scheme.primary.reps
    extra = undefined
  }
  if (scheme.deload) sets = Math.max(1, Math.round(sets * 0.6))
  const suffix = extra ? ` ${extra}` : ''
  return `${lift.name}: ${sets}×${reps}${suffix}`
}

function eccentricLine(name: string): string {
  return `Taste the weight — ${name}: 3×5 eccentric only, about 40% over the 10-rep max, spotter`
}

export function isLautnerWeek(week: number): boolean {
  return week >= LAUTNER_WEEK_START && week <= LAUTNER_WEEK_END
}

export function lautnerWeek(week: number): WorkoutWeek {
  if (!isLautnerWeek(week)) {
    throw new Error(`Lautner week ${week} is outside ${LAUTNER_WEEK_START}–${LAUTNER_WEEK_END}`)
  }
  const scheme = schemeForWeek(week)
  const templates = DAYS.filter((day) => scheme.days === 'all' || day.dayIndex % 2 === 0)
  const days: WorkoutDay[] = templates.map((day) => {
    const lifts = [...day.lifts, ...(day.abs ? ABS : [])]
    const exercises = lifts.map((lift) => formatLift(lift, scheme))
    for (const lift of day.lifts) {
      if (lift.primaryKey && scheme.eccentric.includes(lift.primaryKey)) {
        exercises.push(eccentricLine(lift.name))
      }
    }
    const isCardioDay = day.dayIndex % 2 === 0
    const notes = isCardioDay ? `${SESSION_NOTE_BASE} ${CARDIO_NOTE}` : SESSION_NOTE_BASE
    return {
      dayIndex: day.dayIndex,
      label: day.label,
      focus: day.focus,
      exercises,
      stepsGoal: 0,
      pushupsGoal: 0,
      notes,
    }
  })

  // Off days: Saturday and Sunday with cardio note
  const offDays: WorkoutDay[] = [
    {
      dayIndex: 5,
      label: 'Saturday',
      focus: 'Off Day — Cardio Day',
      exercises: [],
      stepsGoal: 0,
      pushupsGoal: 0,
      notes: OFF_DAY_CARDIO_NOTE,
    },
    {
      dayIndex: 6,
      label: 'Sunday',
      focus: 'Off Day — Cardio Day',
      exercises: [],
      pushupsGoal: 0,
      stepsGoal: 0,
      notes: OFF_DAY_CARDIO_NOTE,
    },
  ]

  return { week, progressionNote: scheme.note, days: [...days, ...offDays], howTo: LAUTNER_HOW_TO }
}

/** Monday–Friday inside the plan week that starts on `startDate`. */
export function lautnerSessionDate(startDate: string, week: number, dayIndex: number): string {
  const anchor = addDays(parseISO(startDate), (week - 1) * 7)
  let monday = anchor
  for (let i = 0; i < 7; i += 1) {
    const candidate = addDays(anchor, i)
    if (getDay(candidate) === 1) {
      monday = candidate
      break
    }
  }
  return format(addDays(monday, dayIndex), 'yyyy-MM-dd')
}

export function recompWeek(startDate: string, on: Date = new Date()): number {
  const offset = differenceInDays(on, parseISO(startDate))
  if (offset < 0) return 1
  return Math.floor(offset / 7) + 1
}
