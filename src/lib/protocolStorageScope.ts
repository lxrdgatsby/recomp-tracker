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

export function usesLegacyProtocolStorage(): boolean {
  return legacy || !activeUserId
}

export function setProtocolStorageScope(
  userId: string | null,
  useLegacyKeys: boolean
): void {
  activeUserId = userId
  legacy = useLegacyKeys || !userId
}

/** Plan, stack, vial, and dose keys. Never the unscoped lxrdgatsby cache. */
const SCOPED_PLAN_KEYS = [
  'recomp-tracker-v1',
  'activeStack',
  'vials',
  'pt-v2-vials',
  'pt-v2-dose-logs',
  'scheduledDoses',
  'onboardingData',
  'ninetyDayPlan',
  'doseCalculator',
  'protocolStartDate',
  'protocolDefinitionVersion',
  'checkIns',
  'checkInHistory',
  'lastCheckIn',
] as const

/**
 * Drop a not-yet-onboarded account's scoped plan cache.
 * Unscoped keys stay, so lxrdgatsby's on-device history is not touched.
 */
export function clearScopedPlanCache(userId: string): void {
  if (!userId || typeof localStorage === 'undefined') return
  try {
    for (const key of SCOPED_PLAN_KEYS) {
      localStorage.removeItem(`${key}::${userId}`)
    }
  } catch {
    /* ignore quota */
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
