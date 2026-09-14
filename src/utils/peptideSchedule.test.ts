import { describe, expect, it } from 'vitest'
import { buildLxrdgatsbyStack } from '../lib/protocolSeed'
import { getTitrationForDay } from './recompProtocol'
import {
  getHistoryRangeDates,
  getInjectionsForDate,
  getPlanEndDate,
} from './peptideSchedule'

describe('getHistoryRangeDates', () => {
  it('7 Days is today plus the next 6 days, not yesterday', () => {
    const dates = getHistoryRangeDates('2026-08-23', 7, new Date(2026, 8, 14))
    expect(dates).toEqual([
      '2026-09-14',
      '2026-09-15',
      '2026-09-16',
      '2026-09-17',
      '2026-09-18',
      '2026-09-19',
      '2026-09-20',
    ])
    expect(dates).not.toContain('2026-09-13')
  })

  it('30 Days is the current calendar month, clipped to plan start/end', () => {
    const sept = getHistoryRangeDates('2026-08-23', 30, new Date(2026, 8, 14))
    expect(sept[0]).toBe('2026-09-01')
    expect(sept[sept.length - 1]).toBe('2026-09-30')
    expect(sept).toHaveLength(30)

    const aug = getHistoryRangeDates('2026-08-23', 30, new Date(2026, 7, 23))
    expect(aug[0]).toBe('2026-08-23')
    expect(aug[aug.length - 1]).toBe('2026-08-31')

    const nov = getHistoryRangeDates('2026-08-23', 30, new Date(2026, 10, 10))
    expect(nov[0]).toBe('2026-11-01')
    expect(nov[nov.length - 1]).toBe('2026-11-20')

    const oct = getHistoryRangeDates('2026-08-23', 30, new Date(2026, 9, 5))
    expect(oct).toHaveLength(31)
    expect(oct[0]).toBe('2026-10-01')
    expect(oct[oct.length - 1]).toBe('2026-10-31')
  })

  it('90 Days is that user’s start through start + 89 days', () => {
    const dates = getHistoryRangeDates('2026-08-23', 90, new Date(2026, 8, 14))
    expect(dates[0]).toBe('2026-08-23')
    expect(dates[dates.length - 1]).toBe('2026-11-20')
    expect(getPlanEndDate('2026-08-23')).toBe('2026-11-20')
    expect(dates).toHaveLength(90)
    expect(dates).toContain('2026-09-14')
  })

  it('90 Days uses another user’s start/end, not lxrdgatsby’s', () => {
    const dates = getHistoryRangeDates('2026-09-01', 90, new Date(2026, 8, 14))
    expect(dates[0]).toBe('2026-09-01')
    expect(dates[dates.length - 1]).toBe('2026-11-29')
    expect(dates).not.toContain('2026-08-23')
  })
})

describe('Injection History plan-window doses', () => {
  it('does not put 5-Amino-1MQ on cards dated before Sept 15', () => {
    const { peptides } = buildLxrdgatsbyStack('2026-08-23')
    const start = '2026-08-23'
    const dates = getHistoryRangeDates(start, 90, new Date(2026, 8, 14))
    expect(dates[0]).toBe('2026-08-23')
    expect(dates).toContain('2026-09-15')
    expect(dates[dates.length - 1]).toBe('2026-11-20')

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

  it('uses live phase doses on future 7-day cards', () => {
    const { peptides } = buildLxrdgatsbyStack('2026-08-23')
    const start = '2026-08-23'
    const dates = getHistoryRangeDates(start, 7, new Date(2026, 8, 14))

    const sept14 = getInjectionsForDate(peptides, new Date(2026, 8, 14), start)
    expect(sept14.some((s) => s.peptideId === 'amino1mq')).toBe(false)

    const sept15 = getInjectionsForDate(peptides, new Date(2026, 8, 15), start)
    expect(sept15.find((s) => s.peptideId === 'amino1mq')?.syringeUnits).toBe(15)

    const sept17 = getInjectionsForDate(peptides, new Date(2026, 8, 17), start)
    expect(sept17.find((s) => s.peptideId === 'amino1mq')?.syringeUnits).toBe(30)

    const reta = peptides.find((p) => p.id === 'retatrutide')!
    expect(
      getTitrationForDay(reta, 26, new Date(2026, 8, 19))?.syringeUnits
    ).toBe(50)
    const sept20 = getInjectionsForDate(peptides, new Date(2026, 8, 20), start)
    expect(sept20.find((s) => s.peptideId === 'retatrutide')?.syringeUnits).toBe(80)
    expect(dates[dates.length - 1]).toBe('2026-09-20')
  })
})
