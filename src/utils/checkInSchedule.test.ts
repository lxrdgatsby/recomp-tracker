import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { saveCheckIn } from './checkInStorage'
import {
  DEFAULT_CHECK_IN_SCHEDULE,
  getCheckInSchedule,
  isWeighInDay,
  laCalendarDate,
  laWeekday,
  nextWeighInTimes,
  saveCheckInSchedule,
  wallTimeInZone,
  weekdayOfYmd,
} from './checkInSchedule'

describe('check-in schedule', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  afterEach(() => {
    localStorage.clear()
  })

  it('defaults to daily with Sunday weigh-in day', () => {
    expect(getCheckInSchedule()).toEqual(DEFAULT_CHECK_IN_SCHEDULE)
  })

  it('persists cadence and weekday across get', () => {
    saveCheckInSchedule({
      cadence: 'weekly',
      weeklyWeighInDay: 3,
      reminderEnabled: false,
    })
    expect(getCheckInSchedule()).toEqual({
      cadence: 'weekly',
      weeklyWeighInDay: 3,
      reminderEnabled: false,
    })
  })

  it('treats Sat Sep 5 2026 as a daily weigh-in day and weekly only if Saturday is selected', () => {
    const sat = new Date('2026-09-05T18:00:00Z') // 11:00 PDT Saturday
    expect(laCalendarDate(sat)).toBe('2026-09-05')
    expect(laWeekday(sat)).toBe(6)
    expect(isWeighInDay({ ...DEFAULT_CHECK_IN_SCHEDULE, cadence: 'daily' }, sat)).toBe(
      true
    )
    expect(
      isWeighInDay(
        { cadence: 'weekly', weeklyWeighInDay: 0, reminderEnabled: false },
        sat,
      ),
    ).toBe(false)
    expect(
      isWeighInDay(
        { cadence: 'weekly', weeklyWeighInDay: 6, reminderEnabled: false },
        sat,
      ),
    ).toBe(true)
  })

  it('schedules weekly reminders only on the selected weekday at 7am LA', () => {
    const sat = new Date('2026-09-05T18:00:00Z')
    const times = nextWeighInTimes(
      { cadence: 'weekly', weeklyWeighInDay: 0, reminderEnabled: true },
      sat,
      8,
    )
    expect(times.length).toBeGreaterThan(0)
    expect(times.every((t) => weekdayOfYmd(t.ymd) === 0)).toBe(true)
    const first = wallTimeInZone(times[0].ymd, 7, 0)
    expect(laCalendarDate(first)).toBe(times[0].ymd)
    const hour = Number(
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Los_Angeles',
        hour: 'numeric',
        hourCycle: 'h23',
      }).format(first),
    )
    const minute = Number(
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Los_Angeles',
        minute: 'numeric',
      }).format(first),
    )
    expect(hour).toBe(7)
    expect(minute).toBe(0)
  })

  it('skips today when a check-in was already submitted', () => {
    const now = new Date('2026-09-06T18:00:00Z')
    saveCheckIn({
      weight: '170',
      energy: '7',
      hunger: '5',
      sideEffects: '',
      notes: '',
      mood: 'Good',
      date: now.toISOString(),
    })
    const times = nextWeighInTimes(DEFAULT_CHECK_IN_SCHEDULE, now, 3)
    expect(times.some((t) => t.ymd === laCalendarDate(now))).toBe(false)
  })
})
