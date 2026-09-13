/**
 * Adaptive 90-day recomp engine — Plan Health evaluation.
 * Transparent rules; suggestions never auto-apply.
 */

import { differenceInDays, parseISO } from 'date-fns'
import type { PlanHealth, PlanHealthStatus } from '../types/v2'
import type { TrackerState } from '../types'
import {
  getAdherencePercentage,
  getRecentCheckIns,
} from './coachHelpers'
import { loadAdaptivePlan, saveAdaptivePlan } from './v2Storage'

function computeWeightTrend(
  state: TrackerState,
  windowDays = 14
): { trend: number | null; spanDays: number; stalledDays: number | null } {
  const weights = [...state.weightHistory]
    .filter((w) => {
      try {
        return differenceInDays(new Date(), parseISO(w.date)) <= windowDays + 5
      } catch {
        return false
      }
    })
    .sort((a, b) => a.date.localeCompare(b.date))

  if (weights.length < 2) {
    return { trend: null, spanDays: 0, stalledDays: null }
  }

  const first = weights[0]
  const last = weights[weights.length - 1]
  const spanDays = Math.max(
    1,
    differenceInDays(parseISO(last.date), parseISO(first.date))
  )
  const delta = last.weight - first.weight
  const trend = Math.round((delta / spanDays) * 7 * 10) / 10

  // Stall: little change over 10+ days while we have enough span
  let stalledDays: number | null = null
  if (spanDays >= 10 && Math.abs(delta) < 0.5) {
    stalledDays = spanDays
  } else {
    // Look for last 10+ day window with <0.5 lb change ending at latest entry
    for (let i = 0; i < weights.length - 1; i++) {
      const a = weights[i]
      const days = differenceInDays(parseISO(last.date), parseISO(a.date))
      if (days >= 10 && Math.abs(last.weight - a.weight) < 0.5) {
        stalledDays = days
        break
      }
    }
  }

  return { trend, spanDays, stalledDays }
}

/**
 * Evaluate plan health from weight trend, energy, adherence, and notes.
 * Call weekly or after enough check-ins; result cached in localStorage.
 */
