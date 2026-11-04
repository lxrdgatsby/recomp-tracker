import { readLocal, writeLocal } from '../lib/protocolStorageScope'

const WORKOUT_SET_LOGS_KEY = 'workoutSetLogs'

export interface WorkoutSetEntry {
  set: number
  weight: string
  reps: string
}

export interface ExerciseSetLog {
  exercise: string
  sets: WorkoutSetEntry[]
}

export interface WorkoutSessionLog {
  date: string
  week: number
  dayIndex: number
  focus: string
  exercises: ExerciseSetLog[]
  notes: string
  loggedAt: string
}

function sessionKey(week: number, dayIndex: number, date: string): string {
  return `${week}-${dayIndex}-${date}`
}

export function getWorkoutSetLogs(): WorkoutSessionLog[] {
  try {
    const raw = readLocal(WORKOUT_SET_LOGS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as WorkoutSessionLog[]) : []
  } catch {
    return []
  }
}

export function getWorkoutSessionLog(
  week: number,
  dayIndex: number,
  date: string
): WorkoutSessionLog | null {
  const key = sessionKey(week, dayIndex, date)
  return getWorkoutSetLogs().find((log) => sessionKey(log.week, log.dayIndex, log.date) === key) ?? null
}

export function saveWorkoutSessionLog(log: WorkoutSessionLog): void {
  try {
    const key = sessionKey(log.week, log.dayIndex, log.date)
    const existing = getWorkoutSetLogs().filter(
      (entry) => sessionKey(entry.week, entry.dayIndex, entry.date) !== key
    )
    writeLocal(
      WORKOUT_SET_LOGS_KEY,
      JSON.stringify([...existing, log])
    )
  } catch {
    // ignore quota errors
  }
}

/** Set rows to open in Log Sets. A 3–4× range uses the top count. */
export function prescribedSetCount(exercise: string): number {
  const range = exercise.match(/(\d+)\s*[–-]\s*(\d+)\s*[×x]/i)
  if (range) return Number(range[2])
  const sets = exercise.match(/(\d+)\s*[×x]/i)
  if (!sets) return 3
  return Math.min(12, Math.max(1, Number(sets[1])))
}

export function buildEmptyExerciseLogs(exercises: string[]): ExerciseSetLog[] {
  return exercises.map((exercise) => ({
    exercise,
    sets: Array.from({ length: prescribedSetCount(exercise) }, (_, index) => ({
      set: index + 1,
      weight: '',
      reps: '',
    })),
  }))
}