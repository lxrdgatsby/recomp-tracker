import { STORAGE_KEY } from '../constants/defaults'

export const REMINDER_SETTINGS_KEY = 'reminderSettings'
export const REMINDER_LAST_FIRED_KEY = 'reminderLastFired'
export const REMINDER_HOME_URL = '/app#today'

export const REMINDER_IDS = {
  morning: 1001,
  evening: 1002,
  night: 1003,
  sunday: 1004,
} as const

export type ReminderSlot = 'morning' | 'evening' | 'night' | 'sunday'

export type ReminderSettings = {
  enabled: boolean
  morningTime: string
  eveningTime: string
  nightTime: string
  permission: NotificationPermission | 'unsupported'
}

export interface ShotForSlot {
  id: string
  short: string
  detail: string
}

export interface SlotShots {
  slot: ReminderSlot
  title: string
  body: string
  shots: ShotForSlot[]
}

export interface ScheduledReminder {
  tag: string
  slot: ReminderSlot
  at: number
  title: string
  body: string
}

const DEFAULTS: ReminderSettings = {
  enabled: false,
  morningTime: '07:30',
  eveningTime: '19:00',
  nightTime: '22:00',
  permission: 'default',
}

const UPCOMING_MS = 3 * 60 * 1000
const NIGHT_CATCHUP_MS = 3 * 60 * 60 * 1000
const CHANGED_EVENT = 'peptidetracker:reminders-changed'

type CapacitorLocalNotificationsPlugin = {
  requestPermissions: () => Promise<{ display?: string }>
  checkPermissions?: () => Promise<{ display?: string }>
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
      extra?: { url: string; slot: ReminderSlot }
    }>
  }) => Promise<unknown>
  cancel: (options: { notifications: Array<{ id: number }> }) => Promise<unknown>
  addListener: (
    event: string,
    cb: (event: { notification?: { extra?: { url?: string } } }) => void
  ) => Promise<unknown>
}

let capacitorTapBound = false

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function isNotificationSupported(): boolean {
  return isBrowser() && 'Notification' in window
}

export function getNotificationPermission():
  | NotificationPermission
  | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported'
  return Notification.permission
}

export function parseTime(value: string): { hour: number; minute: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
  return { hour, minute }
}

export function normalizeTime(value: string, fallback: string): string {
  const parsed = parseTime(value)
  if (!parsed) return fallback
  return `${String(parsed.hour).padStart(2, '0')}:${String(parsed.minute).padStart(2, '0')}`
}

export function formatReminderClock(hhmm: string): string {
  const parsed = parseTime(hhmm)
  if (!parsed) return hhmm
  const hour12 = parsed.hour % 12 || 12
  return `${hour12}:${String(parsed.minute).padStart(2, '0')}`
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function lastFiredKey(slot: ReminderSlot, dateIso: string): string {
  return `${slot}-${dateIso}`
}

function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  if (!isBrowser()) return
  localStorage.setItem(key, JSON.stringify(value))
}

function emitChanged() {
  if (!isBrowser()) return
  window.dispatchEvent(new Event(CHANGED_EVENT))
}

export function getProtocolStartDate(): string | null {
  if (!isBrowser()) return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { profile?: { startDate?: string } }
      if (parsed.profile?.startDate) return parsed.profile.startDate
    }
  } catch {
    // ignore corrupt tracker state
  }
  return localStorage.getItem('protocolStartDate')
}

/** Week 1 before start date. Week 2+ begins 7 days after protocol start. */
export function getProtocolWeek(date: Date, startDate = getProtocolStartDate()): number {
  if (!startDate) return 1
  const start = parseLocalDate(startDate)
  start.setHours(0, 0, 0, 0)
  const day = new Date(date)
  day.setHours(0, 0, 0, 0)
  const diff = Math.round((day.getTime() - start.getTime()) / 86_400_000)
  if (diff < 0) return 1
  return Math.floor(diff / 7) + 1
}

function livePermission(): NotificationPermission | 'unsupported' {
  return getNotificationPermission()
}

function resolvePermission(
  stored?: ReminderSettings['permission']
): ReminderSettings['permission'] {
  const live = livePermission()
  if (live === 'granted' || live === 'denied') return live
  if (stored === 'granted' || stored === 'denied' || stored === 'unsupported') {
    return stored
  }
  return live
}