export function evaluatePlanHealth(state: TrackerState): PlanHealth {
  const adherence7d = getAdherencePercentage(7, state)
  const adherence14d = getAdherencePercentage(14, state)
  const checkIns = getRecentCheckIns(14)
  const { trend: weightTrendLbsPerWeek, stalledDays } =
    computeWeightTrend(state, 14)

  const energyVals = checkIns
    .map((c) => c.energy)
    .filter((e): e is number => typeof e === 'number')
  const avgEnergy =
    energyVals.length > 0
      ? Math.round(
          (energyVals.reduce((a, b) => a + b, 0) / energyVals.length) * 10
        ) / 10
      : null

  // Side effects / issue notes in recent check-ins
  const issueNotes = checkIns
    .filter(
      (c) =>
        (c.sideEffects && c.sideEffects.trim() && c.sideEffects !== 'none') ||
        (c.notes &&
          /side|nausea|fatigue|sick|issue|pain|headache/i.test(c.notes))
    )
    .slice(0, 3)

  const weeklyTarget = Math.abs(state.profile.weeklyLossTarget || 0.875)
  const isLossGoal =
    state.profile.goalWeight < state.profile.currentWeight ||
    (state.profile.weeklyLossTarget ?? 0) > 0

  const suggestions: string[] = []
  let status: PlanHealthStatus = 'on_track'
  let summary = 'Plan looks on track — keep executing consistently.'

  // Priority 1: low adherence → consistency over optimization
  if (adherence7d < 70) {
    status = 'needs_attention'
    summary =
      'Adherence is under 70% this week — focus on consistency before optimizing.'
    suggestions.push(
      'Anchor doses to a fixed daily alarm and the same prep routine.',
      'Use Home → Log Dose for each scheduled peptide (even missed days).',
      'Simplify: one less variable this week (same site rotation pattern, same time).'
    )
  }

  // Priority 2: weight dropping significantly faster than plan
  if (
    isLossGoal &&
    weightTrendLbsPerWeek != null &&
    weightTrendLbsPerWeek < -weeklyTarget * 1.5
  ) {
    status = 'adjust'
    summary =
      'Weight is dropping significantly faster than your planned rate.'
    suggestions.push(
      'Review daily calories — a small increase (150–250 kcal) may help if energy is dipping.',
      'Hold any planned dose titration for a week and reassess.',
      'Keep protein high and sleep 7–9h before changing peptides.'
    )
  }

  // Priority 2b: stall 10+ days with high adherence
  if (
    stalledDays != null &&
    stalledDays >= 10 &&
    adherence14d >= 80 &&
    status !== 'adjust'
  ) {
    status = 'adjust'
    summary = `Weight has stalled for about ${stalledDays} days while adherence is strong.`
    suggestions.push(
      'Consider a small calorie deficit tweak or step-count bump if fat loss is the goal.',
      'Verify scale conditions (same time, fasted) before changing the plan.',
      'If already lean, a short diet break (5–7 days at maintenance) can restore progress later.'
    )
  }

  // Priority 3: low energy week
  if (avgEnergy != null && avgEnergy <= 4) {
    if (status === 'on_track') status = 'needs_attention'
    if (status === 'needs_attention' && adherence7d >= 70) {
      summary = 'Average energy has been ≤4/10 — recovery may need attention.'
    }
    suggestions.push(
      'Prioritize sleep (7–9h) and one easier training day this week.',
      'Review dose timing (morning vs evening) if fatigue clusters after injections.',
      'If low energy continues, pause aggressive deficits and talk with your clinician.'
    )
  }

  // Side effect notes
  if (issueNotes.length > 0) {
    if (status === 'on_track') status = 'needs_attention'
    suggestions.push(
      'Recent notes mention side effects or issues — ease intensity and document patterns for your clinician.'
    )
  }

  if (
    adherence7d >= 85 &&
    status === 'on_track' &&
    (avgEnergy == null || avgEnergy >= 5)
  ) {
    summary = 'Strong adherence and stable signals — stay the course.'
  }

  if (
    weightTrendLbsPerWeek == null &&
    avgEnergy == null &&
    state.weightHistory.length === 0 &&
    checkIns.length === 0
  ) {
    status = 'unknown'
    summary =
      'Not enough data yet — log weight and check-ins to unlock Plan Health.'
  }

  const health: PlanHealth = {
    status,
    summary,
    suggestions: [...new Set(suggestions)].slice(0, 5),
    evaluatedAt: new Date().toISOString(),
    adherence7d,
    weightTrendLbsPerWeek,
    avgEnergy,
  }

  const existing = loadAdaptivePlan()
  saveAdaptivePlan({
    originalSummary:
      existing?.originalSummary ?? state.recompPlan?.summary ?? [],
    originalGeneratedAt:
      existing?.originalGeneratedAt ?? state.recompPlan?.generatedAt,
    lastEvaluation: health,
    adjustments: existing?.adjustments ?? [],
  })

  return health
}

/** Return cached evaluation if fresh (<7 days), else re-run. */
export function getCachedPlanHealth(state: TrackerState): PlanHealth {
  const cached = loadAdaptivePlan()?.lastEvaluation
  if (cached?.evaluatedAt) {
    try {
      const age = differenceInDays(
        new Date(),
        parseISO(cached.evaluatedAt.slice(0, 10))
      )
      if (age < 7) return cached
    } catch {
      /* re-evaluate */
    }
  }
  return evaluatePlanHealth(state)
}

export function planHealthBadgeClass(status: PlanHealthStatus): string {
  switch (status) {
    case 'on_track':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    case 'needs_attention':
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
    case 'adjust':
      return 'bg-orange-500/15 text-orange-400 border-orange-500/30'
    default:
      return 'bg-white/10 text-slate-400 border-white/15'
  }
}

export function planHealthLabel(status: PlanHealthStatus): string {
  switch (status) {
    case 'on_track':
      return 'On Track'
    case 'needs_attention':
      return 'Needs Attention'
    case 'adjust':
      return 'Adjust Recommended'
    default:
      return 'Gathering data'
  }
}
