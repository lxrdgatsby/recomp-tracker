const LAST_CHECK_IN_KEY = 'lastCheckIn'
const CHECK_IN_HISTORY_KEY = 'checkInHistory'

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
  try {
    const saved = localStorage.getItem(LAST_CHECK_IN_KEY)
    if (!saved) return null
    return JSON.parse(saved) as CheckInData
  } catch {
    return null
  }
}

export function getCheckInHistory(): CheckInData[] {
  try {
    const saved = localStorage.getItem(CHECK_IN_HISTORY_KEY)
    if (!saved) return []
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? (parsed as CheckInData[]) : []
  } catch {
    return []
  }
}