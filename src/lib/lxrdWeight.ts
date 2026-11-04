import {
  CURRENT_WEIGHT_LB,
  START_WEIGHT_LB,
  WEEKLY_LOSS_LB,
  WEIGHT_AS_OF,
} from '../constants/reconstitutionTable'
import type { TrackerState, WeightEntry } from '../types'

function dayOf(entry: WeightEntry): string {
  return entry.date.slice(0, 10)
}

const CUT_GOAL_LB = 145
const BULK_GOAL_LB = 186
const BULK_SWITCH_DATE = '2026-12-01'

/** Goal is 145 until Dec 1, 2026, then 186 for the Lautner bulk. */
export function getLxrdGoalWeight(asOf: Date = new Date()): number {
  const ymd = asOf.toISOString().slice(0, 10)
  return ymd >= BULK_SWITCH_DATE ? BULK_GOAL_LB : CUT_GOAL_LB
}

export function daysUntilBulkSwitch(asOf: Date = new Date()): number {
  const switchDate = new Date(BULK_SWITCH_DATE + 'T00:00:00')
  const diff = switchDate.getTime() - asOf.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

/**
 * lxrdgatsby targets: start 165, goal 145 until Dec 1 then 186.
 * Current weight is the newest log. 156 lb is recorded on Oct 21 only when
 * nothing on or after that date exists. Older points are left in place.
 */
export function applyLxrdWeightTargets(state: TrackerState): TrackerState {
  const history = [...(state.weightHistory ?? [])]
  const hasCurrentWindow = history.some((entry) => dayOf(entry) >= WEIGHT_AS_OF)
  if (!hasCurrentWindow) {
    history.push({ date: WEIGHT_AS_OF, weight: CURRENT_WEIGHT_LB })
    history.sort((a, b) => dayOf(a).localeCompare(dayOf(b)))
  }
  const latest = [...history].sort((a, b) => dayOf(b).localeCompare(dayOf(a)))[0]
  return {
    ...state,
    weightHistory: history,
    profile: {
      ...state.profile,
      startWeight: START_WEIGHT_LB,
      goalWeight: getLxrdGoalWeight(),
      currentWeight: latest?.weight ?? CURRENT_WEIGHT_LB,
      weeklyLossTarget: WEEKLY_LOSS_LB,
    },
  }
}
