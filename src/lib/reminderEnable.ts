import {
  cancelReminders,
  getNotificationPermission,
  getReminderSettings,
  requestNotificationPermission,
  saveReminderSettings,
  scheduleReminders,
  type ReminderSettings,
} from './reminders'

export async function enableNotifications(): Promise<ReminderSettings> {
  let permission: ReminderSettings['permission'] = getNotificationPermission()
  try {
    permission = await requestNotificationPermission()
  } catch {
    permission = getNotificationPermission()
  }
  const current = getReminderSettings()
  const next = saveReminderSettings({
    ...current,
    permission,
    enabled: true,
  })
  if (next.permission === 'granted') {
    await scheduleReminders()
  }
  return next
}

export async function setRemindersEnabled(
  enabled: boolean
): Promise<ReminderSettings> {
  let permission = getNotificationPermission()
  if (enabled && permission !== 'granted' && permission !== 'unsupported') {
    try {
      permission = await requestNotificationPermission()
    } catch {
      permission = getNotificationPermission()
    }
  }
  const current = getReminderSettings()
  const next = saveReminderSettings({
    ...current,
    enabled,
    permission,
  })
  if (next.enabled && next.permission === 'granted') await scheduleReminders()
  else if (!next.enabled) await cancelReminders()
  return next
}
