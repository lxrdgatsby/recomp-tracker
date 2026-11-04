import { readLocal, writeLocal } from '../lib/protocolStorageScope'

const DIET_LOG_KEY = 'lautnerDietChecks'

export function dietChecksForDate(date: string): string[] {
  const all = readDietLog()
  const ids = all[date]
  return Array.isArray(ids) ? ids.filter((id) => typeof id === 'string') : []
}

export function loadDietChecked(date: string): Record<string, boolean> {
  return Object.fromEntries(dietChecksForDate(date).map((id) => [id, true]))
}

export function saveDietChecked(date: string, checked: Record<string, boolean>): void {
  const all = readDietLog()
  all[date] = Object.entries(checked)
    .filter(([, on]) => on)
    .map(([id]) => id)
  writeLocal(DIET_LOG_KEY, JSON.stringify(all))
}

export function toggleDietMeal(date: string, mealId: string): string[] {
  const all = readDietLog()
  const current = new Set(dietChecksForDate(date))
  if (current.has(mealId)) current.delete(mealId)
  else current.add(mealId)
  const next = [...current]
  all[date] = next
  writeLocal(DIET_LOG_KEY, JSON.stringify(all))
  return next
}

function readDietLog(): Record<string, string[]> {
  try {
    const raw = readLocal(DIET_LOG_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return parsed as Record<string, string[]>
  } catch {
    return {}
  }
}
