import { describe, expect, it } from 'vitest'
import { buildLxrdgatsbyStack } from '../lib/protocolSeed'
import {
  getInjectionsForDate,
  getRecentScheduleDates,
} from './peptideSchedule'

describe('getRecentScheduleDates', () => {
  it('returns the last 7 dated cards ending today, not before plan start', () => {
    const today = new Date(2026, 8, 14)
    const dates = getRecentScheduleDates('2026-08-23', 7, today)
    expect(dates[0]).toBe('2026-09-08')
    expect(dates[dates.length - 1]).toBe('2026-09-14')
    expect(dates).toHaveLength(7)
  })

  it('90 Days from Aug 23 2026 through today includes the cycle start', () => {
    const today = new Date(2026, 8, 14)
    const dates = getRecentScheduleDates('2026-08-23', 90, today)
    expect(dates[0]).toBe('2026-08-23')
    expect(dates[dates.length - 1]).toBe('2026-09-14')
    expect(dates).toContain('2026-08-23')
    expect(dates).toContain('2026-09-14')
  })

  it('uses last 90 calendar days when there is no start date', () => {
    const today = new Date(2026, 8, 14)
    const dates = getRecentScheduleDates('', 90, today)
    expect(dates).toHaveLength(90)
    expect(dates[0]).toBe('2026-06-17')
    expect(dates[dates.length - 1]).toBe('2026-09-14')
  })
})

describe('Injection History 90-day cards', () => {
  it('does not put 5-Amino-1MQ on cards dated before Sept 15', () => {
    const { peptides } = buildLxrdgatsbyStack('2026-08-23')
    const start = '2026-08-23'
    const dates = getRecentScheduleDates(start, 90, new Date(2026, 8, 20))
    expect(dates[0]).toBe('2026-08-23')
    expect(dates).toContain('2026-09-15')

    for (const dateStr of dates) {
      const [y, m, d] = dateStr.split('-').map(Number)
      const shots = getInjectionsForDate(
        peptides,
        new Date(y, m - 1, d),
        start
      )
      const hasAmino = shots.some((s) => s.peptideId === 'amino1mq')
      if (dateStr < '2026-09-15') expect(hasAmino).toBe(false)
      else expect(hasAmino).toBe(true)
    }
  })
})
