import { addDays, format, parseISO } from 'date-fns'
import { TOTAL_WEEKS } from '../constants/defaults'
import type { WorkoutWeek } from '../types'

const BASE_DAYS = [
  {
    dayIndex: 0,
    label: 'Day 1',
    focus: 'Push',
    exercises: ['Bench Press 4×8', 'OHP 3×10', 'Incline DB 3×12', 'Tricep Pushdowns 3×15'],
    stepsGoal: 10000,
    pushupsGoal: 100,
  },
  {
    dayIndex: 1,
    label: 'Day 2',
    focus: 'Pull',
    exercises: ['Barbell Rows 4×8', 'Lat Pulldown 3×10', 'Face Pulls 3×15', 'Barbell Curls 3×12'],
    stepsGoal: 10000,
    pushupsGoal: 100,
  },
  {
    dayIndex: 2,
    label: 'Day 3',
    focus: 'Legs',
    exercises: ['Squats 4×8', 'RDL 3×10', 'Leg Press 3×12', 'Calf Raises 4×15'],
    stepsGoal: 10000,
    pushupsGoal: 100,
  },
  {
    dayIndex: 3,
    label: 'Day 4',
    focus: 'Upper',
    exercises: ['Pull-ups 4×AMRAP', 'DB Press 3×10', 'Cable Rows 3×12', 'Lateral Raises 3×15'],
    stepsGoal: 10000,
    pushupsGoal: 100,
  },
  {
    dayIndex: 4,
    label: 'Day 5',
    focus: 'Full Body + Conditioning',
    exercises: ['Goblet Squat 3×12', 'Push-ups 5×20', 'KB Swings 4×15', '20 min incline walk'],
    stepsGoal: 10000,
    pushupsGoal: 100,
  },
]

const PROGRESSION: Record<number, string> = {
  1: 'Establish form. Leave 2–3 reps in reserve on all lifts.',
  2: 'Add 5 lbs to compounds where RPE ≤ 8. Increase pushup volume.',
  3: 'Introduce tempo (3-1-2) on main lifts. Hit 10k steps daily.',
  4: 'First deload hint: drop volume 20% if recovery lags.',
  5: 'Add a set to primary movement. Walk 12k on off days.',
  6: 'Swap accessories for variation. Track pushup total time.',
  7: 'Mid-cycle push: add 2.5–5 lbs to upper compounds.',
  8: 'Deload week — reduce sets by 30%, maintain intensity.',
  9: 'Resume progression. Focus on leg drive and bracing.',
  10: 'Increase conditioning finisher to 25 min.',
  11: 'Peak week prep: hit all 5 sessions, prioritize sleep.',
  12: 'Maintain loads, sharpen execution. Push steps to 11k.',
  13: 'Final week — consolidate gains, assess recomp progress.',
}

function varyExercises(week: number, dayIndex: number, base: string[]): string[] {
  if (week % 3 === 0 && dayIndex === 4) {
    return [...base.slice(0, 2), 'Farmer Carry 4×40m', 'Battle Ropes 8×30s', base[3]]
  }
  if (week % 2 === 0 && dayIndex === 0) {
    return base.map((e) => (e.includes('Bench') ? 'DB Bench 4×8' : e))
  }
  return base
}

export function generateWorkoutPlan(): WorkoutWeek[] {
  return Array.from({ length: TOTAL_WEEKS }, (_, i) => {
    const week = i + 1
    return {
      week,
      progressionNote: PROGRESSION[week] ?? PROGRESSION[13],
      days: BASE_DAYS.map((d) => ({
        ...d,
        exercises: varyExercises(week, d.dayIndex, d.exercises),
        notes: week >= 8 ? 'Prioritize recovery between sessions.' : undefined,
      })),
    }
  })
}

export function getWorkoutDate(startDate: string, week: number, dayIndex: number): string {
  const start = parseISO(startDate)
  const dayOffset = (week - 1) * 7 + dayIndex
  return format(addDays(start, dayOffset), 'yyyy-MM-dd')
}

export const WORKOUT_PLAN = generateWorkoutPlan()