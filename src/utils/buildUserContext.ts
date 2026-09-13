import { formatPeptideSelectionsForAI } from '../constants/peptideCatalog'
import { AUTHORITATIVE_PEPTIDE_KNOWLEDGE } from '../constants/peptideKnowledge'
import { getDaysIntoCycle } from './calculations'
import {
  formatActiveStackForAI,
  formatRecentCheckInsForAI,
  formatRecentDoseLogsForAI,
  formatVialsForAI,
  getAdherencePercentage,
} from './coachHelpers'
import { getCachedPlanHealth } from './planHealth'
import { loadAdaptivePlan } from './v2Storage'
import type { TrackerState } from '../types'
import type { UserProfile } from '../types/auth'

/**
 * Full contextual payload for the AI coach on every message.
 * Includes: stack, 14d dose logs, check-ins, plan, vials, adherence.
 */
export function buildUserContextForChat(
  userProfile: UserProfile | null | undefined,
  trackerState: TrackerState
): string {
  const p = userProfile
  const t = trackerState
  const adherence7 = getAdherencePercentage(7, t)
  const adherence14 = getAdherencePercentage(14, t)
  const planHealth = getCachedPlanHealth(t)
  const adaptive = loadAdaptivePlan()

  const coachBlock = [
    '=== COACH CONTEXT (live user data — reference this) ===',
    `Day ${getDaysIntoCycle(t.profile.startDate)} of 90-day cycle`,
    `Targets: current ${t.profile.currentWeight} lbs → goal ${t.profile.goalWeight} lbs · weekly ${t.profile.weeklyLossTarget} lbs`,
    `Adherence: 7-day ${adherence7}% · 14-day ${adherence14}%`,
    `Plan health: ${planHealth.status} — ${planHealth.summary}`,
    planHealth.suggestions.length
      ? `Plan suggestions (not auto-applied): ${planHealth.suggestions.join(' | ')}`
      : '',
    '',
    formatActiveStackForAI(t),
    '',
    formatRecentDoseLogsForAI(14),
    '',
    formatRecentCheckInsForAI(14),
    '',
    formatVialsForAI(),
    '',
    t.recompPlan?.summary?.length
      ? `90-day plan summary: ${t.recompPlan.summary.join(' ')}`
      : '90-day plan summary: not generated yet.',
    adaptive?.originalSummary?.length
      ? `Original plan snapshot: ${adaptive.originalSummary.join(' ')}`
      : '',
    `Weight log count: ${t.weightHistory.length} · Workouts done: ${t.workoutCompletions.length}`,
    '=== END COACH CONTEXT ===',
  ]
    .filter(Boolean)
    .join('\n')

  if (!p) {
    return [coachBlock, '', AUTHORITATIVE_PEPTIDE_KNOWLEDGE].join('\n')
  }

  return [
    '=== USER PROFILE ===',
    `Username: ${p.username ?? 'unknown'}`,
    `Familiarity: ${p.familiarity ?? 'unknown'}`,
    `Goals: ${p.mainGoal ?? 'unknown'}`,
    `Interested peptides: ${p.interestedPeptides ?? 'none'}`,
    p.peptideSelections?.length
      ? `Peptide selections:\n${formatPeptideSelectionsForAI(p.peptideSelections)}`
      : '',
    `Gender: ${p.gender ?? 'unknown'} · Age: ${p.age ?? 'unknown'}`,
    `Training: ${p.trainingActivities ?? 'none'}`,
    `Additional info: ${p.additionalInfo ?? 'none'}`,
    '',
    coachBlock,
    '',
    '=== AUTHORITATIVE PEPTIDE KNOWLEDGE ===',
    AUTHORITATIVE_PEPTIDE_KNOWLEDGE,
  ]
    .filter(Boolean)
    .join('\n')
}
