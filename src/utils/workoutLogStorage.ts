const WORKOUT_LOGS_KEY = 'workoutLogs'

export interface WorkoutQuickLog {
  date: string
  week: number
  dayIndex: number
  day: string
  workout: string
  sets: string
  loggedAt: string
}

function sessionKey(week: number, dayIndex: number, date: string): string {
  return `${week}-${dayIndex}-${date}`
}

let legacyMigrated = false

function migrateLegacyWorkoutLogs(): void {
  if (legacyMigrated) return
  legacyMigrated = true

  try {
    const raw = localStorage.getItem(WORKOUT_LOGS_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return

    const first = parsed[0]
    if (first && typeof first.dayIndex === 'number' && typeof first.week === 'number') {
      return
    }

    const migrated: WorkoutQuickLog[] = parsed
      .filter((entry) => entry && typeof entry === 'object')
      .map((entry) => ({
        date: String(entry.date ?? new Date().toISOString()),
        week: typeof entry.week === 'number' ? entry.week : 0,
        dayIndex: typeof entry.dayIndex === 'number' ? entry.dayIndex : 0,
        day: String(entry.day ?? 'Workout'),
        workout: String(entry.workout ?? entry.focus ?? 'Workout'),
        sets: String(entry.sets ?? ''),
        loggedAt: String(entry.loggedAt ?? entry.date ?? new Date().toISOString()),
      }))

    localStorage.setItem(WORKOUT_LOGS_KEY, JSON.stringify(migrated))
  } catch {
    // ignore parse errors
  }
}

export function getWorkoutLogs(): WorkoutQuickLog[] {
  migrateLegacyWorkoutLogs()
  try {
    const raw = localStorage.getItem(WORKOUT_LOGS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as WorkoutQuickLog[]) : []
  } catch {
    return []
  }
}

export function getWorkoutQuickLog(
  week: number,
  dayIndex: number,
  date: string
): WorkoutQuickLog | null {
  const key = sessionKey(week, dayIndex, date)
  return (
    getWorkoutLogs().find(
      (log) => sessionKey(log.week, log.dayIndex, log.date) === key
    ) ?? null
  )
}

export function saveWorkoutQuickLog(log: WorkoutQuickLog): void {
  migrateLegacyWorkoutLogs()
  try {
    const key = sessionKey(log.week, log.dayIndex, log.date)
    const existing = getWorkoutLogs().filter(
      (entry) => sessionKey(entry.week, entry.dayIndex, entry.date) !== key
    )
    localStorage.setItem(WORKOUT_LOGS_KEY, JSON.stringify([...existing, log]))
  } catch {
    // ignore quota errors
  }
}