export function getReminderSettings(): ReminderSettings {
  const stored = readJson<Partial<ReminderSettings>>(REMINDER_SETTINGS_KEY, {})
  return {
    enabled: Boolean(stored.enabled),
    morningTime: normalizeTime(stored.morningTime ?? DEFAULTS.morningTime, DEFAULTS.morningTime),
    eveningTime: normalizeTime(stored.eveningTime ?? DEFAULTS.eveningTime, DEFAULTS.eveningTime),
    nightTime: normalizeTime(stored.nightTime ?? DEFAULTS.nightTime, DEFAULTS.nightTime),
    permission: resolvePermission(stored.permission),
  }
}

export function saveReminderSettings(
  next: ReminderSettings
): ReminderSettings {
  const settings: ReminderSettings = {
    enabled: Boolean(next.enabled),
    morningTime: normalizeTime(next.morningTime, DEFAULTS.morningTime),
    eveningTime: normalizeTime(next.eveningTime, DEFAULTS.eveningTime),
    nightTime: normalizeTime(next.nightTime, DEFAULTS.nightTime),
    permission: next.permission ?? livePermission(),
  }
  writeJson(REMINDER_SETTINGS_KEY, settings)
  emitChanged()
  return settings
}

export function getReminderStatusLabel(
  permission: ReminderSettings['permission']
): 'Allowed' | 'Blocked' | 'Not enabled' {
  if (permission === 'granted') return 'Allowed'
  if (permission === 'denied') return 'Blocked'
  return 'Not enabled'
}

export function getReminderBellText(settings = getReminderSettings()): string {
  if (!settings.enabled) return 'Reminders off'
  return `Reminders on · Morning ${formatReminderClock(settings.morningTime)} · Evening ${formatReminderClock(settings.eveningTime)} · Night ${formatReminderClock(settings.nightTime)}`
}

function isMwf(date: Date): boolean {
  const dow = date.getDay()
  return dow === 1 || dow === 3 || dow === 5
}

function phaseUnits(week: number) {
  if (week <= 1) {
    return { tesa: 7.5, aod: 15, ss31: 15, ghk: 3, klow: 15, mots: 15, nad: 25, reta: 50 }
  }
  if (week <= 4) {
    return { tesa: 15, aod: 30, ss31: 15, ghk: 3, klow: 15, mots: 15, nad: 25, reta: 50 }
  }
  if (week <= 8) {
    return { tesa: 21, aod: 30, ss31: 30, ghk: 6, klow: 30, mots: 30, nad: 50, reta: 80 }
  }
  return { tesa: 30, aod: 30, ss31: 30, ghk: 6, klow: 30, mots: 30, nad: 50, reta: 80 }
}

export function getShotsForSlot(slot: ReminderSlot, date: Date): SlotShots {
  const week = getProtocolWeek(date)
  const u = phaseUnits(week)
  const mwf = isMwf(date)

  if (slot === 'morning') {
    const shots: ShotForSlot[] = [
      { id: 'aod9604', short: 'AOD', detail: `AOD ${u.aod}u` },
      { id: 'ss31', short: 'SS-31', detail: `SS-31 ${u.ss31}u` },
      { id: 'ghkcu', short: 'GHK-Cu', detail: `GHK-Cu ${u.ghk}u` },
    ]
    if (mwf) {
      shots.push({ id: 'motsc', short: 'MOTS-c', detail: `MOTS-c ${u.mots}u` })
    }
    const names = [`AOD ${u.aod}u`, 'SS-31', 'GHK-Cu']
    if (mwf) names.push('MOTS-c')
    return { slot, title: 'Morning shots', body: names.join(' + '), shots }
  }

  if (slot === 'evening') {
    const shots: ShotForSlot[] = [
      { id: 'klow', short: 'KLOW', detail: `KLOW ${u.klow}u` },
      { id: 'bpc157', short: 'BPC', detail: 'BPC 10u' },
    ]
    if (mwf) {
      shots.push({ id: 'nad', short: 'NAD+', detail: `NAD+ ${u.nad}u` })
    }
    const names = ['KLOW', 'BPC']
    if (mwf) names.push('NAD+')
    return { slot, title: 'Evening shots', body: names.join(' + '), shots }
  }

  if (slot === 'night') {
    return {
      slot,
      title: 'Nightly shot',
      body: `Tesamorelin ${u.tesa}u — take 2–3h after last food`,
      shots: [
        {
          id: 'tesamorelin',
          short: 'Tesamorelin',
          detail: `Tesamorelin ${u.tesa}u`,
        },
      ],
    }
  }

  const tesaLabel = week >= 2 ? `Tesamorelin ${u.tesa}u` : 'Tesamorelin'
  return {
    slot,
    title: 'Weekly shots',
    body: `Test 0.75 mL + Reta ${u.reta}u + ${tesaLabel}`,
    shots: [
      { id: 'test-cyp', short: 'Test', detail: 'Test 0.75 mL' },
      { id: 'retatrutide', short: 'Reta', detail: `Reta ${u.reta}u` },
      { id: 'tesamorelin', short: 'Tesamorelin', detail: `Tesamorelin ${u.tesa}u` },
    ],
  }
}

