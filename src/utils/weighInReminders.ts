import {
  requestNotificationPermission,
  showReminderNotification,
} from '../lib/reminders'
import {
  getCheckInSchedule,
  hasWeighInLoggedToday,
  isWeighInDay,
  laCalendarDate,
  nextWeighInTimes,
  type CheckInSchedule,
} from './checkInSchedule'

export const WEIGH_IN_REMINDER_ID = 2101
export const WEIGH_IN_PROGRESS_URL = '/app/progress'
export const WEIGH_IN_LAST_FIRED_KEY = 'weighInReminderLastFired'
export const WEIGH_IN_TITLE = 'Weigh-in reminder'
export const WEIGH_IN_BODY = "Log today's weight in PeptideTracker."

type CapacitorLocalNotificationsPlugin = {
  requestPermissions: () => Promise<{ display?: string }>
  schedule: (options: {
    notifications: Array<{
      id: number
      title: string
      body: string
      schedule: {
        on: { weekday?: number; hour: number; minute: number }
        allowWhileIdle: boolean
        repeats?: boolean
      }
      extra?: { url: string; slot: string }
    }>
  }) => Promise<unknown>
  cancel: (options: { notifications: Array<{ id: number }> }) => Promise<unknown>
}

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function readFired(): Record<string, number> {
  if (!isBrowser()) return {}
  try {
    const raw = localStorage.getItem(WEIGH_IN_LAST_FIRED_KEY)
    return raw ? (JSON.parse(raw) as Record<string, number>) : {}
  } catch {
    return {}
  }
}

function writeFired(map: Record<string, number>) {
  if (!isBrowser()) return
  localStorage.setItem(WEIGH_IN_LAST_FIRED_KEY, JSON.stringify(map))
}

export function weighInFiredKey(ymd: string): string {
  return `weighin-${ymd}`
}

export function hasFiredWeighIn(ymd: string): boolean {
  return Boolean(readFired()[weighInFiredKey(ymd)])
}

export function markWeighInFired(ymd: string, at = Date.now()) {
  const map = readFired()
  map[weighInFiredKey(ymd)] = at
  const keys = Object.keys(map).sort()
  if (keys.length > 60) {
    for (const key of keys.slice(0, keys.length - 60)) delete map[key]
  }
  writeFired(map)
}

async function getCapacitorLocalNotifications(): Promise<CapacitorLocalNotificationsPlugin | null> {
  if (!isBrowser()) return null
  try {
    const coreName = '@capacitor/' + 'core'
    const pluginName = '@capacitor/' + 'local-notifications'
    const core = (await import(/* @vite-ignore */ coreName)) as {
      Capacitor?: { isNativePlatform?: () => boolean }
    }
    if (!core.Capacitor?.isNativePlatform?.()) return null
    const mod = (await import(/* @vite-ignore */ pluginName)) as {
      LocalNotifications?: CapacitorLocalNotificationsPlugin
    }
    return mod.LocalNotifications ?? null
  } catch {
    return null
  }
}

async function postToServiceWorker(message: unknown) {
  if (!isBrowser() || !navigator.serviceWorker) return
  try {
    const reg = await navigator.serviceWorker.ready
    reg.active?.postMessage(message)
  } catch {
    // no SW
  }
}

async function cancelNativeWeighIn() {
  const plugin = await getCapacitorLocalNotifications()
  if (!plugin) return
  try {
    await plugin.cancel({ notifications: [{ id: WEIGH_IN_REMINDER_ID }] })
  } catch {
    // native plugin unavailable
  }
}

async function scheduleNativeWeighIn(schedule: CheckInSchedule): Promise<boolean> {
  const plugin = await getCapacitorLocalNotifications()
  if (!plugin) return false
  await cancelNativeWeighIn()
  const on =
    schedule.cadence === 'weekly'
      ? {
          weekday: schedule.weeklyWeighInDay + 1,
          hour: 7,
          minute: 0,
        }
      : { hour: 7, minute: 0 }
  await plugin.schedule({
    notifications: [
      {
        id: WEIGH_IN_REMINDER_ID,
        title: WEIGH_IN_TITLE,
        body: WEIGH_IN_BODY,
        schedule: { on, allowWhileIdle: true, repeats: true },
        extra: { url: WEIGH_IN_PROGRESS_URL, slot: 'weighin' },
      },
    ],
  })
  return true
}

