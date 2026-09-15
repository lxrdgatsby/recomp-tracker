import { Bell } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { SAFETY_COPY } from '../../lib/protocolSeed'
import {
  enableNotifications,
  getReminderSettings,
  getReminderStatusLabel,
  REMINDER_CHANGED_EVENT,
  setRemindersEnabled,
  updateReminderTimes,
  type ReminderSettings,
} from '../../lib/reminders'

function useReminderSettingsState() {
  const [settings, setSettings] = useState<ReminderSettings>(() =>
    getReminderSettings()
  )

  useEffect(() => {
    const sync = () => setSettings(getReminderSettings())
    window.addEventListener(REMINDER_CHANGED_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(REMINDER_CHANGED_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return [settings, setSettings] as const
}

export function RemindersCard() {
  const [settings, setSettings] = useReminderSettingsState()
  const [busy, setBusy] = useState(false)
  const status = getReminderStatusLabel(settings.permission)
  const blocked = settings.permission === 'denied'
  const granted = settings.permission === 'granted'
  const unsupported = settings.permission === 'unsupported'

  const run = useCallback(async (work: () => Promise<ReminderSettings>) => {
    setBusy(true)
    try {
      setSettings(await work())
    } finally {
      setBusy(false)
    }
  }, [setSettings])

  return (
    <section
      id="reminders"
      className="rounded-2xl border border-white/10 bg-white/5 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
            <Bell className="text-emerald-400" size={18} />
          </div>
          <div>
            <h2 className="text-sm font-medium text-white">Reminders</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Morning, Evening, and Nightly research-use reminders
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={settings.enabled}
          aria-label="Toggle reminders"
          disabled={busy}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (busy) return
            void run(() => setRemindersEnabled(!settings.enabled))
          }}
          className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center overflow-hidden rounded-full border-0 p-0 touch-manipulation transition disabled:opacity-50 ${
            settings.enabled ? 'bg-emerald-500' : 'bg-zinc-700'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow transition-transform ${
              settings.enabled ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium tracking-wide text-slate-400 uppercase">
            Morning
          </span>
          <input
            type="time"
            value={settings.morningTime}
            disabled={busy}
            onChange={(e) =>
              void run(() => updateReminderTimes({ morningTime: e.target.value }))
            }
            className="w-full rounded-lg border border-slate-700 bg-navy-950 px-3 py-2.5 text-base text-slate-100 focus:border-teal-500/60 focus:outline-none"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium tracking-wide text-slate-400 uppercase">
            Evening
          </span>
          <input
            type="time"
            value={settings.eveningTime}
            disabled={busy}
            onChange={(e) =>
              void run(() => updateReminderTimes({ eveningTime: e.target.value }))
            }
            className="w-full rounded-lg border border-slate-700 bg-navy-950 px-3 py-2.5 text-base text-slate-100 focus:border-teal-500/60 focus:outline-none"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium tracking-wide text-slate-400 uppercase">
            Night
          </span>
          <input
            type="time"
            value={settings.nightTime}
            disabled={busy}
            onChange={(e) =>
              void run(() => updateReminderTimes({ nightTime: e.target.value }))
            }
            className="w-full rounded-lg border border-slate-700 bg-navy-950 px-3 py-2.5 text-base text-slate-100 focus:border-teal-500/60 focus:outline-none"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-400">
          Status:{' '}
          <span
            className={
              settings.enabled
                ? 'text-emerald-400'
                : blocked
                  ? 'text-amber-300'
                  : 'text-slate-300'
            }
          >
            {settings.enabled
              ? granted
                ? 'On · notifications allowed'
                : unsupported
                  ? 'On · in-app only (add to Home Screen for lock-screen alerts)'
                  : 'On · tap Enable notifications'
              : status}
          </span>
        </p>
        {!granted && !unsupported && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void run(() => enableNotifications())}
            className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
          >
            Enable notifications
          </button>
        )}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        On iPhone: Add to Home Screen, then allow notifications.
      </p>
      {blocked && (
        <p className="mt-2 text-xs leading-relaxed text-amber-200/90">
          Notifications are blocked. On iPhone: Settings → Notifications → PepTrack
          → Allow Notifications. If this is a Home Screen web app, delete it and
          add it again, then allow when prompted.
        </p>
      )}
      <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
        Research-use reminders only. Not medical advice. Reminders never auto-log
        doses. {SAFETY_COPY}
      </p>
    </section>
  )
}