function slotTime(settings: ReminderSettings, slot: ReminderSlot): string {
  if (slot === 'morning') return settings.morningTime
  if (slot === 'night') return settings.nightTime
  return settings.eveningTime
}

function atTimeOnDay(day: Date, hhmm: string): Date {
  const parsed = parseTime(hhmm) ?? { hour: 0, minute: 0 }
  const next = new Date(day)
  next.setHours(parsed.hour, parsed.minute, 0, 0)
  return next
}

export function isSlotDueNow(
  slot: ReminderSlot,
  now: Date,
  settings: ReminderSettings
): boolean {
  if (slot === 'sunday' && now.getDay() !== 0) return false
  const start = atTimeOnDay(now, slotTime(settings, slot))
  const t = now.getTime()
  if (t >= start.getTime() - UPCOMING_MS && t < start.getTime()) return true
  if (t < start.getTime()) return false

  let cutoff = start
  if (slot === 'morning') cutoff = atTimeOnDay(now, settings.eveningTime)
  else if (slot === 'evening' || slot === 'sunday') {
    cutoff = atTimeOnDay(now, settings.nightTime)
  } else {
    cutoff = new Date(start.getTime() + NIGHT_CATCHUP_MS)
  }
  if (cutoff.getTime() <= start.getTime()) {
    cutoff = new Date(start.getTime() + NIGHT_CATCHUP_MS)
  }
  return t < cutoff.getTime()
}

function getLastFired(): Record<string, number> {
  return readJson<Record<string, number>>(REMINDER_LAST_FIRED_KEY, {})
}

export function hasFiredSlot(slot: ReminderSlot, dateIso: string): boolean {
  return Boolean(getLastFired()[lastFiredKey(slot, dateIso)])
}

export function markFiredSlot(slot: ReminderSlot, dateIso: string, at = Date.now()) {
  const map = getLastFired()
  map[lastFiredKey(slot, dateIso)] = at
  const keys = Object.keys(map).sort()
  if (keys.length > 60) {
    for (const key of keys.slice(0, keys.length - 60)) delete map[key]
  }
  writeJson(REMINDER_LAST_FIRED_KEY, map)
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

async function bindCapacitorTapHandler(plugin: CapacitorLocalNotificationsPlugin) {
  if (capacitorTapBound) return
  capacitorTapBound = true
  try {
    await plugin.addListener('localNotificationActionPerformed', (event) => {
      const url = event.notification?.extra?.url || REMINDER_HOME_URL
      if (typeof window !== 'undefined') {
        window.location.assign(url)
      }
    })
  } catch {
    capacitorTapBound = false
  }
}

export async function showReminderNotification(payload: {
  title: string
  body: string
  tag?: string
  url?: string
}): Promise<void> {
  const permission = resolvePermission(getReminderSettings().permission)
  const live = isNotificationSupported() ? Notification.permission : 'unsupported'
  if (permission !== 'granted' && live !== 'granted') return
  const tag = payload.tag ?? `peptide-${Date.now()}`
  const url = payload.url ?? REMINDER_HOME_URL
  const options = {
    body: payload.body,
    tag,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url },
    silent: false,
  } as NotificationOptions & { data: { url: string } }
  try {
    if (isBrowser() && navigator.serviceWorker) {
      const reg = await navigator.serviceWorker.ready
      await reg.showNotification(payload.title, options)
      return
    }
  } catch {
    // fall through to page Notification
  }
  try {
    if (isNotificationSupported() && Notification.permission === 'granted') {
      new Notification(payload.title, options)
    }
  } catch {
    // native / Capacitor path handles display
  }
}

async function showTestNotification() {
  await showReminderNotification({
    title: 'Reminders enabled',
    body: 'Morning, Evening, and Nightly research-use reminders are on.',
    tag: 'reminder-test',
  })
}

