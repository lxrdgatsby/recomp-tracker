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
    const raw = localStorage.getItem(WORKOUT_SET_LOGS_KEY)
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
    localStorage.setItem(
      WORKOUT_SET_LOGS_KEY,
      JSON.stringify([...existing, log])
    )
  } catch {
    // ignore quota errors
  }
}

export function buildEmptyExerciseLogs(exercises: string[]): ExerciseSetLog[] {
  return exercises.map((exercise) => ({
    exercise,
    sets: [1, 2, 3].map((set) => ({ set, weight: '', reps: '' })),
  }))
}