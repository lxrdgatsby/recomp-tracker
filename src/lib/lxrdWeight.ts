import {
  CURRENT_WEIGHT_LB,
  GOAL_WEIGHT_LB,
  START_WEIGHT_LB,
  WEEKLY_LOSS_LB,
  WEIGHT_AS_OF,
} from '../constants/reconstitutionTable'
import type { TrackerState, WeightEntry } from '../types'

function dayOf(entry: WeightEntry): string {
  return entry.date.slice(0, 10)
}

/**
 * lxrdgatsby targets: start 165, goal 145.
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
      goalWeight: GOAL_WEIGHT_LB,
      currentWeight: latest?.weight ?? CURRENT_WEIGHT_LB,
      weeklyLossTarget: WEEKLY_LOSS_LB,
    },
  }
}