export async function requestNotificationPermission(options?: {
  silent?: boolean
}): Promise<NotificationPermission | 'unsupported'> {
  const native = await getCapacitorLocalNotifications()
  if (native) {
    const result = await native.requestPermissions()
    const display = result.display ?? 'prompt'
    const permission: NotificationPermission | 'unsupported' =
      display === 'granted' ? 'granted' : display === 'denied' ? 'denied' : 'default'
    const current = getReminderSettings()
    saveReminderSettings({ ...current, permission })
    if (permission === 'granted' && !options?.silent) await showTestNotification()
    return permission
  }

  if (!isNotificationSupported()) {
    const current = getReminderSettings()
    saveReminderSettings({ ...current, permission: 'unsupported' })
    return 'unsupported'
  }
  const permission =
    Notification.permission === 'default'
      ? await Notification.requestPermission()
      : Notification.permission
  const current = getReminderSettings()
  saveReminderSettings({ ...current, permission })
  if (permission === 'granted' && !options?.silent) await showTestNotification()
  return permission
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

export function buildUpcomingReminders(
  settings = getReminderSettings(),
  from = new Date(),
  days = 7
): ScheduledReminder[] {
  const out: ScheduledReminder[] = []
  for (let i = 0; i < days; i += 1) {
    const day = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i)
    const iso = toIsoDate(day)
    const slots: ReminderSlot[] = ['morning', 'evening', 'night']
    if (day.getDay() === 0) slots.push('sunday')
    for (const slot of slots) {
      const when = atTimeOnDay(day, slotTime(settings, slot))
      if (when.getTime() < from.getTime() - 60_000) continue
      const payload = getShotsForSlot(slot, when)
      out.push({
        tag: lastFiredKey(slot, iso),
        slot,
        at: when.getTime(),
        title: payload.title,
        body: payload.body,
      })
    }
  }
  return out
}

async function registerPeriodicBackgroundSync(): Promise<boolean> {
  if (!isBrowser() || !navigator.serviceWorker) return false
  try {
    const reg = await navigator.serviceWorker.ready
    const periodic = (
      reg as ServiceWorkerRegistration & {
        periodicSync?: {
          register: (tag: string, options: { minInterval: number }) => Promise<void>
        }
      }
    ).periodicSync
    if (!periodic) return false
    await periodic.register('peptide-reminders', {
      minInterval: 60 * 60 * 1000,
    })
    return true
  } catch {
    return false
  }
}

async function cancelCapacitorReminders(
  plugin: CapacitorLocalNotificationsPlugin
) {
  await plugin.cancel({
    notifications: [
      { id: REMINDER_IDS.morning },
      { id: REMINDER_IDS.evening },
      { id: REMINDER_IDS.night },
      { id: REMINDER_IDS.sunday },
    ],
  })
}

async function scheduleCapacitorReminders(
  settings: ReminderSettings
): Promise<boolean> {
  const plugin = await getCapacitorLocalNotifications()
  if (!plugin) return false
  await bindCapacitorTapHandler(plugin)
  await cancelCapacitorReminders(plugin)

  const morning = parseTime(settings.morningTime) ?? { hour: 7, minute: 30 }
  const evening = parseTime(settings.eveningTime) ?? { hour: 19, minute: 0 }
  const night = parseTime(settings.nightTime) ?? { hour: 22, minute: 0 }
  const today = new Date()
  const morningBody = getShotsForSlot('morning', today).body.replace(
    ' + MOTS-c',
    ''
  )
  const eveningBody = getShotsForSlot('evening', today).body.replace(
    ' + NAD+',
    ''
  )
  const nightBody = getShotsForSlot('night', today).body
  const sundayBody = getShotsForSlot('sunday', today).body

  await plugin.schedule({
    notifications: [
      {
        id: REMINDER_IDS.morning,
        title: 'Morning shots',
        body: morningBody,
        schedule: {
          on: { hour: morning.hour, minute: morning.minute },
          allowWhileIdle: true,
          repeats: true,
        },
        extra: { url: REMINDER_HOME_URL, slot: 'morning' },
      },
      {
        id: REMINDER_IDS.evening,
        title: 'Evening shots',
        body: eveningBody,
        schedule: {
          on: { hour: evening.hour, minute: evening.minute },
          allowWhileIdle: true,
          repeats: true,
        },
        extra: { url: REMINDER_HOME_URL, slot: 'evening' },
      },
      {
        id: REMINDER_IDS.night,
        title: 'Nightly shot',
        body: nightBody,
        schedule: {
          on: { hour: night.hour, minute: night.minute },
          allowWhileIdle: true,
          repeats: true,
        },
        extra: { url: REMINDER_HOME_URL, slot: 'night' },
      },
      {
        id: REMINDER_IDS.sunday,
        title: 'Weekly shots',
        body: sundayBody,
        schedule: {
          on: { weekday: 1, hour: evening.hour, minute: evening.minute },
          allowWhileIdle: true,
          repeats: true,
        },
        extra: { url: REMINDER_HOME_URL, slot: 'sunday' },
      },
    ],
  })
  return true
}

