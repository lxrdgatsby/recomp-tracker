import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { STORAGE_KEY } from '../constants/defaults'
import {
  buildUpcomingReminders,
  formatReminderClock,
  getProtocolWeek,
  getReminderBellText,
  getReminderSettings,
  getReminderStatusLabel,
  getShotsForSlot,
  isSlotDueNow,
  lastFiredKey,
  parseTime,
  saveReminderSettings,
  toIsoDate,
  type ReminderSettings,
} from './reminders'

function setStart(iso: string) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ profile: { startDate: iso } })
  )
}

const defaults: ReminderSettings = {
  enabled: true,
  morningTime: '07:30',
  eveningTime: '19:00',
  nightTime: '22:00',
  permission: 'granted',
}

describe('reminders', () => {
  beforeEach(() => {
    localStorage.clear()
    setStart('2026-08-23')
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('parses and formats times', () => {
    expect(parseTime('07:30')).toEqual({ hour: 7, minute: 30 })
    expect(parseTime('19:00')).toEqual({ hour: 19, minute: 0 })
    expect(formatReminderClock('07:30')).toBe('7:30')
    expect(formatReminderClock('19:00')).toBe('7:00')
    expect(formatReminderClock('22:00')).toBe('10:00')
  })

  it('uses week 1 doses before week 2', () => {
    expect(getProtocolWeek(new Date(2026, 7, 23))).toBe(1)
    expect(getProtocolWeek(new Date(2026, 7, 29))).toBe(1)
    expect(getProtocolWeek(new Date(2026, 7, 30))).toBe(2)
  })

  it('builds morning shots with MOTS-c on M/W/F', () => {
    const tue = getShotsForSlot('morning', new Date(2026, 7, 25))
    expect(tue.title).toBe('Morning shots')
    expect(tue.body).toBe('AOD 15u + SS-31 + GHK-Cu')
    expect(tue.shots.map((s) => s.short)).toEqual(['AOD', 'SS-31', 'GHK-Cu'])

    const mon = getShotsForSlot('morning', new Date(2026, 7, 24))
    expect(mon.body).toBe('AOD 15u + SS-31 + MOTS-c + GHK-Cu')
    expect(mon.shots.some((s) => s.short === 'MOTS-c')).toBe(true)
  })

  it('uses week 2+ AOD units in morning text', () => {
    const week2Mon = getShotsForSlot('morning', new Date(2026, 7, 31))
    expect(week2Mon.body).toBe('AOD 30u + SS-31 + MOTS-c + GHK-Cu')
  })

  it('inserts 5-Amino-1MQ from Sept 15 at 15 u, then 30 u from Sept 17', () => {
    const sept14 = getShotsForSlot('morning', new Date(2026, 8, 14))
    expect(sept14.shots.some((s) => s.id === 'amino1mq')).toBe(false)

    const sept15 = getShotsForSlot('morning', new Date(2026, 8, 15))
    expect(sept15.body).toContain('5-Amino-1MQ')
    expect(sept15.shots.find((s) => s.id === 'amino1mq')?.detail).toBe(
      '5-Amino-1MQ 15u'
    )

    const sept17 = getShotsForSlot('morning', new Date(2026, 8, 17))
    expect(sept17.shots.find((s) => s.id === 'amino1mq')?.detail).toBe(
      '5-Amino-1MQ 30u'
    )
  })

  it('builds evening shots with NAD+ on M/W/F', () => {
    const tue = getShotsForSlot('evening', new Date(2026, 7, 25))
    expect(tue.title).toBe('Evening shots')
    expect(tue.body).toBe('KLOW + BPC')

    const wed = getShotsForSlot('evening', new Date(2026, 7, 26))
    expect(wed.body).toBe('KLOW + NAD+ + BPC')
  })

  it('builds nightly tesamorelin with fasted note and week 2 units', () => {
    const w1 = getShotsForSlot('night', new Date(2026, 7, 23))
    expect(w1.title).toBe('Nightly shot')
    expect(w1.body).toBe('Tesamorelin 7.5u — take 2–3h after last food')

    const w2 = getShotsForSlot('night', new Date(2026, 7, 30))
    expect(w2.body).toBe('Tesamorelin 15u — take 2–3h after last food')
  })

  it('builds sunday weekly shots', () => {
    const sun = getShotsForSlot('sunday', new Date(2026, 7, 23))
    expect(sun.title).toBe('Weekly shots')
    expect(sun.body).toBe('Test 0.75 mL + Reta 50u + Tesamorelin')

    const week2Sun = getShotsForSlot('sunday', new Date(2026, 7, 30))
    expect(week2Sun.body).toBe('Test 0.75 mL + Reta 50u + Tesamorelin 15u')
  })

  it('does not mention buying or medical advice in bodies', () => {
    const date = new Date(2026, 7, 24)
    const bodies = (['morning', 'evening', 'night', 'sunday'] as const)
      .map((slot) => getShotsForSlot(slot, date).body)
      .join(' ')
      .toLowerCase()
    expect(bodies).not.toMatch(/buy|purchase|order|prescribe|medical advice/)
  })

  it('builds lastFired keys per slot and day', () => {
    expect(lastFiredKey('morning', '2026-08-23')).toBe('morning-2026-08-23')
  })

  it('fires a slot in the upcoming window and until the next slot', () => {
    const morningSoon = new Date(2026, 7, 24, 7, 28, 0)
    expect(isSlotDueNow('morning', morningSoon, defaults)).toBe(true)

    const morningCatchup = new Date(2026, 7, 24, 10, 0, 0)
    expect(isSlotDueNow('morning', morningCatchup, defaults)).toBe(true)

    const afterEvening = new Date(2026, 7, 24, 19, 30, 0)
    expect(isSlotDueNow('morning', afterEvening, defaults)).toBe(false)
    expect(isSlotDueNow('evening', afterEvening, defaults)).toBe(true)

    const night = new Date(2026, 7, 24, 22, 15, 0)
    expect(isSlotDueNow('night', night, defaults)).toBe(true)
    expect(isSlotDueNow('evening', night, defaults)).toBe(false)

    const saturday = new Date(2026, 7, 22, 19, 0, 0)
    expect(isSlotDueNow('sunday', saturday, defaults)).toBe(false)
    const sundayEve = new Date(2026, 7, 23, 19, 5, 0)
    expect(isSlotDueNow('sunday', sundayEve, defaults)).toBe(true)
  })

  it('schedules the next 7 days including sunday extras', () => {
    const from = new Date(2026, 7, 22, 8, 0, 0)
    const upcoming = buildUpcomingReminders(defaults, from, 7)
    expect(upcoming.some((r) => r.slot === 'sunday')).toBe(true)
    expect(upcoming.some((r) => r.tag.startsWith('morning-'))).toBe(true)
    expect(upcoming.every((r) => r.at >= from.getTime() - 60_000)).toBe(true)
  })

  it('persists reminder settings and bell copy', () => {
    saveReminderSettings({
      enabled: true,
      morningTime: '07:30',
      eveningTime: '19:00',
      nightTime: '22:00',
      permission: 'default',
    })
    const stored = getReminderSettings()
    expect(stored.enabled).toBe(true)
    expect(stored.morningTime).toBe('07:30')
    expect(getReminderBellText(stored)).toBe(
      'Reminders on · Morning 7:30 · Evening 7:00 · Night 10:00'
    )
    expect(getReminderBellText({ ...stored, enabled: false })).toBe(
      'Reminders off'
    )
    expect(getReminderStatusLabel('granted')).toBe('Allowed')
    expect(getReminderStatusLabel('denied')).toBe('Blocked')
    expect(getReminderStatusLabel('default')).toBe('Not enabled')
    expect(toIsoDate(new Date(2026, 7, 23))).toBe('2026-08-23')
  })
})
