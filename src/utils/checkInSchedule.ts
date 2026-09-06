import type { CheckInCadence, Profile } from '../types'
import { STORAGE_KEY } from '../constants/defaults'
import { hasCheckInOnCalendarDate } from './checkInStorage'

export const CHECK_IN_SCHEDULE_KEY = 'checkInSchedule'
export const CHECK_IN_SCHEDULE_CHANGED = 'peptidetracker:checkin-schedule-changed'
export const WEIGH_IN_TZ = 'America/Los_Angeles'
export const WEIGH_IN_HOUR = 7
export const WEIGH_IN_MINUTE = 0
export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
export const WEEKDAY_LONG = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

export interface CheckInSchedule {
  cadence: CheckInCadence
  weeklyWeighInDay: number
  reminderEnabled: boolean
}

export const DEFAULT_CHECK_IN_SCHEDULE: CheckInSchedule = {
  cadence: 'daily',
  weeklyWeighInDay: 0,
  reminderEnabled: false,
}

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function clampDay(value: unknown): number {
  const n = Number(value)
  if (!Number.isInteger(n) || n < 0 || n > 6) return 0
  return n
}

function normalizeSchedule(raw: Partial<CheckInSchedule> | null | undefined): CheckInSchedule {
  return {
    cadence: raw?.cadence === 'weekly' ? 'weekly' : 'daily',
    weeklyWeighInDay: clampDay(raw?.weeklyWeighInDay),
    reminderEnabled: Boolean(raw?.reminderEnabled),
  }
}

function scheduleFromProfile(profile?: Partial<Profile> | null): CheckInSchedule {
  return normalizeSchedule({
    cadence: profile?.checkInCadence,
    weeklyWeighInDay: profile?.weeklyWeighInDay,
    reminderEnabled: profile?.weighInReminderEnabled,
  })
}

export function laCalendarDate(date: Date, timeZone = WEIGH_IN_TZ): string {
  return date.toLocaleDateString('en-CA', { timeZone })
}

export function laWeekday(date: Date, timeZone = WEIGH_IN_TZ): number {
  const wd = date.toLocaleDateString('en-US', { weekday: 'short', timeZone })
  const idx = WEEKDAY_SHORT.indexOf(wd as (typeof WEEKDAY_SHORT)[number])
  return idx >= 0 ? idx : date.getDay()
}

export function wallTimeInZone(
  ymd: string,
  hour: number,
  minute: number,
  timeZone = WEIGH_IN_TZ,
): Date {
  const [year, month, day] = ymd.split('-').map(Number)
  let guess = Date.UTC(year, month - 1, day, hour, minute, 0)
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })
  const partsOf = (ms: number) => {
    const p = fmt.formatToParts(new Date(ms))
    const g = (type: Intl.DateTimeFormatPartTypes) =>
      Number(p.find((x) => x.type === type)?.value ?? '0')
    return {
      y: g('year'),
      m: g('month'),
      d: g('day'),
      h: g('hour'),
      min: g('minute'),
      s: g('second'),
    }
  }
  for (let i = 0; i < 4; i++) {
    const got = partsOf(guess)
    const gotUtc = Date.UTC(got.y, got.m - 1, got.d, got.h, got.min, got.s)
    const wantUtc = Date.UTC(year, month - 1, day, hour, minute, 0)
    const delta = wantUtc - gotUtc
    if (delta === 0) break
    guess += delta
  }
  return new Date(guess)
}

export function addCalendarDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const utc = Date.UTC(y, m - 1, d + days)
  const date = new Date(utc)
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

export function weekdayOfYmd(ymd: string): number {
  const noonUtc = new Date(`${ymd}T12:00:00Z`)
  return laWeekday(noonUtc)
}

export function isWeighInDay(schedule: CheckInSchedule, now = new Date()): boolean {
  if (schedule.cadence !== 'weekly') return true
  return laWeekday(now) === schedule.weeklyWeighInDay
}

export function getCheckInSchedule(profile?: Partial<Profile> | null): CheckInSchedule {
  if (!isBrowser()) return scheduleFromProfile(profile)
  try {
    const raw = localStorage.getItem(CHECK_IN_SCHEDULE_KEY)
    if (raw) return normalizeSchedule(JSON.parse(raw) as Partial<CheckInSchedule>)
  } catch {
    // ignore corrupt schedule
  }
  return scheduleFromProfile(profile)
}

function patchTrackerProfile(schedule: CheckInSchedule) {
  if (!isBrowser()) return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const state = JSON.parse(raw) as { profile?: Profile }
    state.profile = {
      ...(state.profile ?? {}),
      checkInCadence: schedule.cadence,
      weeklyWeighInDay: schedule.weeklyWeighInDay,
      weighInReminderEnabled: schedule.reminderEnabled,
    } as Profile
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore quota / parse errors
  }
}

export function saveCheckInSchedule(schedule: CheckInSchedule): CheckInSchedule {
  const next = normalizeSchedule(schedule)
  if (isBrowser()) {
    localStorage.setItem(CHECK_IN_SCHEDULE_KEY, JSON.stringify(next))
    patchTrackerProfile(next)
    window.dispatchEvent(new Event(CHECK_IN_SCHEDULE_CHANGED))
  }
  return next
}

export function syncCheckInScheduleFromProfile(profile?: Partial<Profile> | null): CheckInSchedule {
  if (!isBrowser()) return scheduleFromProfile(profile)
  try {
    if (localStorage.getItem(CHECK_IN_SCHEDULE_KEY)) return getCheckInSchedule(profile)
  } catch {
    // fall through
  }
  const fromProfile = scheduleFromProfile(profile)
  if (
    profile?.checkInCadence ||
    profile?.weeklyWeighInDay != null ||
    profile?.weighInReminderEnabled
  ) {
    return saveCheckInSchedule(fromProfile)
  }
  return fromProfile
}

export function hasWeighInLoggedToday(now = new Date()): boolean {
  return hasCheckInOnCalendarDate(laCalendarDate(now))
}

export function nextWeighInTimes(
  schedule: CheckInSchedule,
  now = new Date(),
  days = 8,
): { at: number; ymd: string }[] {
  const today = laCalendarDate(now)
  const out: { at: number; ymd: string }[] = []
  for (let i = 0; i < days; i++) {
    const ymd = addCalendarDays(today, i)
    if (schedule.cadence === 'weekly' && weekdayOfYmd(ymd) !== schedule.weeklyWeighInDay) {
      continue
    }
    if (i === 0 && hasWeighInLoggedToday(now)) continue
    const at = wallTimeInZone(ymd, WEIGH_IN_HOUR, WEIGH_IN_MINUTE).getTime()
    if (at <= now.getTime() - 60_000) continue
    out.push({ at, ymd })
  }
  return out
}