export async function cancelReminders(): Promise<void> {
  const plugin = await getCapacitorLocalNotifications()
  if (plugin) {
    try {
      await cancelCapacitorReminders(plugin)
    } catch {
      // native plugin unavailable
    }
  }
  await postToServiceWorker({ type: 'PEPTIDETRACKER_CANCEL' })
}

let scheduling = false
let scheduleAgain = false

export async function scheduleReminders(): Promise<void> {
  if (scheduling) {
    scheduleAgain = true
    return
  }
  scheduling = true
  try {
    do {
      scheduleAgain = false
      await scheduleRemindersInner()
    } while (scheduleAgain)
  } finally {
    scheduling = false
  }
}

async function scheduleRemindersInner(): Promise<void> {
  const settings = getReminderSettings()
  if (!settings.enabled || settings.permission !== 'granted') {
    await cancelReminders()
    return
  }

  await scheduleCapacitorReminders(settings).catch(() => false)
  const upcoming = buildUpcomingReminders(settings, new Date(), 8)
  await postToServiceWorker({
    type: 'PEPTIDETRACKER_SET_SCHEDULE',
    reminders: upcoming,
    fired: getLastFired(),
  })
  await registerPeriodicBackgroundSync()
  await checkAndFireDueReminders()
}

export async function checkAndFireDueReminders(now = new Date()): Promise<string[]> {
  const settings = getReminderSettings()
  if (!settings.enabled || settings.permission !== 'granted') return []
  const iso = toIsoDate(now)
  const slots: ReminderSlot[] = ['morning', 'evening', 'night']
  if (now.getDay() === 0) slots.push('sunday')
  const fired: string[] = []
  for (const slot of slots) {
    if (hasFiredSlot(slot, iso)) continue
    if (!isSlotDueNow(slot, now, settings)) continue
    const payload = getShotsForSlot(slot, now)
    if (!payload.body) continue
    await showReminderNotification({
      title: payload.title,
      body: payload.body,
      tag: lastFiredKey(slot, iso),
    })
    markFiredSlot(slot, iso, now.getTime())
    fired.push(lastFiredKey(slot, iso))
  }
  return fired
}

export async function enableNotifications(): Promise<ReminderSettings> {
  const permission = await requestNotificationPermission()
  const current = getReminderSettings()
  const enabled = permission === 'granted' ? true : current.enabled
  const next = saveReminderSettings({ ...current, permission, enabled })
  if (next.enabled && next.permission === 'granted') {
    await scheduleReminders()
  }
  return next
}

export async function setRemindersEnabled(enabled: boolean): Promise<ReminderSettings> {
  let permission = livePermission()
  if (enabled && permission !== 'granted' && permission !== 'unsupported') {
    permission = await requestNotificationPermission()
  }
  const current = getReminderSettings()
  const next = saveReminderSettings({
    ...current,
    enabled: enabled && permission !== 'unsupported',
    permission,
  })
  if (next.enabled && next.permission === 'granted') await scheduleReminders()
  else await cancelReminders()
  return next
}

export async function updateReminderTimes(
  patch: Partial<Pick<ReminderSettings, 'morningTime' | 'eveningTime' | 'nightTime'>>
): Promise<ReminderSettings> {
  const current = getReminderSettings()
  const next = saveReminderSettings({ ...current, ...patch })
  if (next.enabled && next.permission === 'granted') await scheduleReminders()
  return next
}

export function startReminderRuntime(): () => void {
  if (!isBrowser()) return () => undefined

  const boot = () => {
    void scheduleReminders()
  }

  boot()

  const onVis = () => {
    if (document.visibilityState === 'visible') boot()
  }

  document.addEventListener('visibilitychange', onVis)
  window.addEventListener('focus', onVis)
  const interval = window.setInterval(() => {
    if (document.visibilityState === 'visible') {
      void checkAndFireDueReminders()
    }
  }, 30_000)

  return () => {
    document.removeEventListener('visibilitychange', onVis)
    window.removeEventListener('focus', onVis)
    window.clearInterval(interval)
  }
}

export const REMINDER_CHANGED_EVENT = CHANGED_EVENT
export const DEFAULT_REMINDER_SETTINGS = DEFAULTS
