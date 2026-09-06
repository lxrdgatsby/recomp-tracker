const PROTOCOL_TZ = 'America/Los_Angeles'
const FALLBACK_START_DATE = '2026-08-23'
const MAX_WEEK = 13

function part(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): string {
  return parts.find((p) => p.type === type)?.value ?? ''
}

function zonedYmd(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  return `${part(parts, 'year')}-${part(parts, 'month')}-${part(parts, 'day')}`
}

function resolveStartDateISO(startDateISO?: string | null): string {
  if (startDateISO && /^\d{4}-\d{2}-\d{2}/.test(startDateISO)) {
    return startDateISO.slice(0, 10)
  }
  return FALLBACK_START_DATE
}

/** Live PROTOCOL card header: local LA calendar date + 90-day week number. */
export function getProtocolHeader(
  startDateISO: string | null | undefined = FALLBACK_START_DATE,
  now: Date = new Date(),
) {
  const tz = PROTOCOL_TZ
  const startISO = resolveStartDateISO(startDateISO)
  const todayStr = zonedYmd(now, tz)
  const daysSince = Math.max(
    0,
    Math.floor(
      (Date.parse(`${todayStr}T00:00:00Z`) - Date.parse(`${startISO}T00:00:00Z`)) /
        86_400_000,
    ),
  )
  const week = Math.min(MAX_WEEK, Math.floor(daysSince / 7) + 1)
  const parts = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: tz,
  }).formatToParts(now)

  return {
    dateLabel: `${part(parts, 'weekday')}, ${part(parts, 'month')} ${part(parts, 'day')}`,
    week,
    daysSince,
  }
}
