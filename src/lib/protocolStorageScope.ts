/**
 * Plan cache is per signed-in user.
 * lxrdgatsby keeps the original unscoped keys so his on-device history stays put.
 * Everyone else reads and writes key::userId, and never falls through to his cache.
 */

let activeUserId: string | null = null
let legacy = true

export const PROTOCOL_LOCAL_KEYS = [
  'recomp-tracker-v1',
  'activeStack',
  'vials',
  'scheduledDoses',
  'checkIns',
  'checkInHistory',
  'lastCheckIn',
  'checkInSchedule',
  'startWeight',
  'targetWeight',
  'goalNote',
  'protocolStartDate',
  'protocolDefinitionVersion',
  'onboardingData',
  'ninetyDayPlan',
  'doseCalculator',
  'injectionSites',
  'pt-v2-vials',
  'pt-v2-dose-logs',
  'pt-v2-blends',
  'pt-v2-check-ins',
  'pt-v2-compounds',
  'pt-v2-adaptive-plan',
  'workoutLogs',
  'workoutSetLogs',
  'reminderSettings',
  'reminderLastFired',
  'weighInReminderLastFired',
  'migration_vial_sizes_v2',
  'vialInventorySeeded_lxrdgatsby_v4',
] as const

const LXRD_SEED_FLAG = 'protocolSeeded_lxrdgatsby'

export function usesLegacyProtocolStorage(): boolean {
  return legacy || !activeUserId
}

export function setProtocolStorageScope(
  userId: string | null,
  useLegacyKeys: boolean
): void {
  activeUserId = userId
  legacy = useLegacyKeys || !userId
  if (!legacy && userId && typeof localStorage !== 'undefined') {
    adoptUnownedLegacyCache(userId)
  }
}

export function resetProtocolStorageScope(): void {
  activeUserId = null
  legacy = true
}

export function scopedStorageKey(base: string): string {
  if (usesLegacyProtocolStorage()) return base
  return `${base}::${activeUserId}`
}

export function readLocal(key: string): string | null {
  try {
    return localStorage.getItem(scopedStorageKey(key))
  } catch {
    return null
  }
}

export function writeLocal(key: string, value: string): void {
  localStorage.setItem(scopedStorageKey(key), value)
}

export function removeLocal(key: string): void {
  localStorage.removeItem(scopedStorageKey(key))
}

/**
 * A browser that has never stored lxrdgatsby’s plan can keep its one local
 * cache by copying it into the signed-in user’s namespace once.
 * If his seed flag is present, leave those keys alone.
 */
function adoptUnownedLegacyCache(userId: string): void {
  try {
    if (localStorage.getItem(LXRD_SEED_FLAG) === 'true') return
    const marker = `protocolScopeAdopted::${userId}`
    if (localStorage.getItem(marker) === 'true') return
    for (const key of PROTOCOL_LOCAL_KEYS) {
      const scoped = `${key}::${userId}`
      if (localStorage.getItem(scoped) != null) continue
      const raw = localStorage.getItem(key)
      if (raw != null) localStorage.setItem(scoped, raw)
    }
    localStorage.setItem(marker, 'true')
  } catch {
    /* ignore quota */
  }
}
