const LAST_CHECK_IN_KEY = 'lastCheckIn'
const CHECK_IN_HISTORY_KEY = 'checkInHistory'
const LEGACY_CHECK_INS_KEY = 'checkIns'

let legacyMigrated = false

function migrateLegacyCheckIns(): void {
  if (legacyMigrated) return
  legacyMigrated = true

  try {
    const legacyRaw = localStorage.getItem(LEGACY_CHECK_INS_KEY)
    if (!legacyRaw) return

    const legacy = JSON.parse(legacyRaw)
    if (!Array.isArray(legacy) || legacy.length === 0) return

    const history = getCheckInHistory()
    const merged = [...history]

    for (const entry of legacy) {
      if (!entry || typeof entry !== 'object') continue
      const date = typeof entry.date === 'string' ? entry.date : ''
      if (!date) continue

      const normalized: CheckInData = {
        weight: String(entry.weight ?? ''),
        energy: String(entry.energy ?? '7'),
        hunger: String(entry.hunger ?? '5'),
        sideEffects: String(entry.sideEffects ?? ''),
        notes: String(entry.notes ?? ''),
        mood: String(entry.mood ?? 'Good'),
        date,
      }

      const dateKey = date.split('T')[0]
      const existingIdx = merged.findIndex(
        (c) => c.date.split('T')[0] === dateKey
      )
      if (existingIdx >= 0) {
        merged[existingIdx] = normalized
      } else {
        merged.push(normalized)
      }
    }

    merged.sort((a, b) => a.date.localeCompare(b.date))
    localStorage.setItem(CHECK_IN_HISTORY_KEY, JSON.stringify(merged))

    const latest = merged[merged.length - 1]
    if (latest) {
      localStorage.setItem(LAST_CHECK_IN_KEY, JSON.stringify(latest))
    }

    localStorage.removeItem(LEGACY_CHECK_INS_KEY)
  } catch {
    // ignore parse errors
  }
}

export interface CheckInData {
  weight: string
  energy: string
  hunger: string
  sideEffects: string
  notes: string
  mood: string
  date: string
}

export function saveCheckIn(data: CheckInData): void {
  migrateLegacyCheckIns()
  try {
    localStorage.setItem(LAST_CHECK_IN_KEY, JSON.stringify(data))

    const history = getCheckInHistory()
    const dateKey = data.date.split('T')[0]
    const withoutToday = history.filter(
      (entry) => entry.date.split('T')[0] !== dateKey
    )
    localStorage.setItem(
      CHECK_IN_HISTORY_KEY,
      JSON.stringify([...withoutToday, data])
    )
  } catch {
    // ignore quota errors
  }
}

export function getLastCheckIn(): CheckInData | null {
  migrateLegacyCheckIns()
  try {
    const saved = localStorage.getItem(LAST_CHECK_IN_KEY)
    if (!saved) return null
    return JSON.parse(saved) as CheckInData
  } catch {
    return null
  }
}

export function getCheckInHistory(): CheckInData[] {
  migrateLegacyCheckIns()
  try {
    const saved = localStorage.getItem(CHECK_IN_HISTORY_KEY)
    if (!saved) return []
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? (parsed as CheckInData[]) : []
  } catch {
    return []
  }
}