export function buildUpcomingWeighIns(
  schedule = getCheckInSchedule(),
  now = new Date(),
) {
  if (!schedule.reminderEnabled) return []
  return nextWeighInTimes(schedule, now, 8)
    .filter((item) => !hasFiredWeighIn(item.ymd))
    .map((item) => ({
      tag: weighInFiredKey(item.ymd),
      slot: 'weighin' as const,
      at: item.at,
      title: WEIGH_IN_TITLE,
      body: WEIGH_IN_BODY,
      url: WEIGH_IN_PROGRESS_URL,
    }))
}

export async function cancelWeighInReminders(): Promise<void> {
  await cancelNativeWeighIn()
  await postToServiceWorker({ type: 'PEPTIDETRACKER_CANCEL_WEIGHIN' })
}

let scheduling = false
let scheduleAgain = false

export async function scheduleWeighInReminders(): Promise<void> {
  if (scheduling) {
    scheduleAgain = true
    return
  }
  scheduling = true
  try {
    do {
      scheduleAgain = false
      await scheduleWeighInRemindersInner()
    } while (scheduleAgain)
  } finally {
    scheduling = false
  }
}

async function scheduleWeighInRemindersInner(): Promise<void> {
  const schedule = getCheckInSchedule()
  const permission =
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  if (!schedule.reminderEnabled || permission !== 'granted') {
    await cancelWeighInReminders()
    return
  }
  await scheduleNativeWeighIn(schedule).catch(() => false)
  await postToServiceWorker({
    type: 'PEPTIDETRACKER_SET_WEIGHIN_SCHEDULE',
    reminders: buildUpcomingWeighIns(schedule),
    fired: readFired(),
  })
  await checkAndFireWeighInReminder()
}

export async function checkAndFireWeighInReminder(now = new Date()): Promise<boolean> {
  const schedule = getCheckInSchedule()
  if (!schedule.reminderEnabled) return false
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    return false
  }
  if (!isWeighInDay(schedule, now)) return false
  if (hasWeighInLoggedToday(now)) return false
  const ymd = laCalendarDate(now)
  if (hasFiredWeighIn(ymd)) return false

  const upcoming = nextWeighInTimes(schedule, now, 1)
  const due = upcoming.find((item) => item.ymd === ymd && item.at <= now.getTime() + 3 * 60 * 1000)
  if (!due) return false

  await showReminderNotification({
    title: WEIGH_IN_TITLE,
    body: WEIGH_IN_BODY,
    tag: weighInFiredKey(ymd),
    url: WEIGH_IN_PROGRESS_URL,
  })
  markWeighInFired(ymd, now.getTime())
  return true
}

export async function requestWeighInPermission(): Promise<
  NotificationPermission | 'unsupported'
> {
  return requestNotificationPermission({ silent: true })
}

export async function setWeighInReminderEnabled(
  enabled: boolean,
): Promise<NotificationPermission | 'unsupported'> {
  if (!enabled) {
    await cancelWeighInReminders()
    return typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  }
  const permission = await requestWeighInPermission()
  if (permission === 'granted') await scheduleWeighInReminders()
  else await cancelWeighInReminders()
  return permission
}

export function startWeighInReminderRuntime(): () => void {
  if (!isBrowser()) return () => undefined

  const boot = () => {
    void scheduleWeighInReminders()
  }
  boot()

  const onVis = () => {
    if (document.visibilityState === 'visible') boot()
  }
  const onSchedule = () => boot()

  document.addEventListener('visibilitychange', onVis)
  window.addEventListener('focus', onVis)
  window.addEventListener('peptidetracker:checkin-schedule-changed', onSchedule)
  const interval = window.setInterval(() => {
    if (document.visibilityState === 'visible') {
      void checkAndFireWeighInReminder()
    }
  }, 30_000)

  return () => {
    document.removeEventListener('visibilitychange', onVis)
    window.removeEventListener('focus', onVis)
    window.removeEventListener('peptidetracker:checkin-schedule-changed', onSchedule)
    window.clearInterval(interval)
  }
}
