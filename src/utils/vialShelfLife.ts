import type { Vial } from '../types/v2'

/** Refrigerated BAC mix window after the vial is opened. */
export const RECONSTITUTED_SHELF_LIFE_DAYS = 28

export function todayIso(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function formatVialDate(iso?: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return '—'
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function validIso(value?: string | null): string | null {
  const iso = (value || '').slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : null
}

export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  const date = new Date(y, (m ?? 1) - 1, d ?? 1)
  date.setDate(date.getDate() + days)
  return todayIso(date)
}

export function openedDateOf(vial: { mixedDate?: string; isPowder?: boolean }): string | null {
  if (vial.isPowder) return null
  return validIso(vial.mixedDate)
}

export function expirationForOpened(opened?: string | null): string | null {
  const iso = validIso(opened)
  if (!iso) return null
  return addDaysIso(iso, RECONSTITUTED_SHELF_LIFE_DAYS)
}

export function daysUntil(target: string, today: string): number {
  const [y1, m1, d1] = target.slice(0, 10).split('-').map(Number)
  const [y2, m2, d2] = today.slice(0, 10).split('-').map(Number)
  const end = Date.UTC(y1, (m1 ?? 1) - 1, d1 ?? 1)
  const start = Date.UTC(y2, (m2 ?? 1) - 1, d2 ?? 1)
  return Math.round((end - start) / 86_400_000)
}

export type ShelfLife = {
  openedIso: string | null
  expiresIso: string | null
  openedLabel: string
  expiresLabel: string | null
  statusLabel: string | null
  expired: boolean
}

export function shelfStatusLabel(days: number): string {
  if (days < 0) return 'Expired'
  if (days === 1) return '1 day left'
  return `${days} days left`
}

export function describeShelfLife(
  vial: { mixedDate?: string; isPowder?: boolean },
  today = todayIso()
): ShelfLife {
  const openedIso = openedDateOf(vial)
  if (!openedIso) {
    return {
      openedIso: null,
      expiresIso: null,
      openedLabel: '—',
      expiresLabel: null,
      statusLabel: null,
      expired: false,
    }
  }
  const expiresIso = expirationForOpened(openedIso) as string
  const days = daysUntil(expiresIso, today)
  return {
    openedIso,
    expiresIso,
    openedLabel: formatVialDate(openedIso),
    expiresLabel: formatVialDate(expiresIso),
    statusLabel: shelfStatusLabel(days),
    expired: days < 0,
  }
}

/** Persist the derived expiration. Powder vials have no opened date. */
export function withShelfLife<T extends Pick<Vial, 'mixedDate' | 'isPowder'> & { expiresOn?: string }>(
  vial: T
): T {
  const opened = openedDateOf(vial)
  return {
    ...vial,
    expiresOn: opened ? expirationForOpened(opened) ?? undefined : undefined,
  }
}
